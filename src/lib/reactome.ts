// Runtime loader for ANY Reactome pathway.
//
// The curated build pipeline (scripts/build-data.mjs) still produces the
// polished flagship pathways, but this module lets a student search and open
// any of Reactome's ~2,600 human pathways live. Reactome's ContentService
// sends `access-control-allow-origin: *`, so this runs entirely in the browser
// with no server and no API key — the same zero-backend model as the rest of
// the app. Loading a pathway costs two requests: its contained reactions, then
// one batch fetch of their details.

import type { Metabolite, Pathway, Reaction } from "../types";

const BASE = "https://reactome.org/ContentService";
const MAX_REACTIONS = 60; // large pathways are capped (see brief: size varies by orders of magnitude)

export interface SearchHit {
  id: string; // stable identifier, e.g. R-HSA-70635
  name: string;
  summary: string;
  species: string;
}

const stripTags = (s: string) => s.replace(/<[^>]+>/g, "");
const stripComp = (name: string) => name.replace(/\s*\[[^\]]+\]\s*$/, "").trim();
const compOf = (name: string) => name.match(/\[([^\]]+)\]\s*$/)?.[1] ?? "";

// Ubiquitous cofactors — rendered as satellites, not main-line metabolites,
// so they don't wire every reaction to every other (the hairball problem).
const COFACTOR_RE =
  /^(ATP|ADP|AMP|GTP|GDP|GMP|Pi|PPi|orthophosphate|NAD\+?|NADH|NADP\+?|NADPH|FAD|FADH2|FMN|H\+|H2O|CO2|O2|CoA(-SH)?|HCO3-?|NH3|NH4\+?|PAPS|SAM|SAH|e-)$/i;
const isCofactor = (name: string) => COFACTOR_RE.test(stripComp(name));

// Reduce a reaction/catalyst name to a compact enzyme label for the graph.
// Keeps clean names ("Hexokinase") but shortens sentence-style Reactome names
// ("GSS:Mg2+ dimer synthesizes GSH" -> "GSS") to their leading gene symbol.
const REACTION_VERB =
  /\b(synthesi[sz]|cleav|hydrolys|ligat|transform|transloc|convert|reduc|oxidi[sz]|transfer|phosphorylat|dephosphorylat|isomeris|dehydrat|carboxylat|dimer|tetramer|complex|bind)/i;
function shortEnzyme(s: string): string {
  const clean = s.trim();
  if (clean.length <= 22 && !REACTION_VERB.test(clean)) return clean;
  const head = clean.split(/\s+/)[0].split(":")[0].replace(/[,;]+$/, "");
  return head || clean;
}

function energyToken(name: string): "ATP" | "ADP" | "NAD+" | "NADH" | "NADP+" | "NADPH" | "FAD" | "FADH2" | null {
  const n = stripComp(name).toUpperCase();
  if (n === "ATP") return "ATP";
  if (n === "ADP") return "ADP";
  if (n === "NAD+" || n === "NAD") return "NAD+";
  if (n === "NADH") return "NADH";
  if (n === "NADPH") return "NADPH";
  if (n === "NADP+" || n === "NADP") return "NADP+";
  if (n === "FAD") return "FAD";
  if (n === "FADH2") return "FADH2";
  return null;
}

// Reactome occasionally drops a request (transient network / rate blip), which
// surfaces as fetch()'s "Failed to fetch". Retry a few times with backoff so a
// single hiccup doesn't fail the whole load.
async function fetchRetry(url: string, opts?: RequestInit, tries = 3): Promise<Response> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, opts);
      if (r.ok || (r.status >= 400 && r.status < 500)) return r; // 4xx won't fix on retry
      lastErr = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((res) => setTimeout(res, 450 * (i + 1)));
  }
  throw lastErr instanceof Error ? lastErr : new Error("Network error");
}

// Textbook pathway names Reactome files under different terms. Without this,
// a student who types the name they were taught gets loose keyword junk. Maps
// the query to the term Reactome actually indexes.
const ALIASES: [RegExp, string][] = [
  [/gamma[-\s]?glutamyl\s*cycle|γ[-\s]?glutamyl|meister\s*cycle/i, "glutathione synthesis and recycling"],
  [/electron\s*transport\s*chain|\betc\b/i, "respiratory electron transport"],
  [/krebs\s*cycle|tca\s*cycle|tricarboxylic/i, "citric acid cycle"],
  [/hmp\s*shunt|hexose\s*monophosphate/i, "pentose phosphate pathway"],
  [/cahill\s*cycle|glucose[-\s]?alanine/i, "alanine metabolism"],
];
function applyAlias(q: string): string {
  for (const [re, term] of ALIASES) if (re.test(q)) return term;
  return q;
}

export async function searchPathways(query: string): Promise<SearchHit[]> {
  const q = applyAlias(query.trim());
  if (q.length < 2) return [];
  const url =
    `${BASE}/search/query?query=${encodeURIComponent(q)}` +
    `&species=Homo%20sapiens&types=Pathway&cluster=true`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = await res.json();
  const hits: SearchHit[] = [];
  for (const group of json.results ?? []) {
    for (const e of group.entries ?? []) {
      hits.push({
        id: e.stId || e.id,
        name: stripTags(e.name || ""),
        summary: stripTags(e.summation || "").slice(0, 160),
        species: (e.species && e.species[0]) || "Homo sapiens",
      });
    }
  }
  // de-dup by id, keep order
  const seen = new Set<string>();
  return hits.filter((h) => h.id && !seen.has(h.id) && seen.add(h.id)).slice(0, 25);
}

interface RxEntity {
  displayName?: string;
  stId?: string;
  dbId?: number;
  schemaClass?: string;
}
// Small molecules (metabolites and cofactors) vs. proteins/genes/complexes.
const isSmallMolecule = (e: RxEntity) => e.schemaClass === "SimpleEntity" || e.schemaClass === "ChemicalDrug";
interface RxObject {
  dbId: number;
  stId?: string;
  displayName?: string;
  schemaClass?: string;
  input?: RxEntity[];
  output?: RxEntity[];
  compartment?: { displayName?: string }[];
  catalystActivity?: { physicalEntity?: RxEntity }[];
  summation?: { text?: string }[];
}

export async function loadPathway(id: string, name: string, summary = ""): Promise<Pathway> {
  // 1) all reactions contained in the pathway
  const evRes = await fetchRetry(`${BASE}/data/pathway/${id}/containedEvents`);
  if (!evRes.ok) throw new Error(`Reactome returned ${evRes.status} for ${id}`);
  // containedEvents flattens the pathway tree, but events referenced more than
  // once come back as bare integer dbIds (not full objects) — the core cycle
  // reactions are often among these, so we must collect them too.
  const events = (await evRes.json()) as unknown[];
  const idSet = new Set<number>();
  for (const e of events) {
    if (typeof e === "number") idSet.add(e);
    else if (e && typeof e === "object") {
      const o = e as RxObject;
      if (/Reaction|BlackBoxEvent/.test(o.schemaClass || "") && o.dbId) idSet.add(o.dbId);
    }
  }
  const rxnIds = [...idSet];
  if (rxnIds.length === 0) throw new Error("This pathway has no renderable reactions. Try a more specific pathway.");
  const capped = rxnIds.slice(0, MAX_REACTIONS);

  // 2) one batch fetch of reaction details
  const detRes = await fetchRetry(`${BASE}/data/query/ids`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: capped.join(","),
  });
  if (!detRes.ok) throw new Error(`Reactome batch query failed (${detRes.status})`);
  const details = (await detRes.json()) as RxObject[];

  // 3) transform into the app's graph model
  const metaboliteMap = new Map<string, Metabolite>();
  const reactions: Reaction[] = [];
  const compartments = new Set<string>();

  // Merge metabolites by NAME, not by Reactome entity id. The same molecule
  // (e.g. GSH) gets a distinct entity id in every reaction/compartment; keeping
  // them separate fragments the graph into disconnected islands that scatter.
  // Merging makes shared metabolites into single hubs so the pathway connects
  // into an actual sequence the layout can lay out.
  const addMetabolite = (ent: RxEntity, comp: string): string => {
    const clean = stripComp(ent.displayName || String(ent.stId || ent.dbId || "?"));
    const key = clean.toLowerCase();
    if (!metaboliteMap.has(key)) {
      metaboliteMap.set(key, {
        id: key,
        name: clean,
        abbr: clean.length > 14 ? clean.slice(0, 13) + "…" : clean,
        carbons: 0,
        smiles: "",
        smilesSource: "curated",
        explanation: "",
        pos: { x: 0, y: 0 },
        compartment: comp,
        entityId: ent.stId || (ent.dbId ? String(ent.dbId) : undefined),
      });
    }
    return key;
  };

  details.forEach((r, i) => {
    if (!/Reaction|BlackBoxEvent/.test(r.schemaClass || "")) return;

    // Only small molecules form the chemical graph. Reactions with no small
    // molecules at all (e.g. "TP53 binds CPS1 gene") are transcriptional /
    // regulatory noise bundled into the pathway — skip them.
    const inputs = (r.input || []).filter((e) => e.displayName && isSmallMolecule(e));
    const outputs = (r.output || []).filter((e) => e.displayName && isSmallMolecule(e));
    if (inputs.length === 0 && outputs.length === 0) return;

    const comp = r.compartment?.[0]?.displayName || "unknown";
    compartments.add(comp);

    const subs = inputs.filter((e) => !isCofactor(e.displayName!));
    const prods = outputs.filter((e) => !isCofactor(e.displayName!));

    // Skip pure transport/translocation events (same molecule in and out, just
    // a compartment change) — no chemistry, and they clutter the graph with a
    // box labelled after the molecule it moves.
    const subKey = subs.map((e) => stripComp(e.displayName!).toLowerCase()).sort().join("|");
    const prodKey = prods.map((e) => stripComp(e.displayName!).toLowerCase()).sort().join("|");
    if (subKey && subKey === prodKey) return;

    const consumes = inputs.filter((e) => isCofactor(e.displayName!)).map((e) => stripComp(e.displayName!));
    const produces = outputs.filter((e) => isCofactor(e.displayName!)).map((e) => stripComp(e.displayName!));

    // Energy delta from cofactor movement (best effort for arbitrary pathways).
    const inTok = consumes.map(energyToken);
    const outTok = produces.map(energyToken);
    let deltaATP = 0;
    let deltaNADH = 0;
    if (inTok.includes("ATP") && outTok.includes("ADP")) deltaATP -= 1;
    if (inTok.includes("ADP") && outTok.includes("ATP")) deltaATP += 1;
    if (inTok.includes("NAD+") && outTok.includes("NADH")) deltaNADH += 1;
    if (inTok.includes("NADH") && outTok.includes("NAD+")) deltaNADH -= 1;

    // Reactome names reactions as full sentences ("CHAC1,2 cleaves GSH to
    // OPRO and CysGly"), which make huge overlapping graph boxes. Use the
    // leading gene symbol as the node label; the full name stays in the note.
    const rawName =
      stripComp(r.catalystActivity?.[0]?.physicalEntity?.displayName || "") ||
      stripComp(r.displayName || `Reaction ${i + 1}`);
    const enzyme = shortEnzyme(rawName);

    const substrates = subs.map((e) => addMetabolite(e, comp));
    const products = prods.map((e) => addMetabolite(e, comp));

    reactions.push({
      id: `rx-${r.dbId}`,
      enzyme: enzyme.length > 40 ? enzyme.slice(0, 39) + "…" : enzyme,
      ec: "",
      gene: "",
      reactomeId: r.stId || String(r.dbId),
      substrates,
      products,
      consumes,
      produces,
      deltaATP,
      deltaNADH,
      multiplicity: 1,
      explanation:
        r.summation?.[0]?.text?.slice(0, 400) ||
        `${stripComp(r.displayName || "")}. Curated reaction from Reactome.`,
      references: [{ pmid: r.stId || String(r.dbId), url: `https://reactome.org/content/detail/${r.stId || r.dbId}` }],
      pos: { x: 0, y: 0 },
      compartment: comp,
    });
  });

  return {
    id,
    name,
    subtitle:
      summary ? stripTags(summary).slice(0, 120) : `${reactions.length} reactions · ${compartments.size} compartment(s)`,
    compartment: [...compartments][0] || "cell",
    source: { pathway: `Reactome ${id}`, license: "CC BY 4.0" },
    builtAt: new Date().toISOString(),
    metabolites: [...metaboliteMap.values()],
    reactions,
    diseases: [],
    live: true,
    truncated: rxnIds.length > capped.length ? { shown: capped.length, total: rxnIds.length } : undefined,
  };
}
