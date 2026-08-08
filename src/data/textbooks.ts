// Textbook citation layer — where to read this pathway in the standard texts.
//
// This is a POINTER index, not content: book, edition, chapter number and
// chapter title, so you can go straight to the right pages in your own copy.
// Nothing from the books themselves is stored or reproduced here.
//
// ⚠ Chapter NUMBERS shift between editions. The chapter TITLE is the reliable
// lookup key — if the number doesn't match your copy, search the title. Editions
// cited are stated per entry; verify against the one you actually own.

import type { Level } from "../lib/levels";

export interface Citation {
  book: string;
  edition: string;
  chapter: string; // e.g. "Ch 18"
  title: string;
  /** Levels this book is a sensible read for. */
  levels: Level[];
}

/** Keyed by catalog pathway id. */
const byId: Record<string, Citation[]> = {
  glycolysis: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 8", title: "Glycolysis", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 18", title: "Glycolysis & the Oxidation of Pyruvate", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 14", title: "Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 16", title: "Glycolysis and Gluconeogenesis", levels: ["masters", "phd"] },
  ],
  gluconeogenesis: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 10", title: "Gluconeogenesis", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 20", title: "Gluconeogenesis & the Control of Blood Glucose", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 14", title: "Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 16", title: "Glycolysis and Gluconeogenesis", levels: ["masters", "phd"] },
  ],
  tca: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 9", title: "Tricarboxylic Acid Cycle and Pyruvate Dehydrogenase Complex", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 17", title: "The Citric Acid Cycle: The Central Pathway of Carbohydrate, Lipid & Amino Acid Metabolism", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 16", title: "The Citric Acid Cycle", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 17", title: "The Citric Acid Cycle", levels: ["masters", "phd"] },
  ],
  ppp: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 13", title: "Pentose Phosphate Pathway and NADPH", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 21", title: "The Pentose Phosphate Pathway & Other Pathways of Hexose Metabolism", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 14", title: "Glycolysis, Gluconeogenesis, and the Pentose Phosphate Pathway", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 20", title: "The Pentose Phosphate Pathway", levels: ["masters", "phd"] },
  ],
  urea: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 19", title: "Amino Acids: Disposal of Nitrogen", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 28", title: "Catabolism of Proteins & of Amino Acid Nitrogen", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 18", title: "Amino Acid Oxidation and the Production of Urea", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 23", title: "Protein Turnover and Amino Acid Catabolism", levels: ["masters", "phd"] },
  ],
  "beta-ox": [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 16", title: "Fatty Acid, Ketone Body, and Triacylglycerol Metabolism", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 22", title: "Oxidation of Fatty Acids: Ketogenesis", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 17", title: "Fatty Acid Catabolism", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 22", title: "Fatty Acid Metabolism", levels: ["masters", "phd"] },
  ],
  glycogen: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 11", title: "Glycogen Metabolism", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 19", title: "Metabolism of Glycogen", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 15", title: "Principles of Metabolic Regulation", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 21", title: "Glycogen Metabolism", levels: ["masters", "phd"] },
  ],
  purine: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 22", title: "Nucleotide Metabolism", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 33", title: "Metabolism of Purine & Pyrimidine Nucleotides", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 22", title: "Biosynthesis of Amino Acids, Nucleotides, and Related Molecules", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 25", title: "Nucleotide Biosynthesis", levels: ["masters", "phd"] },
  ],
  etc: [
    { book: "Lippincott's Illustrated Reviews: Biochemistry", edition: "8e", chapter: "Ch 6", title: "Bioenergetics and Oxidative Phosphorylation", levels: ["undergrad"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 15", title: "The Respiratory Chain & Oxidative Phosphorylation", levels: ["undergrad", "masters"] },
    { book: "Lehninger Principles of Biochemistry", edition: "8e", chapter: "Ch 19", title: "Oxidative Phosphorylation", levels: ["masters", "phd"] },
    { book: "Berg, Tymoczko & Stryer, Biochemistry", edition: "9e", chapter: "Ch 18", title: "Oxidative Phosphorylation", levels: ["masters", "phd"] },
  ],
  glutathione: [
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 21", title: "The Pentose Phosphate Pathway & Other Pathways of Hexose Metabolism", levels: ["undergrad", "masters"] },
    { book: "Harper's Illustrated Biochemistry", edition: "32e", chapter: "Ch 53", title: "Metabolism of Xenobiotics", levels: ["masters", "phd"] },
  ],
};

// Pyrimidines share their chapters with purines in every one of these texts.
byId.pyrimidine = byId.purine;

// Keyword fallback so live Reactome pathways (arbitrary ids) still resolve.
const byKeyword: [RegExp, string][] = [
  [/glycolys|embden|meyerhof/i, "glycolysis"],
  [/gluconeogen/i, "gluconeogenesis"],
  [/citric acid|krebs|tricarboxylic|\btca\b/i, "tca"],
  [/pentose phosphate|hmp shunt/i, "ppp"],
  [/urea|ornithine cycle|ammonia/i, "urea"],
  [/beta.?oxidation|β.?oxidation|fatty acid (oxidation|catabolism)/i, "beta-ox"],
  [/glycogen/i, "glycogen"],
  [/purine/i, "purine"],
  [/pyrimidin/i, "pyrimidine"],
  [/electron transport|oxidative phosphoryl|respiratory chain|atp synthase/i, "etc"],
  [/glutathione|glutamyl/i, "glutathione"],
];

/**
 * Citations for a pathway, filtered to those worth reading at `level`.
 * Falls back to matching the pathway name when the id isn't a catalog one.
 */
export function citationsFor(pathwayId: string, pathwayName: string, level: Level): Citation[] {
  let list = byId[pathwayId];
  if (!list) {
    const hit = byKeyword.find(([re]) => re.test(pathwayName));
    if (hit) list = byId[hit[1]];
  }
  if (!list) return [];
  const atLevel = list.filter((c) => c.levels.includes(level));
  // Never show an empty block just because no book was tagged for this level.
  return atLevel.length > 0 ? atLevel : list;
}
