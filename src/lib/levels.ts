// Study level — the one control that drives BOTH how much detail lands on the
// canvas and how deep the written notes go.
//
// The prose side lives in prompts.mjs (shared with the server). This file is the
// UI-facing half: labels, graph detail flags, and persistence.

import { DEFAULT_LEVEL, LEVELS, type Level } from "./prompts.mjs";

export type { Level };
export { DEFAULT_LEVEL, LEVELS };

export interface LevelMeta {
  id: Level;
  /** Short label for the header control. */
  label: string;
  /** Full name for the menu. */
  full: string;
  /** One line on what changes at this level. */
  blurb: string;
  /** Show cofactor satellites on the graph by default. */
  cofactors: boolean;
  /** Annotate enzyme nodes with EC number and gene symbol. */
  annotate: boolean;
}

export const levelMeta: LevelMeta[] = [
  {
    id: "undergrad",
    label: "BSc",
    full: "Undergraduate",
    blurb: "Main chain only. Names, energy balance, and why each step happens.",
    cofactors: false,
    annotate: false,
  },
  {
    id: "masters",
    label: "MSc",
    full: "Masters",
    blurb: "Adds cofactors, mechanism, regulation and thermodynamics.",
    cofactors: true,
    annotate: false,
  },
  {
    id: "phd",
    label: "PhD",
    full: "Doctoral",
    blurb: "Adds EC numbers, genes, kinetics, structure and flux control.",
    cofactors: true,
    annotate: true,
  },
];

export function metaFor(level: Level): LevelMeta {
  return levelMeta.find((l) => l.id === level) ?? levelMeta[0];
}

const LEVEL_LS = "metabomap_level";

export function loadLevel(): Level {
  try {
    const v = localStorage.getItem(LEVEL_LS);
    if (v && (LEVELS as readonly string[]).includes(v)) return v as Level;
  } catch {
    /* ignore */
  }
  return DEFAULT_LEVEL;
}

export function saveLevel(level: Level) {
  try {
    localStorage.setItem(LEVEL_LS, level);
  } catch {
    /* ignore */
  }
}
