// MetaboMap build-time data pipeline (multi-pathway).
//
// Runs on a developer machine (never in the browser). Takes curated pathway
// skeletons, computes a clean textbook layout for each (vertical chain for
// linear pathways, a radial ring for cycles), enriches with real data from
// public scientific APIs, and writes one static JSON per pathway plus an index.
//
//   PubChem  -> 2D chemical structures (SMILES)
//   PubMed   -> primary-literature references
//   Groq     -> curator prose rewritten at student level (build time only)
//
// Usage:  node scripts/build-data.mjs            (build all)
//         node scripts/build-data.mjs glycolysis (build one)
//
// Keys come from .env (git-ignored). Every network call has a curated
// fallback, so a rate-limit or outage degrades output rather than breaking.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PATHWAYS } from "./pathways/index.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv() {
  try {
    const raw = readFileSync(join(ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
    }
  } catch { /* no .env */ }
}
loadEnv();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NCBI_API_KEY = process.env.NCBI_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// LAYOUT ENGINE — positions are precomputed so the browser never lays out
// curated pathways. Two shapes cover the undergraduate syllabus.
// ---------------------------------------------------------------------------
const COL = 300, STEP = 78, TOP = 70;

// linear: an explicit `order` of rows. A row is either ["metabolite"|"reaction",
// id, lane?] (advances one step down) or an array of such entries placed on the
// SAME row (for branches like the triose split). `lane` (-1|0|1) offsets x.
function layoutLinear(p) {
  const pos = {};
  let y = TOP;
  for (const row of p.layout.order) {
    const entries = Array.isArray(row[0]) ? row : [row];
    for (const [, id, lane = 0] of entries) pos[id] = { x: COL + lane * 160, y };
    y += STEP;
  }
  return pos;
}

// cycle: `ring` is the ordered list of backbone metabolites. Reactions sit on
// the ring arc between the members they connect; side inputs/outputs fan out.
function layoutCycle(p) {
  const ring = p.layout.ring;
  const n = ring.length;
  const CX = 380, CY = 360, R = Math.max(150, n * 46);
  const pos = {};
  const ang = (i) => (-90 + (i * 360) / n) * (Math.PI / 180);
  ring.forEach((id, i) => { pos[id] = { x: CX + R * Math.cos(ang(i)), y: CY + R * Math.sin(ang(i)) }; });

  for (const r of p.reactions) {
    const fromI = ring.findIndex((id) => r.substrates.includes(id));
    const toI = ring.findIndex((id) => r.products.includes(id));
    let a;
    if (fromI >= 0 && toI === (fromI + 1) % n) a = (-90 + ((fromI + 0.5) * 360) / n) * (Math.PI / 180);
    else if (fromI >= 0) a = ang(fromI);
    else if (toI >= 0) a = ang(toI);
    else if (r.layout?.at) a = r.layout.at.angle * (Math.PI / 180);
    else a = -Math.PI / 2;
    const rr = r.layout?.at?.radius ?? R;
    pos[r.id] = { x: CX + rr * Math.cos(a), y: CY + rr * Math.sin(a) };

    // side (non-ring) substrates/products fan outward from the reaction
    const sides = [...r.substrates, ...r.products].filter((id) => !ring.includes(id));
    sides.forEach((id, k) => {
      if (pos[id]) return;
      const outward = R + 92 + k * 46;
      pos[id] = { x: CX + outward * Math.cos(a), y: CY + outward * Math.sin(a) };
    });
  }
  return pos;
}

function computeLayout(p) {
  const pos = p.layout.type === "cycle" ? layoutCycle(p) : layoutLinear(p);
  // Explicit overrides for feeder nodes the formulas can't place well.
  for (const m of p.metabolites) if (m.fixed) pos[m.id] = m.fixed;
  for (const r of p.reactions) if (r.fixed) pos[r.id] = r.fixed;
  return pos;
}

// ---------------------------------------------------------------------------
// Enrichment
// ---------------------------------------------------------------------------
async function fetchSmiles(query) {
  if (!query) return null;
  for (const prop of ["CanonicalSMILES", "ConnectivitySMILES", "SMILES", "IsomericSMILES"]) {
    try {
      const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/property/${prop}/JSON`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        const row = json?.PropertyTable?.Properties?.[0];
        const smiles = row?.[prop] || row?.CanonicalSMILES || row?.SMILES;
        if (smiles) return smiles;
      }
    } catch { /* next */ }
    await sleep(220);
  }
  return null;
}

async function fetchPubmed(term) {
  try {
    const key = NCBI_API_KEY ? `&api_key=${NCBI_API_KEY}` : "";
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmode=json&retmax=2&sort=relevance&term=${encodeURIComponent(term)}${key}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const json = await res.json();
    const ids = json?.esearchresult?.idlist ?? [];
    await sleep(NCBI_API_KEY ? 110 : 350);
    return ids.map((pmid) => ({ pmid, url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` }));
  } catch { return []; }
}

async function rewriteForStudent(kind, name, note) {
  if (!GROQ_API_KEY || !note) return note;
  const prompt = `You are helping write a biochemistry study tool for second-year undergraduates.
Rewrite the following note about the ${kind} "${name}" into 2 short sentences of plain, accurate language a student can understand. Do not invent facts beyond the note. Do not add a preamble.

Note: ${note}`;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({ model: GROQ_MODEL, temperature: 0.3, max_tokens: 160, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) return note;
    const json = await res.json();
    return json?.choices?.[0]?.message?.content?.trim() || note;
  } catch { return note; }
}

// ---------------------------------------------------------------------------
// Build one pathway
// ---------------------------------------------------------------------------
async function buildPathway(p) {
  console.log(`\nMetaboMap build — ${p.name}`);
  const positions = computeLayout(p);

  const outMetabolites = [];
  for (const m of p.metabolites) {
    process.stdout.write(`  metabolite ${m.abbr} … `);
    const fetched = await fetchSmiles(m.query);
    const smiles = fetched || m.fallbackSmiles || "";
    const explanation = await rewriteForStudent("metabolite", m.name, m.note || `${m.name} is a ${m.carbons}-carbon intermediate in ${p.name}.`);
    outMetabolites.push({
      id: m.id, name: m.name, abbr: m.abbr, carbons: m.carbons,
      smiles, smilesSource: fetched ? "PubChem" : "curated",
      explanation, pos: positions[m.id] || { x: COL, y: TOP },
      compartment: m.compartment,
    });
    console.log(fetched ? "PubChem ✓" : (smiles ? "curated" : "no structure"));
  }

  const outReactions = [];
  let num = 0;
  for (const r of p.reactions) {
    num += 1;
    process.stdout.write(`  reaction   ${num}. ${r.enzyme} … `);
    const explanation = await rewriteForStudent("enzyme", r.enzyme, r.note);
    const refs = await fetchPubmed(`${r.enzyme} ${p.pubmedHint || p.name}`);
    outReactions.push({
      id: r.id, number: num, enzyme: r.enzyme, ec: r.ec || "", gene: r.gene || "",
      reactomeId: r.reactomeId || "",
      substrates: r.substrates, products: r.products,
      consumes: r.consumes || [], produces: r.produces || [],
      deltaATP: r.deltaATP || 0, deltaNADH: r.deltaNADH || 0, multiplicity: r.multiplicity || 1,
      explanation, references: refs,
      pos: positions[r.id] || { x: COL, y: TOP },
      compartment: r.compartment,
    });
    console.log(`${refs.length} ref(s)`);
  }

  const data = {
    id: p.id, name: p.name, subtitle: p.subtitle,
    compartment: p.compartment || "Cytosol",
    shape: p.layout.type,
    source: p.source || { pathway: p.reactomeId || "", license: "CC BY 4.0" },
    builtAt: new Date().toISOString(),
    metabolites: outMetabolites, reactions: outReactions,
    diseases: p.diseases || [],
  };

  const outDir = join(ROOT, "src", "data");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${p.id}.json`), JSON.stringify(data, null, 2));
  console.log(`  ✓ ${p.id}.json — ${outMetabolites.length} metabolites, ${outReactions.length} reactions`);
  return { id: p.id, name: p.name, subtitle: p.subtitle, shape: p.layout.type };
}

async function build() {
  console.log("MetaboMap multi-pathway build");
  console.log(`  Groq: ${GROQ_API_KEY ? "enabled" : "disabled"} · NCBI: ${NCBI_API_KEY ? "keyed" : "anon"}`);
  const only = process.argv[2];
  const list = only ? PATHWAYS.filter((p) => p.id === only) : PATHWAYS;
  if (list.length === 0) { console.error(`No pathway "${only}"`); process.exit(1); }

  const index = [];
  for (const p of list) index.push(await buildPathway(p));

  // Merge into the catalog index (so a single-pathway rebuild doesn't drop others)
  const idxPath = join(ROOT, "src", "data", "index.json");
  let existing = [];
  try { existing = JSON.parse(readFileSync(idxPath, "utf8")); } catch { /* first build */ }
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const e of index) byId.set(e.id, e);
  writeFileSync(idxPath, JSON.stringify([...byId.values()], null, 2));
  console.log(`\n✓ built ${index.length} pathway(s); index has ${byId.size}`);
}

build().catch((err) => { console.error("Build failed:", err); process.exit(1); });
