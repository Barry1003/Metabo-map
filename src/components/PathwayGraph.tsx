import { useEffect, useRef } from "react";
import cytoscape from "cytoscape";
import type { Core, ElementDefinition } from "cytoscape";
import dagre from "cytoscape-dagre";
// @ts-expect-error — no bundled types
import fcose from "cytoscape-fcose";
import type { Pathway, Selection } from "../types";

// dagre gives a clean layered top-to-bottom flow (textbook-like) for directional
// pathways; fcose renders heavily cyclic ones as loops. Register once.
let layoutsReady = false;
if (!layoutsReady) {
  try { cytoscape.use(dagre); } catch { /* already */ }
  try { cytoscape.use(fcose); } catch { /* already */ }
  layoutsReady = true;
}

// Does the reaction graph contain a sizeable cycle? Cycles (TCA, urea) read
// better as loops (fcose); linear/branching pathways read better layered (dagre).
function hasLargeCycle(p: Pathway): boolean {
  const adj = new Map<string, string[]>();
  const push = (a: string, b: string) => { (adj.get(a) ?? adj.set(a, []).get(a)!).push(b); };
  for (const r of p.reactions) {
    for (const s of r.substrates) push(s, r.id);
    for (const pr of r.products) push(r.id, pr);
  }
  // Count nodes on any cycle via DFS back-edge detection (Tarjan-lite).
  const state = new Map<string, number>(); // 0=unseen,1=stack,2=done
  let onCycle = 0;
  const nodes = [...adj.keys()];
  const dfs = (n: string, depth: number): boolean => {
    if (depth > 400) return false;
    state.set(n, 1);
    let found = false;
    for (const m of adj.get(n) ?? []) {
      const st = state.get(m) ?? 0;
      if (st === 1) found = true;
      else if (st === 0 && dfs(m, depth + 1)) found = true;
    }
    state.set(n, 2);
    if (found) onCycle++;
    return found;
  };
  for (const n of nodes) if ((state.get(n) ?? 0) === 0) dfs(n, 0);
  return onCycle >= 3;
}

interface Props {
  pathway: Pathway;
  selection: Selection;
  showCofactors: boolean;
  /** PhD level: label enzyme nodes with their EC number and gene symbol. */
  annotateEnzymes: boolean;
  brokenReactionId: string | null;
  quizHiddenEnzymes: boolean;
  onSelect: (sel: Selection) => void;
}

// Spread the precomputed positions out for breathing room. Applied uniformly
// to every element (nodes and cofactor satellites) so alignment is preserved.
const CX = 300; // main column centre from the build script
const SX = 1.5; // horizontal spread
const SY = 1.5; // vertical spread
const scale = (p: { x: number; y: number }) => ({ x: CX + (p.x - CX) * SX, y: p.y * SY });

const compId = (name: string) => "comp-" + name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
const isEnergy = (label: string) => /^(ATP|ADP|NAD\+?|NADH|NADP\+?|NADPH|FAD|FADH2|GTP|GDP)$/i.test(label);

// Build Cytoscape elements from the pathway JSON. Cofactors are rendered as
// small satellite nodes attached to each reaction (the KEGG/Escher approach),
// which keeps ubiquitous ATP/NAD+ from collapsing the graph into a hairball.
//
// Curated pathways carry precomputed positions (preset layout) and sit inside a
// single labelled compartment band. Live pathways are laid out at runtime by
// dagre/fcose, which don't support compound nodes — so they render FLAT (no
// band); per-node compartment is shown in the inspector instead.
function buildElements(p: Pathway, showCofactors: boolean, annotateEnzymes: boolean): ElementDefinition[] {
  const els: ElementDefinition[] = [];
  const preset = !p.live;

  // Curated: one labelled band around everything. Live: no band (flat).
  const band = preset ? compId(p.compartment) : undefined;
  if (band) els.push({ data: { id: band, label: p.compartment, type: "compartment" } });
  const parentData = band ? { parent: band } : {};

  for (const m of p.metabolites) {
    els.push({
      data: { id: m.id, label: m.abbr, type: "metabolite", ...parentData },
      ...(preset ? { position: scale(m.pos) } : {}),
    });
  }

  for (const r of p.reactions) {
    // At doctoral level the node carries its own identifiers, so the graph can be
    // read without opening the inspector on every step.
    const sub = annotateEnzymes
      ? [r.ec ? `EC ${r.ec}` : "", r.gene].filter(Boolean).join(" · ")
      : "";
    els.push({
      data: {
        id: r.id,
        label: sub ? `${r.enzyme}\n${sub}` : r.enzyme,
        type: "enzyme",
        sub: sub || undefined,
        num: r.number ? String(r.number) : undefined,
        ...parentData,
      },
      ...(preset ? { position: scale(r.pos) } : {}),
    });
    for (const sid of r.substrates)
      els.push({ data: { id: `e-${sid}-${r.id}`, source: sid, target: r.id, type: "flow" } });
    for (const pid of r.products)
      els.push({ data: { id: `e-${r.id}-${pid}`, source: r.id, target: pid, type: "flow" } });

    if (showCofactors) {
      const base = preset ? scale(r.pos) : null;
      const side = base && base.x >= CX ? 1 : -1;
      const sats = [
        ...r.consumes.map((c, i) => ({ label: c, dir: "in" as const, i })),
        ...r.produces.map((c, i) => ({ label: c, dir: "out" as const, i })),
      ];
      sats.forEach((s) => {
        const id = `cof-${r.id}-${s.dir}-${s.label}`;
        els.push({
          data: { id, label: s.label, type: "cofactor", energy: isEnergy(s.label) ? "1" : undefined, ...parentData },
          ...(base ? { position: { x: base.x + side * 92, y: base.y + (s.dir === "in" ? -1 : 1) * (10 + s.i * 22) } } : {}),
        });
        els.push({ data: { id: `ce-${id}`, source: r.id, target: id, type: "cofactorEdge" } });
      });
    }
  }
  return els;
}

const stylesheet: cytoscape.StylesheetJson = [
  {
    selector: "node[type='compartment']",
    style: {
      "background-color": "#131A22",
      "background-opacity": 0.55,
      "border-color": "#233042",
      "border-width": 1,
      "border-style": "dashed",
      shape: "round-rectangle",
      label: "data(label)",
      "text-transform": "uppercase",
      "font-family": "IBM Plex Sans Condensed",
      "font-size": 12,
      "font-weight": 600,
      "text-valign": "top",
      "text-halign": "center",
      "text-margin-y": 14,
      color: "#546274",
      padding: "40",
    },
  },
  {
    selector: "node[type='metabolite']",
    style: {
      "background-color": "#48C9D9",
      width: 20,
      height: 20,
      // translucent halo so nodes read against the band
      "border-color": "#48C9D9",
      "border-opacity": 0.18,
      "border-width": 7,
      label: "data(label)",
      "font-family": "IBM Plex Sans",
      "font-size": 12.5,
      "font-weight": 500,
      color: "#D7E2ED",
      "text-valign": "bottom",
      "text-margin-y": 7,
      "text-outline-color": "#090D12",
      "text-outline-width": 3,
    },
  },
  {
    selector: "node[type='enzyme']",
    style: {
      "background-color": "#F2A93B",
      shape: "round-rectangle",
      width: "label",
      height: 24,
      padding: "8",
      label: "data(label)",
      "font-family": "IBM Plex Sans",
      "font-size": 10.5,
      "font-weight": 600,
      color: "#1a1206",
      "text-valign": "center",
      "text-halign": "center",
      "text-wrap": "wrap",
      "text-max-width": "120",
    },
  },
  {
    // Annotated (PhD) enzyme nodes carry a second line, so let them grow.
    selector: "node[type='enzyme'][sub]",
    style: { height: "label", "text-max-width": "150", padding: "9" },
  },
  {
    selector: "node[type='cofactor']",
    style: {
      "background-color": "#4a5a72",
      width: 7,
      height: 7,
      label: "data(label)",
      "font-family": "IBM Plex Mono",
      "font-size": 9,
      color: "#6b7c94",
      "text-valign": "center",
      "text-halign": "right",
      "text-margin-x": 3,
    },
  },
  {
    selector: "node[type='cofactor'][energy]",
    style: { "background-color": "#FFD166", color: "#c79b3f", "font-weight": 500 },
  },
  {
    selector: "edge[type='flow']",
    style: {
      width: 2,
      "line-color": "#37485c",
      "target-arrow-color": "#4a6079",
      "target-arrow-shape": "triangle",
      "arrow-scale": 1,
      "curve-style": "bezier",
    },
  },
  {
    selector: "edge[type='cofactorEdge']",
    style: {
      width: 1,
      "line-color": "#28323f",
      "line-style": "dashed",
      "curve-style": "unbundled-bezier",
      "control-point-distances": [-14],
      "control-point-weights": [0.5],
    },
  },
  {
    selector: "node.selected[type='metabolite']",
    style: {
      "background-color": "#7fe1ee",
      "border-color": "#E8EEF4",
      "border-opacity": 0.9,
      "border-width": 3,
      color: "#FFFFFF",
    },
  },
  {
    selector: "node.selected[type='enzyme']",
    style: { "background-color": "#ffc061", "border-color": "#E8EEF4", "border-width": 3, "border-opacity": 0.9 },
  },
  {
    selector: "edge.pathlit",
    style: { "line-color": "#48C9D9", "target-arrow-color": "#48C9D9", width: 2.5 },
  },
  {
    selector: "node.broken",
    style: { "background-color": "#E2564B", "border-color": "#E2564B", "border-opacity": 0.35, "border-width": 9 },
  },
  { selector: "node.downstream", style: { opacity: 0.3 } },
  {
    selector: "node.quizHidden",
    style: { "background-color": "#2a3644", label: "?", color: "#7D8B9C" },
  },
];

export default function PathwayGraph({
  pathway,
  selection,
  showCofactors,
  annotateEnzymes,
  brokenReactionId,
  quizHiddenEnzymes,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy = cytoscape({
      container: containerRef.current,
      elements: buildElements(pathway, showCofactors, annotateEnzymes),
      style: stylesheet,
      layout: { name: "preset" },
      minZoom: 0.15,
      maxZoom: 2.5,
      wheelSensitivity: 0.2,
      autoungrabify: !pathway.live, // curated nodes stay put; live nodes can be nudged
    });
    cyRef.current = cy;

    cy.on("tap", "node[type='metabolite']", (e) => onSelect({ kind: "metabolite", id: e.target.id() }));
    cy.on("tap", "node[type='enzyme']", (e) => onSelect({ kind: "reaction", id: e.target.id() }));
    cy.on("tap", (e) => { if (e.target === cy) onSelect(null); });

    const container = containerRef.current;
    const fit = () => { cy.resize(); cy.fit(cy.nodes(), 40); };
    const reveal = () => { fit(); if (container) container.style.opacity = "1"; };

    // Curated pathways use precomputed positions (reveal immediately). Live
    // pathways have none, so hide, run a layout, and reveal only once it
    // settles — otherwise the user sees a half-finished scatter flash by.
    if (pathway.live) {
      if (container) { container.style.transition = "opacity 0.2s"; container.style.opacity = "0"; }
      // Cyclic pathways (TCA, urea) read best as loops → fcose. Linear/branching
      // pathways read best as a clean layered top-to-bottom flow → dagre.
      const cyclic = hasLargeCycle(pathway);
      const opts = cyclic
        ? {
            name: "fcose", quality: "default", animate: false, randomize: true,
            packComponents: true, nodeRepulsion: () => 14000, idealEdgeLength: () => 110,
            nodeSeparation: 170, gravity: 0.12, gravityRange: 4, numIter: 1200,
            tile: true, tilingPaddingVertical: 30, tilingPaddingHorizontal: 30, padding: 40,
          }
        : {
            name: "dagre", rankDir: "TB", nodeSep: 55, edgeSep: 18, rankSep: 70,
            ranker: "network-simplex", animate: false, padding: 40,
          };
      const l = cy.layout(opts as unknown as cytoscape.LayoutOptions);
      l.one("layoutstop", reveal);
      l.run();
    } else {
      cy.ready(reveal);
    }

    // Debounce so mid-transition resizes don't fit to an intermediate size.
    let raf = 0;
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fit);
    });
    ro.observe(containerRef.current);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); cy.destroy(); };
  }, [pathway, showCofactors, annotateEnzymes, onSelect]);

  // Selection highlight + light up the edges touching the selected node.
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.elements().removeClass("selected pathlit");
    if (selection && "id" in selection) {
      const node = cy.getElementById(selection.id);
      node.addClass("selected");
      node.connectedEdges("[type='flow']").addClass("pathlit");
    }
  }, [selection]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass("broken downstream");
    if (!brokenReactionId) return;
    const start = cy.getElementById(brokenReactionId);
    if (start.empty()) return;
    start.addClass("broken");
    start.successors().nodes().addClass("downstream");
  }, [brokenReactionId]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes("[type='enzyme']").toggleClass("quizHidden", quizHiddenEnzymes);
  }, [quizHiddenEnzymes]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
