import { useEffect, useMemo, useRef, useState } from "react";
import { searchCatalog } from "../data/catalog";
import { searchPathways, type SearchHit } from "../lib/reactome";

interface Props {
  currentId: string;
  onPickCurated: (id: string) => void;
  onPickLive: (hit: SearchHit) => void;
  onPickLiveByName: (name: string) => void;
  onClose: () => void;
}

const sectionLabel: React.CSSProperties = {
  fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase",
  color: "#546274", padding: "10px 14px 4px",
};

export default function PathwayPicker({ currentId, onPickCurated, onPickLive, onPickLiveByName, onClose }: Props) {
  const [q, setQ] = useState("");
  const [live, setLive] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const curated = useMemo(() => searchCatalog(q), [q]);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Debounced live search against Reactome (any of ~2,600 human pathways).
  useEffect(() => {
    if (q.trim().length < 2) { setLive([]); setSearching(false); return; }
    setSearching(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const hits = await searchPathways(q);
        if (!cancelled) setLive(hits);
      } catch {
        if (!cancelled) setLive([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 350);
    return () => { cancelled = true; clearTimeout(t); };
  }, [q]);

  // Map live hits by lowercased name so a curated "planned" entry can open its
  // real Reactome pathway instead of being a dead "coming soon" row.
  const liveByName = new Map(live.map((h) => [h.name.toLowerCase(), h]));
  const curatedNames = new Set(curated.map((c) => c.name.toLowerCase()));
  const liveFiltered = live.filter((h) => !curatedNames.has(h.name.toLowerCase()));

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(6,9,13,0.75)", backdropFilter: "blur(3px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8vh 16px 16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 560, background: "#0d141c",
          border: "1px solid #1E2732", borderRadius: 12, overflow: "hidden",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "84vh",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #1E2732" }}>
          <span style={{ color: "#5C6B85", fontSize: 16 }}>⌕</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any pathway — “urea cycle”, “TCA”, “nucleotide”…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "#E8EEF4", fontSize: 15, fontFamily: "var(--font-sans)" }}
          />
          {searching && <span style={{ fontSize: 11, color: "#48C9D9", fontFamily: "var(--font-condensed)" }}>searching…</span>}
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#5C6B85", cursor: "pointer", fontSize: 12, fontFamily: "var(--font-condensed)" }}>ESC</button>
        </div>

        <div style={{ overflowY: "auto", padding: 8 }}>
          {curated.length > 0 && <div style={sectionLabel}>Curated · polished</div>}
          {curated.map((e) => {
            const ready = e.status === "ready";
            const active = e.id === currentId;
            const liveMatch = !ready ? liveByName.get(e.name.toLowerCase()) : undefined;
            if (ready) {
              return (
                <Row
                  key={e.id}
                  title={e.name}
                  subtitle={e.blurb}
                  badge={active ? "Current" : "Open"}
                  accent="#48C9D9"
                  active={active}
                  onClick={() => { onPickCurated(e.id); onClose(); }}
                />
              );
            }
            // planned: open its best live Reactome match — never a dead end
            return (
              <Row
                key={e.id}
                title={e.name}
                subtitle={e.blurb}
                badge="Open live"
                accent="#F2A93B"
                onClick={() => {
                  if (liveMatch) onPickLive(liveMatch);
                  else onPickLiveByName(e.name);
                  onClose();
                }}
              />
            );
          })}

          {q.trim().length >= 2 && (
            <>
              <div style={sectionLabel}>Live from Reactome · any pathway</div>
              {liveFiltered.length === 0 && !searching && (
                <div style={{ padding: "8px 14px 14px", color: "#5C6B85", fontSize: 13 }}>
                  {curated.length === 0 ? `No pathway matches “${q}”.` : "No additional Reactome pathways."}
                </div>
              )}
              {liveFiltered.map((h) => (
                <Row
                  key={h.id}
                  title={h.name}
                  subtitle={h.summary || h.id}
                  badge="Open live"
                  accent="#F2A93B"
                  onClick={() => { onPickLive(h); onClose(); }}
                />
              ))}
            </>
          )}
        </div>

        <div style={{ padding: "10px 16px", borderTop: "1px solid #1E2732", fontSize: 11, color: "#5C6B85" }}>
          Live pathways load straight from Reactome in your browser — no server, no key.
        </div>
      </div>
    </div>
  );
}

function Row({
  title, subtitle, badge, accent, disabled, active, onClick,
}: {
  title: string; subtitle: string; badge: string; accent: string;
  disabled?: boolean; active?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%", textAlign: "left", display: "flex", alignItems: "center", gap: 12,
        padding: "11px 14px", marginBottom: 4, borderRadius: 8, border: "none",
        background: active ? "rgba(72,201,217,0.1)" : "transparent",
        cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.55 : 1,
      }}
      onMouseEnter={(ev) => { if (!disabled && !active) ev.currentTarget.style.background = "#131A22"; }}
      onMouseLeave={(ev) => { if (!active) ev.currentTarget.style.background = "transparent"; }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2, background: accent, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#E8EEF4" }}>{title}</span>
        <span style={{ display: "block", fontSize: 12, color: "#7D8B9C", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{subtitle}</span>
      </span>
      <span style={{
        fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase",
        padding: "3px 7px", borderRadius: 4, flexShrink: 0, color: accent, border: `1px solid ${accent}55`,
      }}>
        {badge}
      </span>
    </button>
  );
}
