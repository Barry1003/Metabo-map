import { useCallback, useEffect, useRef, useState } from "react";
import type { Pathway } from "../types";
import { toMermaid } from "../lib/mermaid";
import type { Level } from "../lib/levels";

// Mermaid is a heavy dependency and only this view needs it, so it is loaded on
// first use and kept for the session. Initialising twice throws, hence the
// module-level promise rather than a per-mount import.
let mermaidPromise: Promise<typeof import("mermaid").default> | null = null;

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import("mermaid").then((mod) => {
      const mermaid = mod.default;
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        // Our own markup (<b>, <br/>) in labels needs HTML rendering. Data is
        // escaped in mermaid.ts before the tags are added, so nothing from
        // Reactome can inject markup here.
        securityLevel: "loose",
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        // wrappingWidth defaults to 200px, which chops a two-line caption into
        // five. Wider boxes are the whole point of this view.
        flowchart: {
          htmlLabels: true,
          nodeSpacing: 30,
          rankSpacing: 46,
          padding: 14,
          wrappingWidth: 320,
          useMaxWidth: false,
        },
        themeVariables: {
          background: "#090D12",
          lineColor: "#4a6079",
          primaryColor: "#101d2b",
          primaryTextColor: "#E8EEF4",
          primaryBorderColor: "#233042",
          fontSize: "14px",
        },
      });
      return mermaid;
    });
  }
  return mermaidPromise;
}

let renderSeq = 0;

export default function PathwayDiagram({
  pathway,
  level,
  showCofactors,
}: {
  pathway: Pathway;
  level: Level;
  showCofactors: boolean;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const mermaid = await loadMermaid();
        if (cancelled) return;
        const code = toMermaid(pathway, { level, showCofactors });
        const { svg } = await mermaid.render(`mmd-${++renderSeq}`, code);
        if (cancelled || !hostRef.current) return;
        hostRef.current.innerHTML = svg;
        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not render the diagram.");
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [pathway, level, showCofactors]);

  const step = useCallback((by: number) => setZoom((z) => Math.min(2.2, Math.max(0.4, +(z + by).toFixed(2)))), []);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "auto", background: "#090D12" }}>
      {loading && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#5C6B85", fontSize: 13 }}>
          Drawing diagram…
        </div>
      )}
      {error && (
        <div style={{ padding: 24, color: "#E2564B", fontSize: 13, fontFamily: "var(--font-mono)" }}>
          {error}
        </div>
      )}

      <div
        ref={hostRef}
        style={{
          display: "flex", justifyContent: "center", padding: "28px 20px 60px",
          transform: `scale(${zoom})`, transformOrigin: "top center",
          opacity: loading ? 0 : 1, transition: "opacity 0.2s",
        }}
      />

      {!loading && !error && (
        <div style={{ position: "sticky", bottom: 12, marginLeft: 16, display: "inline-flex", gap: 4, padding: 4, background: "rgba(13,20,28,0.92)", border: "1px solid #1E2732", borderRadius: 6 }}>
          {([["−", -0.15], ["+", 0.15]] as [string, number][]).map(([sym, by]) => (
            <button
              key={sym}
              onClick={() => step(by)}
              aria-label={by < 0 ? "Zoom out" : "Zoom in"}
              style={{ width: 26, height: 24, border: "none", borderRadius: 4, background: "transparent", color: "#7D8B9C", cursor: "pointer", fontSize: 14 }}
            >
              {sym}
            </button>
          ))}
          <button
            onClick={() => setZoom(1)}
            style={{ padding: "0 8px", height: 24, border: "none", borderRadius: 4, background: "transparent", color: "#7D8B9C", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11 }}
          >
            {Math.round(zoom * 100)}%
          </button>
        </div>
      )}
    </div>
  );
}
