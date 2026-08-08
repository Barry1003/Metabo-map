import { useState } from "react";
import { getPremiumConfig, setPremiumConfig, DEFAULT_AR_MODEL } from "../lib/enrich";

const MODELS = [
  { id: "claude-opus-4-8", label: "Claude Opus 4.8 (recommended)" },
  { id: "claude-opus-5", label: "Claude Opus 5 (newest)" },
  { id: "gpt-5.6-sol", label: "GPT-5.6" },
];

export default function AiSettings({ onClose }: { onClose: () => void }) {
  const existing = getPremiumConfig();
  const [key, setKey] = useState(existing?.key ?? "");
  const [model, setModel] = useState(existing?.model ?? DEFAULT_AR_MODEL);
  const [saved, setSaved] = useState(false);

  const save = () => { setPremiumConfig(key, model); setSaved(true); setTimeout(onClose, 700); };
  const clear = () => { setPremiumConfig("", ""); setKey(""); setSaved(true); setTimeout(onClose, 700); };

  const field: React.CSSProperties = {
    width: "100%", background: "#0d141c", border: "1px solid #1E2732", borderRadius: 6,
    color: "#E8EEF4", fontSize: 13, padding: "9px 11px", fontFamily: "var(--font-mono)", outline: "none",
  };
  const btn = (primary?: boolean): React.CSSProperties => ({
    fontFamily: "var(--font-condensed)", fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase",
    padding: "9px 16px", borderRadius: 6, cursor: "pointer",
    border: primary ? "none" : "1px solid #1E2732",
    background: primary ? "#48C9D9" : "transparent", color: primary ? "#090D12" : "#C7D2DE",
  });

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(6,9,13,0.75)", backdropFilter: "blur(3px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "12vh 16px 16px" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 480, background: "#0d141c", border: "1px solid #1E2732", borderRadius: 12, padding: 22, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>AI model</div>
        <p style={{ fontSize: 13, color: "#7D8B9C", lineHeight: 1.55, marginTop: 0 }}>
          Add your Agent Router key for <strong style={{ color: "#C7D2DE" }}>frontier-model</strong> explanations (Claude Opus / GPT-5). It is stored only in this browser, never sent anywhere except Agent Router. Leave empty to use the free built-in model.
        </p>

        <div style={{ fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "#7D8B9C", margin: "14px 0 6px" }}>Agent Router API key</div>
        <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-…" style={field} autoComplete="off" />

        <div style={{ fontFamily: "var(--font-condensed)", fontSize: 10, letterSpacing: "0.09em", textTransform: "uppercase", color: "#7D8B9C", margin: "14px 0 6px" }}>Model</div>
        <select value={model} onChange={(e) => setModel(e.target.value)} style={{ ...field, fontFamily: "var(--font-sans)", cursor: "pointer" }}>
          {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>

        <div style={{ display: "flex", gap: 10, marginTop: 20, alignItems: "center" }}>
          <button onClick={save} style={btn(true)} disabled={!key.trim()}>Save</button>
          {existing && <button onClick={clear} style={btn()}>Use free model</button>}
          <button onClick={onClose} style={{ ...btn(), marginLeft: "auto" }}>Close</button>
        </div>
        {saved && <div style={{ fontSize: 12, color: "#7BD88F", marginTop: 12 }}>Saved ✓</div>}
        <div style={{ fontSize: 11, color: "#5C6B85", marginTop: 14, lineHeight: 1.5 }}>
          Note: the key is used from your browser (Agent Router blocks server calls). Anyone with access to this browser could read it — fine for personal use.
        </div>
      </div>
    </div>
  );
}
