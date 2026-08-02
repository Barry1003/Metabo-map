import { useMemo, useState } from "react";
import type { Pathway } from "../types";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function Quiz({ pathway }: { pathway: Pathway }) {
  const reactions = pathway.reactions;
  const name = (id: string) => pathway.metabolites.find((m) => m.id === id)?.abbr ?? id;

  const [placed, setPlaced] = useState<Record<string, string | null>>({});
  const [dragged, setDragged] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [seed, setSeed] = useState(0);

  const tray = useMemo(
    () => shuffle(reactions.map((r) => r.enzyme)),
    // reshuffle only on reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [seed],
  );

  const usedEnzymes = new Set(Object.values(placed).filter(Boolean) as string[]);
  const allPlaced = reactions.every((r) => placed[r.id]);
  const score = reactions.filter((r) => placed[r.id] === r.enzyme).length;

  function drop(reactionId: string) {
    if (!dragged) return;
    setPlaced((p) => {
      const next = { ...p };
      // remove dragged from any slot it already occupies
      for (const k of Object.keys(next)) if (next[k] === dragged) next[k] = null;
      next[reactionId] = dragged;
      return next;
    });
    setDragged(null);
  }

  function reset() {
    setPlaced({});
    setChecked(false);
    setSeed((s) => s + 1);
  }

  return (
    <div style={{ padding: "24px 28px", height: "100%", overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Quiz — place the enzymes</h2>
        {checked && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, color: score === reactions.length ? "#7BD88F" : "#FFD166" }}>
            {score} / {reactions.length}
          </div>
        )}
      </div>
      <p style={{ fontSize: 13, color: "#7D8B9C", marginTop: 0, marginBottom: 20 }}>
        Drag each enzyme onto the reaction it catalyses.
      </p>

      {/* Enzyme tray */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24, padding: 12, background: "#0d141c", borderRadius: 8, border: "1px solid #1E2732" }}>
        {tray.map((enz) =>
          usedEnzymes.has(enz) ? null : (
            <div
              key={enz}
              draggable
              onDragStart={() => setDragged(enz)}
              style={{
                fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 600,
                background: "#F2A93B", color: "#090D12", padding: "6px 10px",
                borderRadius: 4, cursor: "grab",
              }}
            >
              {enz}
            </div>
          ),
        )}
        {usedEnzymes.size === reactions.length && (
          <span style={{ color: "#5C6B85", fontSize: 12 }}>All placed — check your answers.</span>
        )}
      </div>

      {/* Reaction slots */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {reactions.map((r) => {
          const val = placed[r.id];
          const correct = val === r.enzyme;
          const border = checked && val ? (correct ? "#7BD88F" : "#E2564B") : "#1E2732";
          return (
            <div
              key={r.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => drop(r.id)}
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", background: "#0d141c", border: `1px solid ${border}`, borderRadius: 6, flexWrap: "wrap" }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "#C7D2DE", minWidth: 120, flexShrink: 0 }}>
                {name(r.substrates[0])} → {name(r.products[0])}
              </span>
              <div
                style={{
                  flex: 1, minHeight: 30, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                  background: val ? "rgba(242,169,59,0.12)" : "repeating-linear-gradient(45deg,#0d141c,#0d141c 6px,#121b24 6px,#121b24 12px)",
                  border: val ? "1px solid rgba(242,169,59,0.3)" : "1px dashed #2a3644",
                }}
              >
                {val ? (
                  <span
                    draggable
                    onDragStart={() => setDragged(val)}
                    style={{ fontSize: 12, fontWeight: 600, color: checked ? (correct ? "#7BD88F" : "#E2564B") : "#F2A93B", cursor: "grab" }}
                  >
                    {val}
                  </span>
                ) : (
                  <span style={{ fontSize: 11, color: "#3a4d63" }}>drop enzyme</span>
                )}
              </div>
              {checked && val && (
                <span style={{ fontSize: 14, color: correct ? "#7BD88F" : "#E2564B", width: 16 }}>{correct ? "✓" : "✗"}</span>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button
          onClick={() => setChecked(true)}
          disabled={!allPlaced}
          style={{
            fontFamily: "var(--font-condensed)", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "9px 18px", borderRadius: 4, border: "none",
            background: allPlaced ? "#48C9D9" : "#1E2732", color: allPlaced ? "#090D12" : "#5C6B85",
            cursor: allPlaced ? "pointer" : "default",
          }}
        >
          Check answers
        </button>
        <button
          onClick={reset}
          style={{
            fontFamily: "var(--font-condensed)", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "9px 18px", borderRadius: 4, border: "1px solid #1E2732", background: "transparent", color: "#C7D2DE", cursor: "pointer",
          }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
