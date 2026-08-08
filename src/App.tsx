import { useCallback, useEffect, useState } from "react";
import glycolysisData from "./data/glycolysis.json";
import type { Pathway, Selection } from "./types";
import { loadPathway, searchPathways, type SearchHit } from "./lib/reactome";

// "Failed to fetch" is fetch()'s opaque network error; make it human.
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : "Failed to load pathway.";
  if (/failed to fetch|network/i.test(msg)) return "Couldn't reach Reactome just now (network hiccup). Please try again.";
  return msg;
}
import PathwayGraph from "./components/PathwayGraph";
import Inspector from "./components/Inspector";
import Ledger from "./components/Ledger";
import Quiz from "./components/Quiz";
import PathwayPicker from "./components/PathwayPicker";
import AiSettings from "./components/AiSettings";
import ExportPanel from "./components/ExportPanel";
import { getPremiumConfig } from "./lib/enrich";
import { levelMeta, loadLevel, metaFor, saveLevel, type Level } from "./lib/levels";

// Curated pathways ship pre-built and polished; everything else loads live
// from Reactome via the picker.
const curatedPathways: Record<string, Pathway> = {
  glycolysis: glycolysisData as Pathway,
};

type Mode = "explore" | "quiz";

function useIsMobile() {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.matchMedia("(max-width: 768px)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const on = () => setMobile(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

function Toggle({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
        padding: "6px 12px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap",
        border: `1px solid ${on ? "#48C9D9" : "#1E2732"}`,
        background: on ? "rgba(72,201,217,0.12)" : "transparent",
        color: on ? "#48C9D9" : "#7D8B9C",
      }}
    >
      {children}
    </button>
  );
}

// Study level. Drives both how dense the canvas is and how deep the written
// notes go, so it sits in the header next to the mode switch rather than being
// buried in settings.
function LevelPicker({ level, onChange }: { level: Level; onChange: (l: Level) => void }) {
  return (
    <div
      role="group"
      aria-label="Study level"
      style={{ display: "flex", border: "1px solid #1E2732", borderRadius: 4, overflow: "hidden" }}
    >
      {levelMeta.map((m) => {
        const on = m.id === level;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            title={`${m.full} — ${m.blurb}`}
            aria-pressed={on}
            style={{
              fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "6px 10px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
              background: on ? "rgba(72,201,217,0.14)" : "transparent",
              color: on ? "#48C9D9" : "#7D8B9C",
            }}
          >
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

export default function App() {
  const isMobile = useIsMobile();
  const [pathway, setPathway] = useState<Pathway>(curatedPathways.glycolysis);

  const [mode, setMode] = useState<Mode>("explore");
  const [level, setLevel] = useState<Level>(loadLevel);
  const [selection, setSelection] = useState<Selection>(null);
  // Level sets the default graph density; cofactors stay off on small screens.
  const [showCofactors, setShowCofactors] = useState(() => metaFor(loadLevel()).cofactors && !isMobile);
  const [disease, setDisease] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null); // name of pathway being fetched
  const [loadError, setLoadError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [premiumOn, setPremiumOn] = useState(!!getPremiumConfig());

  const resetView = () => { setSelection(null); setStep(0); setDisease(null); };

  // Changing level re-densifies the canvas to that level's default. The
  // Cofactors toggle can still override it afterwards for the current view.
  useEffect(() => {
    saveLevel(level);
    setShowCofactors(metaFor(level).cofactors && !isMobile);
  }, [level, isMobile]);

  const pickCurated = useCallback((id: string) => {
    const p = curatedPathways[id];
    if (p) { setPathway(p); resetView(); setLoadError(null); }
  }, []);

  const pickLive = useCallback(async (hit: SearchHit) => {
    setLoadError(null);
    setLoading(hit.name);
    setMode("explore");
    try {
      const p = await loadPathway(hit.id, hit.name, hit.summary);
      setPathway(p);
      resetView();
      setShowCofactors(false); // live layouts read cleaner without cofactor clutter
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(null);
    }
  }, []);

  // Catalog entries that aren't pre-built resolve to their best live Reactome
  // match on click — so nothing in the picker is ever a dead end.
  const pickLiveByName = useCallback(async (name: string) => {
    setLoadError(null);
    setLoading(name);
    setMode("explore");
    try {
      const hits = await searchPathways(name);
      if (hits.length === 0) throw new Error(`No Reactome pathway found for “${name}”.`);
      const p = await loadPathway(hits[0].id, hits[0].name, hits[0].summary);
      setPathway(p);
      resetView();
      setShowCofactors(false);
    } catch (err) {
      setLoadError(friendlyError(err));
    } finally {
      setLoading(null);
    }
  }, []);

  const brokenReactionId = disease
    ? pathway.diseases.find((d) => d.id === disease)?.reactionId ?? null
    : null;

  const handleStep = useCallback((n: number, p: Pathway) => {
    setStep(n);
    if (n > 0) setSelection({ kind: "reaction", id: p.reactions[n - 1].id });
  }, []);

  const onSelect = useCallback((s: Selection) => setSelection(s), []);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "#090D12", color: "#E8EEF4" }}>
      {/* Header */}
      <header style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: "1px solid #1E2732", flexWrap: "wrap" }}>
        <button
          onClick={() => setPickerOpen(true)}
          style={{ textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: 0, color: "inherit" }}
        >
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            MetaboMap <span style={{ color: "#48C9D9" }}>·</span>{" "}
            <span style={{ fontWeight: 500 }}>{pathway.name}</span>
            <span style={{ color: "#5C6B85", fontSize: 12, marginLeft: 8 }}>⌕ change</span>
          </div>
          {!isMobile && (
            <div style={{ fontSize: 11, color: "#7D8B9C", fontFamily: "var(--font-mono)" }}>{pathway.subtitle}</div>
          )}
        </button>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Toggle on={mode === "explore"} onClick={() => setMode("explore")}>Explore</Toggle>
          <Toggle on={mode === "quiz"} onClick={() => setMode("quiz")}>Quiz</Toggle>
          <LevelPicker level={level} onChange={setLevel} />
          <Toggle on={premiumOn} onClick={() => setSettingsOpen(true)}>{premiumOn ? "✦ Opus" : "✦ AI"}</Toggle>
          {mode === "explore" && (
            <>
              {!isMobile && <div style={{ width: 1, height: 22, background: "#1E2732", margin: "0 4px" }} />}
              <Toggle on={selection?.kind === "about"} onClick={() => setSelection({ kind: "about" })}>ⓘ About</Toggle>
              <Toggle on={showCofactors} onClick={() => setShowCofactors((v) => !v)}>Cofactors</Toggle>
              <Toggle on={exportOpen} onClick={() => setExportOpen(true)}>⧉ Export</Toggle>
              <select
                value={disease ?? ""}
                onChange={(e) => setDisease(e.target.value || null)}
                style={{
                  fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase",
                  padding: "6px 8px", borderRadius: 4, maxWidth: isMobile ? 150 : "none",
                  border: `1px solid ${disease ? "#E2564B" : "#1E2732"}`,
                  background: disease ? "rgba(226,86,75,0.1)" : "transparent", color: disease ? "#E2564B" : "#7D8B9C", cursor: "pointer",
                }}
              >
                <option value="">Disease: none</option>
                {pathway.diseases.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </>
          )}
        </div>
      </header>

      {disease && mode === "explore" && (
        <div style={{ padding: "8px 16px", background: "rgba(226,86,75,0.08)", borderBottom: "1px solid rgba(226,86,75,0.25)", fontSize: 13, color: "#E2564B" }}>
          {pathway.diseases.find((d) => d.id === disease)?.summary}
        </div>
      )}

      {loadError && (
        <div style={{ padding: "8px 16px", background: "rgba(226,86,75,0.08)", borderBottom: "1px solid rgba(226,86,75,0.25)", fontSize: 13, color: "#E2564B", display: "flex", gap: 12 }}>
          <span style={{ flex: 1 }}>{loadError}</span>
          <button onClick={() => setLoadError(null)} style={{ background: "transparent", border: "none", color: "#E2564B", cursor: "pointer" }}>dismiss</button>
        </div>
      )}

      {pathway.live && (
        <div style={{ padding: "6px 16px", background: "rgba(242,169,59,0.07)", borderBottom: "1px solid rgba(242,169,59,0.2)", fontSize: 12, color: "#c79b3f", display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span>⬤ Live from Reactome — laid out automatically.</span>
          {pathway.truncated && <span>Showing {pathway.truncated.shown} of {pathway.truncated.total} reactions (large pathway).</span>}
        </div>
      )}

      {/* Body */}
      {mode === "explore" ? (
        <>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <PathwayGraph
                pathway={pathway}
                selection={selection}
                showCofactors={showCofactors}
                annotateEnzymes={metaFor(level).annotate}
                brokenReactionId={brokenReactionId}
                quizHiddenEnzymes={false}
                onSelect={onSelect}
              />
              {!isMobile && <Legend />}
            </div>
            {/* Desktop: fixed sidebar. Mobile: bottom sheet only when something is selected. */}
            {!isMobile && <Inspector selection={selection} pathway={pathway} level={level} onSelect={onSelect} />}
          </div>
          <Ledger pathway={pathway} step={step} onStep={(n) => handleStep(n, pathway)} compact={isMobile} />
          {isMobile && selection && (
            <Inspector selection={selection} pathway={pathway} level={level} mode="sheet" onClose={() => setSelection(null)} onSelect={onSelect} />
          )}
        </>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          <Quiz pathway={pathway} />
        </div>
      )}

      {pickerOpen && (
        <PathwayPicker
          currentId={pathway.id}
          onPickCurated={pickCurated}
          onPickLive={pickLive}
          onPickLiveByName={pickLiveByName}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {settingsOpen && (
        <AiSettings onClose={() => { setSettingsOpen(false); setPremiumOn(!!getPremiumConfig()); }} />
      )}

      {exportOpen && (
        <ExportPanel
          pathway={pathway}
          level={level}
          showCofactors={showCofactors}
          onClose={() => setExportOpen(false)}
        />
      )}

      {loading && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "rgba(6,9,13,0.8)", backdropFilter: "blur(2px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <div style={{ width: 34, height: 34, border: "3px solid #1E2732", borderTopColor: "#48C9D9", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          <div style={{ fontSize: 14, color: "#C7D2DE" }}>Loading <strong>{loading}</strong> from Reactome…</div>
        </div>
      )}
    </div>
  );
}

function Legend() {
  const items = [
    { c: "#48C9D9", label: "Metabolite" },
    { c: "#F2A93B", label: "Enzyme" },
    { c: "#FFD166", label: "Energy cofactor" },
    { c: "#4a5a72", label: "Cofactor" },
  ];
  return (
    <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", gap: 14, padding: "8px 12px", background: "rgba(13,20,28,0.85)", borderRadius: 6, border: "1px solid #1E2732" }}>
      {items.map((i) => (
        <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 9, height: 9, borderRadius: 2, background: i.c }} />
          <span style={{ fontSize: 11, color: "#7D8B9C" }}>{i.label}</span>
        </div>
      ))}
    </div>
  );
}
