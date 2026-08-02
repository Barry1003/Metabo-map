import type { Pathway } from "../types";

interface Props {
  pathway: Pathway;
  step: number; // number of reactions traversed (0..reactions.length)
  onStep: (n: number) => void;
  compact?: boolean;
}

function totalsUpTo(pathway: Pathway, step: number) {
  let atp = 0;
  let nadh = 0;
  for (let i = 0; i < step; i++) {
    const r = pathway.reactions[i];
    atp += r.deltaATP * r.multiplicity;
    nadh += r.deltaNADH * r.multiplicity;
  }
  return { atp, nadh };
}

function Counter({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ textAlign: "center", minWidth: 64 }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 26,
          fontWeight: 500,
          color: value < 0 ? "#E2564B" : value > 0 ? color : "#5C6B85",
          lineHeight: 1,
        }}
      >
        {value > 0 ? "+" : ""}{value}
      </div>
      <div style={{ fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7D8B9C", marginTop: 6 }}>
        {label}
      </div>
    </div>
  );
}

export default function Ledger({ pathway, step, onStep, compact = false }: Props) {
  const { atp, nadh } = totalsUpTo(pathway, step);
  const n = pathway.reactions.length;
  const current = step > 0 ? pathway.reactions[step - 1] : null;

  return (
    <div
      style={{
        borderTop: "1px solid #1E2732",
        background: "#0d141c",
        padding: compact ? "10px 14px" : "14px 20px",
        display: "flex",
        alignItems: "center",
        gap: compact ? 12 : 24,
        flexWrap: "wrap",
      }}
    >
      <div style={{ display: "flex", gap: 20 }}>
        <Counter label="ATP" value={atp} color="#FFD166" />
        <Counter label="NADH" value={nadh} color="#48C9D9" />
        <Counter label="FADH₂" value={0} color="#48C9D9" />
      </div>

      <div style={{ flex: 1, minWidth: compact ? 120 : 0 }}>
        <div style={{ fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "#7D8B9C", marginBottom: 6 }}>
          {compact ? `Step ${step} / ${n}` : `Energy ledger — step ${step} / ${n}`}
        </div>
        <div style={{ height: 4, background: "#1E2732", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ width: `${(step / n) * 100}%`, height: "100%", background: "#48C9D9", transition: "width 0.25s" }} />
        </div>
        <div style={{ fontSize: 12, color: "#7D8B9C", marginTop: 8, height: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {current
            ? `${current.enzyme}${current.deltaATP ? `  ${current.deltaATP > 0 ? "+" : ""}${current.deltaATP * current.multiplicity} ATP` : ""}${current.deltaNADH ? `  +${current.deltaNADH * current.multiplicity} NADH` : ""}`
            : "Press Step to spend the first ATP."}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onStep(Math.max(0, step - 1))} disabled={step === 0} style={btn(step === 0)}>
          ◀ Back
        </button>
        <button onClick={() => onStep(Math.min(n, step + 1))} disabled={step === n} style={btn(step === n, true)}>
          Step ▶
        </button>
        <button onClick={() => onStep(0)} style={btn(false)}>Reset</button>
      </div>
    </div>
  );
}

function btn(disabled: boolean, primary = false): React.CSSProperties {
  return {
    fontFamily: "var(--font-condensed)",
    fontSize: 11,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "7px 12px",
    borderRadius: 4,
    border: "1px solid #1E2732",
    cursor: disabled ? "default" : "pointer",
    background: primary && !disabled ? "#48C9D9" : "transparent",
    color: primary && !disabled ? "#090D12" : disabled ? "#3a4d63" : "#C7D2DE",
    opacity: disabled ? 0.5 : 1,
  };
}
