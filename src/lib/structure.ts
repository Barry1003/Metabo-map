// Resolve a 2D structure (SMILES) for a metabolite, trying progressively harder
// sources so live pathways rarely show "no structure":
//
//   1. PubChem by AI-expanded full name  (e.g. "L-ornithine")
//   2. PubChem by the raw Reactome name   (e.g. "L-Orn")
//   3. Reactome entity -> ChEBI id -> PubChem cross-reference   ← the robust one
//   4. PubChem by the ChEBI canonical name
//
// Every Reactome small molecule carries a ChEBI id, and PubChem indexes ChEBI,
// so step 3 succeeds for almost anything with a real 2D structure. All sources
// are CORS-open, so this runs in the browser with no key.

const REACTOME = "https://reactome.org/ContentService";
const cache = new Map<string, string | null>();

async function pubchemByName(name: string): Promise<string | null> {
  for (const prop of ["CanonicalSMILES", "ConnectivitySMILES", "SMILES"]) {
    try {
      const res = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(name)}/property/${prop}/JSON`,
      );
      if (!res.ok) continue;
      const json = await res.json();
      const row = json?.PropertyTable?.Properties?.[0];
      const s = row?.[prop] || row?.CanonicalSMILES || row?.ConnectivitySMILES || row?.SMILES;
      if (s) return s;
    } catch { /* next */ }
  }
  return null;
}

async function pubchemByChebi(chebi: string): Promise<string | null> {
  for (const prop of ["CanonicalSMILES", "ConnectivitySMILES", "SMILES"]) {
    try {
      const res = await fetch(
        `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/xref/RegistryID/CHEBI:${encodeURIComponent(chebi)}/property/${prop}/JSON`,
      );
      if (!res.ok) continue;
      const json = await res.json();
      const row = json?.PropertyTable?.Properties?.[0];
      const s = row?.[prop] || row?.CanonicalSMILES || row?.ConnectivitySMILES || row?.SMILES;
      if (s) return s;
    } catch { /* next */ }
  }
  return null;
}

async function chebiFromReactome(entityId: string): Promise<{ chebi?: string; name?: string }> {
  // Only real Reactome identifiers can be queried (not fallback displayNames).
  if (!/^R-[A-Z]+-\d+$/.test(entityId) && !/^\d+$/.test(entityId)) return {};
  try {
    const res = await fetch(`${REACTOME}/data/query/${encodeURIComponent(entityId)}`);
    if (!res.ok) return {};
    const d = await res.json();
    const ref = d?.referenceEntity;
    if (ref?.databaseName === "ChEBI" && ref?.identifier) {
      return { chebi: String(ref.identifier), name: ref?.name?.[0] };
    }
    return { name: ref?.name?.[0] };
  } catch {
    return {};
  }
}

export async function resolveSmiles(opts: {
  name: string;
  fullName?: string;
  entityId?: string;
}): Promise<string | null> {
  const key = opts.entityId || opts.fullName || opts.name;
  if (cache.has(key)) return cache.get(key)!;

  let s: string | null = null;
  if (opts.fullName) s = await pubchemByName(opts.fullName);
  if (!s) s = await pubchemByName(opts.name);
  if (!s && opts.entityId) {
    const { chebi, name } = await chebiFromReactome(opts.entityId);
    if (chebi) s = await pubchemByChebi(chebi);
    if (!s && name) s = await pubchemByName(name);
  }

  cache.set(key, s);
  return s;
}
