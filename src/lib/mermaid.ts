// Pathway → Mermaid flowchart, for the in-app Diagram view and for export.
//
// The point of this view is READABILITY, not topology. The Cytoscape canvas
// already shows you what connects to what; a dot labelled "G6P" is a map
// reference, not an explanation. So here every box carries teaching content —
// what the step does, what it costs, whether it commits you — and the whole
// thing reads top-to-bottom like a worked derivation.
//
// Both metabolites and reactions get boxes. Putting the enzyme on the arrow is
// more compact, but compact is the opposite of what this view is for.

import type { Pathway, Reaction } from "../types";
import { metaFor, type Level } from "./levels";

/** Mermaid node ids must be bare identifiers. */
function nodeId(prefix: string, raw: string): string {
  return `${prefix}_${raw.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

// Quoted labels are safe for most punctuation. A literal quote ends the label
// and a pipe would close an edge label. Angle brackets matter too: the diagram
// renders with HTML labels enabled, and metabolite/enzyme names on live
// pathways come from Reactome, so data must never carry its own markup. The
// <b> and <br/> tags below are added OUTSIDE this function, on purpose.
function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\|/g, "/");
}

/**
 * First sentence of an explanation, with the "X is an enzyme that …" preamble
 * stripped, clipped to fit a box. Turns curated prose into a caption.
 */
function gist(text: string, subject: string, max: number): string {
  if (!text) return "";
  const m = text.match(/^(.*?[.!?])(\s|$)/);
  let s = (m ? m[1] : text).trim();

  const subj = subject.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  s = s
    .replace(new RegExp(`^${subj}\\s+is\\s+(an?|the)\\s+\\S+\\s+(that|which)\\s+`, "i"), "")
    .replace(new RegExp(`^${subj}\\s+is\\s+(an?|the)\\s+`, "i"), "")
    .replace(new RegExp(`^${subj}\\s+`, "i"), "")
    .replace(/\.$/, "")
    .trim();

  if (!s) return "";
  s = s[0].toUpperCase() + s.slice(1);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  // Drop any dangling punctuation so the ellipsis reads as a clean break.
  const trimmed = (sp > 20 ? cut.slice(0, sp) : cut).replace(/[\s,;:·—-]+$/, "");
  return `${trimmed}…`;
}

function energyLine(r: Reaction, showCofactors: boolean): string {
  const bits: string[] = [];
  if (r.deltaATP) bits.push(`${r.deltaATP > 0 ? "+" : "−"}${Math.abs(r.deltaATP)} ATP`);
  if (r.deltaNADH) bits.push(`+${r.deltaNADH} NADH`);
  if (showCofactors) {
    const flow = [r.consumes.join(" + "), r.produces.join(" + ")].filter(Boolean);
    if (flow.length === 2) bits.push(`${flow[0]} → ${flow[1]}`);
    else if (flow.length === 1) bits.push(flow[0]);
  }
  if (r.multiplicity > 1) bits.push(`×${r.multiplicity}`);
  return bits.join(" · ");
}

export interface MermaidOptions {
  level: Level;
  showCofactors: boolean;
}

export function toMermaid(p: Pathway, { level, showCofactors }: MermaidOptions): string {
  const meta = metaFor(level);
  const lines: string[] = [];

  lines.push(`%% ${p.name}${p.subtitle ? ` — ${p.subtitle}` : ""}`);
  lines.push(`%% Compartment: ${p.compartment} · Level: ${meta.full}`);
  if (p.source?.pathway) {
    lines.push(`%% Source: ${p.source.pathway}${p.source.license ? ` (${p.source.license})` : ""}`);
  }
  lines.push("flowchart TD");

  for (const m of p.metabolites) {
    const rows = [`<b>${esc(m.name || m.abbr)}</b>`];
    if (m.name && m.abbr && m.name !== m.abbr) rows.push(esc(m.abbr));
    if (m.carbons && level !== "undergrad") rows.push(`${m.carbons} carbons`);
    lines.push(`  ${nodeId("m", m.id)}["${rows.join("<br/>")}"]:::met`);
  }

  lines.push("");

  p.reactions.forEach((r, idx) => {
    const rid = nodeId("r", r.id);
    const rows = [`<b>${r.number ?? idx + 1} · ${esc(r.enzyme)}</b>`];

    const caption = gist(r.explanation, r.enzyme, level === "undergrad" ? 66 : 86);
    if (caption) rows.push(esc(caption));

    const energy = energyLine(r, showCofactors);
    if (energy) rows.push(esc(energy));

    if (meta.annotate) {
      const ident = [r.ec ? `EC ${r.ec}` : "", r.gene].filter(Boolean).join(" · ");
      if (ident) rows.push(esc(ident));
    }

    lines.push(`  ${rid}["${rows.join("<br/>")}"]:::enz`);
    for (const s of r.substrates) lines.push(`  ${nodeId("m", s)} --> ${rid}`);
    for (const t of r.products) lines.push(`  ${rid} --> ${nodeId("m", t)}`);
  });

  // Self-contained styling, so the diagram looks deliberate wherever it lands.
  lines.push("");
  lines.push("  classDef met fill:#101d2b,stroke:#48C9D9,stroke-width:1.5px,color:#E8EEF4;");
  lines.push("  classDef enz fill:#1c1608,stroke:#F2A93B,stroke-width:1.5px,color:#F6E7C8;");

  return lines.join("\n");
}

/** A full study sheet: the diagram plus the numbered step list beneath it. */
export function toMarkdown(p: Pathway, opts: MermaidOptions): string {
  const abbr = (id: string) => p.metabolites.find((m) => m.id === id)?.abbr ?? id;
  const out: string[] = [
    `# ${p.name}`,
    "",
    p.subtitle,
    "",
    "```mermaid",
    toMermaid(p, opts),
    "```",
    "",
    "## Steps",
    "",
  ];
  p.reactions.forEach((r, i) => {
    const eq = `${r.substrates.map(abbr).join(" + ")} → ${r.products.map(abbr).join(" + ")}`;
    const bits = [r.ec ? `EC ${r.ec}` : "", r.gene].filter(Boolean).join(", ");
    out.push(`${r.number ?? i + 1}. **${r.enzyme}**${bits ? ` (${bits})` : ""} — ${eq}`);
  });
  if (p.diseases.length > 0) {
    out.push("", "## Clinical", "");
    for (const d of p.diseases) out.push(`- **${d.name}** (${d.enzyme}) — ${d.summary}`);
  }
  return out.join("\n");
}
