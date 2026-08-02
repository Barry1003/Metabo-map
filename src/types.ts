export interface Metabolite {
  id: string;
  name: string;
  abbr: string;
  carbons: number;
  smiles: string;
  smilesSource: "PubChem" | "curated";
  explanation: string;
  pos: { x: number; y: number };
  compartment?: string;
  entityId?: string; // Reactome entity id, for live structure lookup
}

export interface Reference {
  pmid: string;
  url: string;
}

export interface Reaction {
  id: string;
  number?: number;
  enzyme: string;
  ec: string;
  gene: string;
  reactomeId: string;
  substrates: string[];
  products: string[];
  consumes: string[];
  produces: string[];
  deltaATP: number;
  deltaNADH: number;
  multiplicity: number;
  explanation: string;
  references: Reference[];
  pos: { x: number; y: number };
  compartment?: string;
}

export interface Disease {
  id: string;
  name: string;
  reactionId: string;
  enzyme: string;
  summary: string;
}

export interface Pathway {
  id: string;
  name: string;
  subtitle: string;
  compartment: string;
  source: { pathway: string; license: string };
  builtAt: string;
  metabolites: Metabolite[];
  reactions: Reaction[];
  diseases: Disease[];
  live?: boolean;
  truncated?: { shown: number; total: number };
}

export type Selection =
  | { kind: "metabolite"; id: string }
  | { kind: "reaction"; id: string }
  | { kind: "about" }
  | null;
