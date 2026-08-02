// Curated pathway catalog. This is the "filter" the project brief describes:
// a fixed set covering the undergraduate syllabus, searchable in plain language
// (synonyms map "sugar breakdown" -> glycolysis). Pathways marked `ready` have
// been built through the pipeline (src/data/<id>.json); `planned` ones are on
// the roadmap — building one is just running the build script for it.

export interface CatalogEntry {
  id: string;
  name: string;
  blurb: string;
  status: "ready" | "planned";
  synonyms: string[];
}

export const catalog: CatalogEntry[] = [
  { id: "glycolysis", name: "Glycolysis", status: "ready",
    blurb: "Glucose → 2 pyruvate. Net +2 ATP, +2 NADH.",
    synonyms: ["sugar breakdown", "glucose breakdown", "emp pathway", "energy from glucose"] },

  { id: "gluconeogenesis", name: "Gluconeogenesis", status: "planned",
    blurb: "Making glucose from pyruvate — glycolysis in reverse with three bypasses.",
    synonyms: ["making glucose", "glucose synthesis"] },
  { id: "tca", name: "Citric Acid Cycle", status: "planned",
    blurb: "The central hub of oxidative metabolism. A true cycle.",
    synonyms: ["krebs cycle", "tca cycle", "citric acid", "tricarboxylic acid"] },
  { id: "ppp", name: "Pentose Phosphate Pathway", status: "planned",
    blurb: "NADPH and ribose-5-phosphate for biosynthesis.",
    synonyms: ["hmp shunt", "pentose phosphate", "nadph production"] },
  { id: "urea", name: "Urea Cycle", status: "planned",
    blurb: "Disposing of ammonia as urea, across two compartments.",
    synonyms: ["ornithine cycle", "ammonia disposal", "nitrogen excretion"] },
  { id: "beta-ox", name: "Fatty Acid β-Oxidation", status: "planned",
    blurb: "Breaking fatty acids down to acetyl-CoA.",
    synonyms: ["fat burning", "lipid breakdown", "fatty acid oxidation"] },
  { id: "glycogen", name: "Glycogen Metabolism", status: "planned",
    blurb: "Storing and mobilising glucose as glycogen.",
    synonyms: ["glycogenolysis", "glycogenesis", "glucose storage"] },
  { id: "purine", name: "Purine Nucleotide Metabolism", status: "planned",
    blurb: "Building and salvaging adenine and guanine nucleotides.",
    synonyms: ["nucleic acid metabolism", "dna building blocks", "adenine", "guanine", "nucleotide synthesis"] },
  { id: "pyrimidine", name: "Pyrimidine Nucleotide Metabolism", status: "planned",
    blurb: "Building and salvaging cytosine, thymine and uracil nucleotides.",
    synonyms: ["nucleic acid metabolism", "dna building blocks", "cytosine", "thymine", "uracil"] },
  { id: "etc", name: "Oxidative Phosphorylation", status: "planned",
    blurb: "The electron transport chain and ATP synthase.",
    synonyms: ["electron transport chain", "etc", "atp synthase", "respiratory chain"] },
  { id: "glutathione", name: "Glutathione / γ-Glutamyl Cycle", status: "planned",
    blurb: "Glutathione synthesis and recycling — the Meister (γ-glutamyl) cycle.",
    synonyms: ["gamma glutamyl cycle", "γ-glutamyl cycle", "meister cycle", "glutathione", "gsh"] },
];

export function searchCatalog(query: string): CatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return catalog;
  return catalog.filter((e) => {
    const hay = [e.name, e.blurb, ...e.synonyms].join(" ").toLowerCase();
    return q.split(/\s+/).every((word) => hay.includes(word));
  });
}
