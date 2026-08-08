// Grounding: retrieve real, sourced facts before asking the model to explain
// anything, so its job shifts from REMEMBERING to EXPLAINING. That is what
// actually suppresses hallucination — a bigger model does not.
//
// Sources, all CORS-open and key-free, all openly licensed:
//   • UniProt   (CC-BY 4.0)      — enzyme function, catalytic activity, cofactors, regulation
//   • PubChem   (public domain)  — formula, mass, IUPAC name, charge
//   • Reactome  (CC0, via structure.ts) — entity → ChEBI, for metabolites whose
//     abbreviation ("G6P") PubChem cannot resolve by name
//
// The block returned is prefixed as authoritative; prompts.mjs instructs the
// model to prefer it over its own recall and never contradict it.

import { chebiFromReactome } from "./structure";

export interface FactSheet {
  /** Compact block to prepend to the prompt context. Empty when nothing resolved. */
  text: string;
  /** Human-readable provenance, shown under the notes in the inspector. */
  sources: string[];
}

const EMPTY: FactSheet = { text: "", sources: [] };
const cache = new Map<string, FactSheet>();

function clip(s: unknown, n: number): string {
  const t = String(s ?? "").replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
}

async function getJSON(url: string): Promise<any | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- metabolites

const PUBCHEM = "https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound";
const PROPS = "MolecularFormula,MolecularWeight,IUPACName,Charge";

async function pubchemProps(path: string): Promise<{ line: string; cid: string } | null> {
  const json = await getJSON(`${PUBCHEM}/${path}/property/${PROPS}/JSON`);
  const row = json?.PropertyTable?.Properties?.[0];
  if (!row) return null;
  const bits = [
    row.MolecularFormula ? `formula ${row.MolecularFormula}` : "",
    row.MolecularWeight ? `MW ${row.MolecularWeight} g/mol` : "",
    row.Charge !== undefined && row.Charge !== null ? `formal charge ${row.Charge}` : "",
    row.IUPACName ? `IUPAC name ${clip(row.IUPACName, 120)}` : "",
  ].filter(Boolean);
  if (bits.length === 0) return null;
  return { line: bits.join("; "), cid: String(row.CID ?? "") };
}

export async function metaboliteFacts(opts: {
  name: string;
  fullName?: string;
  entityId?: string;
}): Promise<FactSheet> {
  const key = `m:${opts.entityId || opts.fullName || opts.name}`;
  const hit = cache.get(key);
  if (hit) return hit;

  let found: { line: string; cid: string } | null = null;
  const sources: string[] = [];

  if (opts.fullName) found = await pubchemProps(`name/${encodeURIComponent(opts.fullName)}`);
  if (!found) found = await pubchemProps(`name/${encodeURIComponent(opts.name)}`);
  // Abbreviations ("G6P", "L-Orn") don't resolve by name — go via the Reactome
  // entity's ChEBI id, which PubChem cross-references.
  if (!found && opts.entityId) {
    const { chebi } = await chebiFromReactome(opts.entityId);
    if (chebi) {
      found = await pubchemProps(`xref/RegistryID/CHEBI:${encodeURIComponent(chebi)}`);
      if (found) sources.push(`ChEBI:${chebi}`);
    }
  }

  if (!found) {
    cache.set(key, EMPTY);
    return EMPTY;
  }

  sources.unshift(found.cid ? `PubChem CID ${found.cid}` : "PubChem");
  const sheet: FactSheet = {
    text: `Chemical data for ${opts.fullName || opts.name}: ${found.line}.`,
    sources,
  };
  cache.set(key, sheet);
  return sheet;
}

// -------------------------------------------------------------------- enzymes

const UNIPROT = "https://rest.uniprot.org/uniprotkb/search";
const UNIPROT_FIELDS =
  "accession,protein_name,cc_function,cc_catalytic_activity,cc_cofactor,cc_activity_regulation";

function commentTexts(comments: any[], type: string, limit: number): string[] {
  return comments
    .filter((c) => c?.commentType === type)
    .flatMap((c) => (c.texts ?? []).map((t: any) => t?.value))
    .filter(Boolean)
    .slice(0, limit);
}

async function uniprotSearch(query: string): Promise<any | null> {
  const url =
    `${UNIPROT}?query=${encodeURIComponent(query)}` +
    `&fields=${UNIPROT_FIELDS}&format=json&size=1`;
  const json = await getJSON(url);
  return json?.results?.[0] ?? null;
}

export async function enzymeFacts(opts: {
  enzyme: string;
  ec?: string;
  gene?: string;
}): Promise<FactSheet> {
  const key = `e:${opts.gene || opts.ec || opts.enzyme}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // Reviewed human entry first by gene, then by EC number.
  let entry = opts.gene
    ? await uniprotSearch(`gene:${opts.gene} AND organism_id:9606 AND reviewed:true`)
    : null;
  if (!entry && opts.ec) entry = await uniprotSearch(`ec:${opts.ec} AND organism_id:9606 AND reviewed:true`);

  if (!entry) {
    cache.set(key, EMPTY);
    return EMPTY;
  }

  const comments: any[] = entry.comments ?? [];
  const fullName = entry?.proteinDescription?.recommendedName?.fullName?.value;

  const catalytic = comments
    .filter((c) => c?.commentType === "CATALYTIC ACTIVITY")
    .map((c) => c?.reaction?.name)
    .filter(Boolean)
    .slice(0, 3);

  const cofactors = comments
    .filter((c) => c?.commentType === "COFACTOR")
    .flatMap((c) => (c.cofactors ?? []).map((x: any) => x?.name))
    .filter(Boolean)
    .slice(0, 4);

  const lines = [
    fullName ? `UniProt name: ${clip(fullName, 120)}.` : "",
    catalytic.length ? `Catalysed reaction(s): ${catalytic.map((r: string) => clip(r, 160)).join(" | ")}.` : "",
    cofactors.length ? `Cofactors: ${cofactors.join(", ")}.` : "",
    commentTexts(comments, "FUNCTION", 1).map((t) => `Function: ${clip(t, 700)}.`).join(" "),
    commentTexts(comments, "ACTIVITY REGULATION", 1).map((t) => `Activity regulation: ${clip(t, 500)}.`).join(" "),
  ].filter(Boolean);

  if (lines.length === 0) {
    cache.set(key, EMPTY);
    return EMPTY;
  }

  const sheet: FactSheet = {
    text: lines.join(" "),
    sources: [`UniProt ${entry.primaryAccession}`],
  };
  cache.set(key, sheet);
  return sheet;
}

/** Wrap a retrieved block so the prompt can treat it as authoritative. */
export function asContext(sheet: FactSheet, extra: string): string {
  if (!sheet.text) return extra;
  return `SOURCED FACTS (retrieved live, authoritative): ${sheet.text}\nPATHWAY CONTEXT: ${extra}`;
}
