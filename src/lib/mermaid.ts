// Pathway → Mermaid flowchart, for pasting into notes (Obsidian, Notion,
// GitHub, VS Code) or printing.
//
// This is an EXPORT format, not the canvas — Mermaid renders a static SVG with
// no selection or traversal, which is why the app still draws with Cytoscape.
// What it gives you instead is portability: your revision notes keep the
// pathway as text you can diff, edit and print.
//
// Enzymes normally ride on the arrow rather than sitting in their own box —
// that is how the textbooks draw it and it halves the node count. A reaction
// with several substrates AND several products can't be drawn that way, so
// those get an explicit enzyme node.

import type { Pathway } from "../types";
import { metaFor, type Level } from "./levels";

/** Mermaid node ids must be bare identifiers. */
function nodeId(prefix: string, raw: string): string {
  return `${prefix}_${raw.replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "")}`;
}

// Mermaid takes quoted labels, so most punctuation is safe. Two things aren't:
// a literal quote ends the label, and a pipe closes the -->|"..."| edge form.
function esc(text: string): string {
  return text.replace(/"/g, "&quot;").replace(/\|/g, "/");
}

function edgeLabel(
  enzyme: string,
  extras: string[],
): string {
  const parts = [esc(enzyme), ...extras.filter(Boolean).map(esc)];
  return parts.join("<br/>");
}

export interface MermaidOptions {
  level: Level;
  /** Include the ATP/NADH balance and cofactors on each arrow. */
  showCofactors: boolean;
}

export function toMermaid(p: Pathway, { level, showCofactors }: MermaidOptions): string {
  const meta = metaFor(level);
  const lines: string[] = [];

  lines.push(`%% ${p.name}${p.subtitle ? ` — ${p.subtitle}` : ""}`);
  lines.push(`%% Compartment: ${p.compartment} · Level: ${meta.full}`);
  if (p.source?.pathway) lines.push(`%% Source: ${p.source.pathway}${p.source.license ? ` (${p.source.license})` : ""}`);
  lines.push(`%% Exported from MetaboMap`);
  lines.push("flowchart TD");

  // Declare metabolites first so labels are full names, not abbreviations.
  for (const m of p.metabolites) {
    const label = m.name && m.name !== m.abbr ? `${m.abbr} — ${m.name}` : m.abbr || m.name;
    lines.push(`  ${nodeId("m", m.id)}["${esc(label)}"]`);
  }

  lines.push("");

  p.reactions.forEach((r, idx) => {
    const extras: string[] = [];
    if (meta.annotate) {
      const ident = [r.ec ? `EC ${r.ec}` : "", r.gene].filter(Boolean).join(" · ");
      if (ident) extras.push(ident);
    }
    if (showCofactors) {
      const flow = [r.consumes.join(" + "), r.produces.join(" + ")].filter(Boolean);
      if (flow.length === 2) extras.push(`${flow[0]} → ${flow[1]}`);
      else if (flow.length === 1) extras.push(flow[0]);
    }
    const energy = [
      r.deltaATP ? `${r.deltaATP > 0 ? "+" : ""}${r.deltaATP} ATP` : "",
      r.deltaNADH ? `+${r.deltaNADH} NADH` : "",
    ].filter(Boolean).join(", ");
    if (energy) extras.push(energy);

    // Curated data doesn't always carry an explicit step number; fall back to
    // position, exactly as the inspector's step list does.
    const label = edgeLabel(`${r.number ?? idx + 1}. ${r.enzyme}`, extras);
    const subs = r.substrates.map((s) => nodeId("m", s));
    const prods = r.products.map((s) => nodeId("m", s));

    if (subs.length === 0 || prods.length === 0) return;

    if (subs.length === 1 || prods.length === 1) {
      // Fan in or fan out — the enzyme rides on every arrow.
      for (const s of subs) for (const t of prods) lines.push(`  ${s} -->|"${label}"| ${t}`);
    } else {
      // Many-to-many needs a real node for the enzyme.
      const rid = nodeId("r", r.id);
      lines.push(`  ${rid}{{"${label}"}}`);
      for (const s of subs) lines.push(`  ${s} --> ${rid}`);
      for (const t of prods) lines.push(`  ${rid} --> ${t}`);
    }
  });

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
