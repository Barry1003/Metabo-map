import { useMemo, useState } from "react";
import type { Pathway } from "../types";
import { toMarkdown, toMermaid } from "../lib/mermaid";
import type { Level } from "../lib/levels";

type Tab = "mermaid" | "markdown";

export default function ExportPanel({
  pathway,
  level,
  showCofactors,
  onClose,
}: {
  pathway: Pathway;
  level: Level;
  showCofactors: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("mermaid");
  const [copied, setCopied] = useState(false);

  const text = useMemo(
    () =>
      tab === "mermaid"
        ? toMermaid(pathway, { level, showCofactors })
        : toMarkdown(pathway, { level, showCofactors }),
    [pathway, level, showCofactors, tab],
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return; // clipboard blocked — the textarea below is still selectable
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const download = () => {
    const ext = tab === "mermaid" ? "mmd" : "md";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${pathway.id || "pathway"}-${level}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1200, background: "rgba(6,9,13,0.8)",
        backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(760px, 100%)", maxHeight: "82vh", display: "flex", flexDirection: "column",
          background: "#0d141c", border: "1px solid #233042", borderRadius: 10, padding: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Export {pathway.name}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ marginLeft: "auto", background: "transparent", border: "none", color: "#7D8B9C", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
          >
            ×
          </button>
        </div>
        <p style={{ fontSize: 12, color: "#7D8B9C", margin: "0 0 14px", lineHeight: 1.5 }}>
          Paste into Obsidian, Notion, GitHub or VS Code — they all render Mermaid. Reflects your
          current level and cofactor setting.
        </p>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {([["mermaid", "Mermaid diagram"], ["markdown", "Study sheet"]] as [Tab, string][]).map(([id, name]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
                padding: "6px 12px", borderRadius: 4, cursor: "pointer",
                border: `1px solid ${tab === id ? "#48C9D9" : "#1E2732"}`,
                background: tab === id ? "rgba(72,201,217,0.12)" : "transparent",
                color: tab === id ? "#48C9D9" : "#7D8B9C",
              }}
            >
              {name}
            </button>
          ))}
        </div>

        <textarea
          readOnly
          value={text}
          onFocus={(e) => e.currentTarget.select()}
          spellCheck={false}
          style={{
            flex: 1, minHeight: 260, resize: "none", width: "100%",
            background: "#090D12", border: "1px solid #1E2732", borderRadius: 6, padding: 12,
            color: "#C7D2DE", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.55,
          }}
        />

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button
            onClick={copy}
            style={{
              fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "8px 14px", borderRadius: 4, cursor: "pointer",
              border: "1px solid #48C9D9", background: "rgba(72,201,217,0.12)", color: "#48C9D9",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
          <button
            onClick={download}
            style={{
              fontFamily: "var(--font-condensed)", fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "8px 14px", borderRadius: 4, cursor: "pointer",
              border: "1px solid #1E2732", background: "transparent", color: "#7D8B9C",
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}
