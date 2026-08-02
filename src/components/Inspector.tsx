import { useEffect, useRef, useState } from "react";
import SmilesDrawer from "smiles-drawer";
import type { Metabolite, Pathway, Reaction, Selection } from "../types";
import { explain } from "../lib/enrich";
import { resolveSmiles } from "../lib/structure";

function StructureCanvas({ smiles }: { smiles: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const drawer = new SmilesDrawer.Drawer({
        width: 260,
        height: 170,
        bondThickness: 1,
        atomVisualization: "default",
        themes: {
          dark: {
            C: "#E8EEF4", O: "#E2564B", N: "#48C9D9", P: "#F2A93B",
            F: "#90ee90", CL: "#90ee90", BR: "#90ee90", I: "#90ee90",
            H: "#E8EEF4", S: "#FFD166", B: "#E8EEF4", SI: "#E8EEF4",
            BACKGROUND: "#0d141c",
          },
        },
      });
      SmilesDrawer.parse(
        smiles,
        (tree: unknown) => drawer.draw(tree, canvas, "dark", false),
        () => {},
      );
    } catch {
      /* leave canvas blank on parse failure */
    }
  }, [smiles]);
  return (
    <canvas
      ref={canvasRef}
      width={260}
      height={170}
      style={{ width: "100%", maxWidth: 260, borderRadius: 6, background: "#0d141c" }}
    />
  );
}

const label: React.CSSProperties = {
  fontFamily: "var(--font-condensed)",
  fontSize: 10,
  letterSpacing: "0.09em",
  textTransform: "uppercase",
  color: "#7D8B9C",
  marginBottom: 6,
};

// Render inline **bold** spans.
function inline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) => {
    const m = p.match(/^\*\*([^*]+)\*\*$/);
    return m ? <strong key={`${keyBase}-${i}`} style={{ color: "#E8EEF4", fontWeight: 600 }}>{m[1]}</strong> : <span key={`${keyBase}-${i}`}>{p}</span>;
  });
}

// Minimal markdown for the exam-guide content: **Header** lines, "- " bullets,
// paragraphs, and inline **bold**.
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  const flush = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} style={{ margin: "4px 0 10px", paddingLeft: 18 }}>
          {bullets.map((b, i) => (
            <li key={i} style={{ fontSize: 13.5, lineHeight: 1.55, color: "#C7D2DE", marginBottom: 4 }}>{inline(b, `li${blocks.length}-${i}`)}</li>
          ))}
        </ul>,
      );
      bullets = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    const h = line.match(/^\*\*(.+?)\*\*:?$/);
    if (h) {
      flush();
      blocks.push(
        <div key={`h-${idx}`} style={{ fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.07em", textTransform: "uppercase", color: "#48C9D9", fontWeight: 600, margin: "16px 0 6px" }}>
          {h[1]}
        </div>,
      );
      return;
    }
    const b = line.match(/^[-•]\s+(.*)$/);
    if (b) { bullets.push(b[1]); return; }
    flush();
    blocks.push(<p key={`p-${idx}`} style={{ fontSize: 13.5, lineHeight: 1.65, color: "#C7D2DE", margin: "0 0 10px" }}>{inline(line, `p${idx}`)}</p>);
  });
  flush();
  return <div>{blocks}</div>;
}

function MetaboliteView({ m }: { m: Metabolite }) {
  const [smiles, setSmiles] = useState(m.smiles);
  const [state, setState] = useState<"have" | "loading" | "none">(m.smiles ? "have" : "loading");
  const [fullName, setFullName] = useState("");
  const [explanation, setExplanation] = useState(m.explanation);

  useEffect(() => {
    let cancelled = false;
    setFullName("");
    setExplanation(m.explanation);
    setSmiles(m.smiles);
    setState(m.smiles ? "have" : "loading");

    (async () => {
      // Always fetch the extensive exam-style write-up (and full name), curated
      // or live. The full name also drives structure lookup for live metabolites.
      const ai = await explain("metabolite", m.name, `${m.compartment ?? ""} ${m.explanation ?? ""}`.trim());
      if (cancelled) return;
      let full = "";
      if (ai.fullName && ai.fullName.toLowerCase() !== m.name.toLowerCase()) { setFullName(ai.fullName); full = ai.fullName; }
      if (ai.explanation) setExplanation(ai.explanation);

      // Curated metabolites already have a structure; only live ones need lookup.
      if (!m.smiles) {
        const s = await resolveSmiles({ name: m.name, fullName: full || undefined, entityId: m.entityId });
        if (cancelled) return;
        if (s) { setSmiles(s); setState("have"); } else setState("none");
      }
    })();
    return () => { cancelled = true; };
  }, [m.id, m.name, m.smiles, m.compartment, m.explanation]);

  return (
    <>
      <div style={label}>Metabolite{m.carbons ? ` · ${m.carbons}C` : ""}{m.compartment ? ` · ${m.compartment}` : ""}</div>
      <h2 style={{ margin: "0 0 2px", fontSize: 20, fontWeight: 600 }}>{m.name}</h2>
      {fullName && <div style={{ fontSize: 13, color: "#7D8B9C", marginBottom: 14 }}>{fullName}</div>}
      {!fullName && <div style={{ marginBottom: 14 }} />}
      {state === "have" && <StructureCanvas smiles={smiles} />}
      {state === "loading" && (
        <div style={{ width: "100%", maxWidth: 260, height: 170, borderRadius: 6, background: "#0d141c", display: "flex", alignItems: "center", justifyContent: "center", color: "#5C6B85", fontSize: 12 }}>
          fetching structure…
        </div>
      )}
      {state === "none" && (
        <div style={{ width: "100%", maxWidth: 260, borderRadius: 6, background: "#0d141c", padding: "20px 14px", color: "#5C6B85", fontSize: 12, textAlign: "center" }}>
          No 2D structure available for this entity.
        </div>
      )}
      {state === "have" && (
        <div style={{ fontSize: 10, color: "#5C6B85", marginTop: 6, fontFamily: "var(--font-mono)" }}>
          SMILES via {m.smiles ? m.smilesSource : "PubChem"}
        </div>
      )}
      {explanation && <div style={{ marginTop: 18 }}><MarkdownLite text={explanation} /></div>}
    </>
  );
}

// Big-picture overview of the whole pathway PLUS a numbered walkthrough of
// every step. The overview is AI-written server-side (cached); each step row is
// tappable to open its full explanation.
function PathwayOverview({ pathway, onSelect }: { pathway: Pathway; onSelect?: (s: Selection) => void }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setText("");
    const enzymes = pathway.reactions.map((r) => r.enzyme).slice(0, 20).join(", ");
    const ctx = `${pathway.subtitle}. Steps/enzymes: ${enzymes}.`;
    explain("pathway", pathway.name, ctx).then((ai) => {
      if (cancelled) return;
      setText(ai.explanation || "");
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [pathway.id, pathway.name, pathway.subtitle, pathway.reactions]);

  const mName = (id: string) => pathway.metabolites.find((m) => m.id === id)?.abbr ?? id;

  return (
    <>
      <div style={label}>About this pathway</div>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>{pathway.name}</h2>
      <div style={{ fontSize: 12, color: "#7D8B9C", fontFamily: "var(--font-mono)", marginBottom: 16 }}>{pathway.subtitle}</div>
      {loading ? (
        <div style={{ fontSize: 13, color: "#5C6B85" }}>Writing overview…</div>
      ) : text ? (
        <MarkdownLite text={text} />
      ) : (
        <p style={{ fontSize: 13, color: "#5C6B85" }}>Overview unavailable — tap any step below.</p>
      )}

      <div style={{ ...label, marginTop: 24 }}>The steps · tap for detail</div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
        {pathway.reactions.map((r, i) => (
          <li key={r.id}>
            <button
              onClick={() => onSelect?.({ kind: "reaction", id: r.id })}
              style={{
                width: "100%", textAlign: "left", display: "flex", gap: 10, alignItems: "baseline",
                padding: "9px 8px", borderRadius: 6, border: "none", background: "transparent", cursor: "pointer",
                borderBottom: "1px solid #131A22",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#131A22")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#48C9D9", minWidth: 18 }}>{r.number ?? i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#E8EEF4" }}>{r.enzyme}</span>
                <span style={{ display: "block", fontSize: 12, color: "#7D8B9C", fontFamily: "var(--font-mono)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {r.substrates.map(mName).join(" + ")} → {r.products.map(mName).join(" + ")}
                </span>
              </span>
              <span style={{ color: "#3a4d63", fontSize: 14 }}>›</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

function ReactionView({ r, pathway }: { r: Reaction; pathway: Pathway }) {
  const name = (id: string) => pathway.metabolites.find((m) => m.id === id)?.name ?? id;
  const [explanation, setExplanation] = useState(r.explanation);
  const [aiNotes, setAiNotes] = useState(false);
  const [loadingAi, setLoadingAi] = useState(true);

  // Always fetch the extensive exam-style write-up (curated and live alike),
  // seeding it with whatever facts we already have.
  useEffect(() => {
    setExplanation(r.explanation);
    setAiNotes(false);
    setLoadingAi(true);
    let cancelled = false;
    const eq = `${r.substrates.map(name).join(" + ")} -> ${r.products.map(name).join(" + ")}`;
    const ctx = `${eq}.${r.ec ? ` EC ${r.ec}.` : ""}${r.gene ? ` Gene ${r.gene}.` : ""}${r.compartment ? ` Compartment: ${r.compartment}.` : ""} ${r.explanation}`;
    explain("reaction", r.enzyme, ctx).then((ai) => {
      if (cancelled) return;
      if (ai.explanation) { setExplanation(ai.explanation); setAiNotes(true); }
      setLoadingAi(false);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r.id]);

  return (
    <>
      <div style={label}>{r.ec ? `Enzyme · EC ${r.ec}` : "Reaction"}</div>
      <h2 style={{ margin: "0 0 4px", fontSize: 20, fontWeight: 600 }}>{r.enzyme}</h2>
      {(r.gene || r.compartment) && (
        <div style={{ fontSize: 12, color: "#7D8B9C", fontFamily: "var(--font-mono)", marginBottom: 16 }}>
          {r.gene ? `gene ${r.gene}` : r.compartment}
        </div>
      )}

      <div style={label}>Reaction</div>
      <div style={{ fontSize: 14, color: "#C7D2DE", marginBottom: 16 }}>
        {r.substrates.map(name).join(" + ") || "—"} → {r.products.map(name).join(" + ") || "—"}
      </div>

      {(r.deltaATP !== 0 || r.deltaNADH !== 0) && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {r.deltaATP !== 0 && (
            <span style={pill(r.deltaATP > 0)}>
              {r.deltaATP > 0 ? "+" : ""}{r.deltaATP} ATP{r.multiplicity > 1 ? ` ×${r.multiplicity}` : ""}
            </span>
          )}
          {r.deltaNADH !== 0 && (
            <span style={pill(true)}>
              +{r.deltaNADH} NADH{r.multiplicity > 1 ? ` ×${r.multiplicity}` : ""}
            </span>
          )}
        </div>
      )}

      <MarkdownLite text={explanation} />
      {loadingAi && <div style={{ fontSize: 12, color: "#5C6B85", marginTop: 6 }}>✦ expanding study notes…</div>}
      {aiNotes && !loadingAi && (
        <div style={{ fontSize: 10, color: "#5C6B85", marginTop: 8, fontFamily: "var(--font-mono)" }}>✦ AI study notes</div>
      )}

      {r.references.length > 0 && (
        <>
          <div style={{ ...label, marginTop: 20 }}>{r.references[0].url.includes("reactome.org") ? "Source" : "Literature"}</div>
          {r.references.map((ref) => (
            <a
              key={ref.pmid}
              href={ref.url}
              target="_blank"
              rel="noreferrer"
              style={{ display: "block", fontSize: 13, color: "#48C9D9", textDecoration: "none", marginBottom: 6, fontFamily: "var(--font-mono)" }}
            >
              {ref.url.includes("reactome.org") ? `Reactome ${ref.pmid} ↗` : `PMID ${ref.pmid} ↗`}
            </a>
          ))}
        </>
      )}
    </>
  );
}

function pill(positive: boolean): React.CSSProperties {
  return {
    fontFamily: "var(--font-mono)",
    fontSize: 11,
    padding: "3px 8px",
    borderRadius: 4,
    background: positive ? "rgba(255,209,102,0.12)" : "rgba(226,86,75,0.12)",
    color: positive ? "#FFD166" : "#E2564B",
    border: `1px solid ${positive ? "rgba(255,209,102,0.25)" : "rgba(226,86,75,0.25)"}`,
  };
}

export default function Inspector({
  selection,
  pathway,
  mode = "sidebar",
  onClose,
  onSelect,
}: {
  selection: Selection;
  pathway: Pathway;
  mode?: "sidebar" | "sheet";
  onClose?: () => void;
  onSelect?: (s: Selection) => void;
}) {
  let body: React.ReactNode;
  if (!selection || selection.kind === "about") {
    body = <PathwayOverview pathway={pathway} onSelect={onSelect} />;
  } else if (selection.kind === "metabolite") {
    const m = pathway.metabolites.find((x) => x.id === selection.id);
    body = m ? <MetaboliteView m={m} /> : null;
  } else {
    const r = pathway.reactions.find((x) => x.id === selection.id);
    body = r ? <ReactionView r={r} pathway={pathway} /> : null;
  }

  if (mode === "sheet") {
    return (
      <aside
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 900,
          maxHeight: "62vh", background: "#0d141c",
          borderTop: "1px solid #233042", borderTopLeftRadius: 14, borderTopRightRadius: 14,
          padding: "16px 20px 24px", overflowY: "auto",
          boxShadow: "0 -18px 40px rgba(0,0,0,0.45)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <span style={{ width: 36, height: 4, borderRadius: 2, background: "#2a3644" }} />
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          style={{ position: "absolute", top: 12, right: 14, background: "transparent", border: "none", color: "#7D8B9C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
        >
          ×
        </button>
        {body}
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 340,
        flexShrink: 0,
        borderLeft: "1px solid #1E2732",
        background: "#0d141c",
        padding: 24,
        overflowY: "auto",
        height: "100%",
      }}
    >
      {body}
    </aside>
  );
}
