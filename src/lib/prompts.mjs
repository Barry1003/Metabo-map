// Single source of truth for every LLM prompt in the app.
//
// Imported by BOTH sides so the wording can never drift:
//   • src/lib/enrich.ts  (browser → Agent Router, premium path)
//   • api/_core.mjs      (server → Groq / any OpenAI-compatible, fallback path)
//
// Plain .mjs so Node (the Vercel function and the Vite dev middleware) and the
// Vite browser bundle can both load it. Types live alongside in prompts.d.mts.

export const LEVELS = ["undergrad", "masters", "phd"];
export const DEFAULT_LEVEL = "undergrad";

// How hard the model teaches, and which textbook conventions it follows.
//
// `books` anchors terminology, step numbering and framing to the standard texts
// for that level — it does NOT ask for their text. The model writes original
// prose in the house style of those books; verbatim reproduction is forbidden
// by ACCURACY below.
const LEVEL = {
  undergrad: {
    audience:
      "a second/third-year BSc biochemistry or medical student meeting this pathway for the first time",
    depth:
      "Build understanding from the ground up. Assume general chemistry but NOT prior knowledge of this pathway. Expand every abbreviation on first use and name every enzyme in full. Prioritise the main chain of the pathway over side branches. State ATP/NADH bookkeeping explicitly and count it out. Skip kinetic constants, structural detail and isozyme minutiae entirely — they are noise at this level.",
    books:
      "Harper's Illustrated Biochemistry, Lippincott's Illustrated Reviews: Biochemistry, and Marks' Basic Medical Biochemistry",
    tokens: { metabolite: 600, reaction: 850, pathway: 1400 },
  },
  masters: {
    audience:
      "an MSc student who already knows the pathway's outline and now needs the mechanism and the regulatory logic",
    depth:
      "Assume the map is known; explain the machinery. Give catalytic mechanisms in chemical terms (which bond breaks, which group attacks, what the cofactor actually does). Cover allosteric and covalent regulation, hormonal control, and the thermodynamic reason each step is reversible or irreversible. Include ΔG°' values where they are standard and well established. Name isozymes and their tissue distribution where it changes the physiology.",
    books:
      "Lehninger Principles of Biochemistry, Berg/Tymoczko/Stryer Biochemistry, and Voet & Voet Biochemistry",
    tokens: { metabolite: 950, reaction: 1300, pathway: 2000 },
  },
  phd: {
    audience:
      "a doctoral researcher who knows the biochemistry and wants mechanistic, quantitative and structural depth",
    depth:
      "Write at research-seminar level. Give catalytic mechanism in terms of transition states, catalytic residues and structural fold where these are established. Include kinetics (Km, kcat, Ki ranges and the organism/isoform they were measured in) and thermodynamics (ΔG°' vs in-vivo ΔG) with the caveat that values are condition-dependent. Address flux control (which steps actually carry control, not just which are 'rate-limiting' by tradition), compartmentation and metabolite channelling. Where the literature is genuinely contested or unresolved, say so explicitly rather than presenting one view as settled.",
    books:
      "Voet & Voet Biochemistry, Fersht's Structure and Mechanism in Protein Science, and the primary literature",
    tokens: { metabolite: 1400, reaction: 1900, pathway: 2700 },
  },
};

// The teaching style: build the picture up piece by piece rather than listing
// facts, and keep returning to why it matters. Deliberately described rather
// than named after any one lecturer, so the model has something concrete to act on.
const PEDAGOGY =
  "Teach the way a good lecturer does at a whiteboard: build the picture up one piece at a time, and after each step say what just changed and why that mattered. Track the carbons — when a molecule gains or loses carbons, phosphates or electrons, say where they went. Return to the big picture at the end of each section so the detail stays anchored to it. Always answer WHY, never only WHAT: why this step is regulated here rather than elsewhere, why it is irreversible, why the cell spends ATP at this point to get more back later.";

const ACCURACY =
  "Be rigorously accurate. Never invent facts, numbers, gene names or citations — if you are unsure of a value, describe it qualitatively instead of guessing a number. Write entirely in your own words: do not reproduce sentences, figure captions or passages from any textbook.";

// The context may carry a block retrieved live from UniProt/PubChem/Reactome.
// Facts beat recall, so say so explicitly — otherwise the model averages the
// retrieved value against whatever it half-remembers.
const GROUNDING =
  "A block labelled SOURCED FACTS is retrieved live from UniProt, PubChem or Reactome and is authoritative. Build your explanation around it, prefer it over your own recall, and never state anything that contradicts it. If it conflicts with what you remember, follow the sourced facts. Do not mention the retrieval or cite the databases in your prose — just be correct.";

const FORMAT =
  "Write in connected teaching prose under bold section headers (**Header** on their own line). Use '- ' bullets only for genuine lists. No preamble, no closing remarks, no meta-commentary about being an AI.";

// Section skeletons, per kind, per level. This is where the levels actually
// diverge — an undergraduate entry and a doctoral one answer different questions,
// not the same questions at different lengths.
const SECTIONS = {
  metabolite: {
    undergrad: [
      ["What it is", "class of molecule, its structure described in words, number of carbons, and its charge at physiological pH"],
      ["Role in the pathway", "where it comes from, what it becomes, and why that transformation matters"],
      ["Key facts", "2-4 '- ' bullets worth memorising, including any clinical relevance and the mechanism of that link"],
    ],
    masters: [
      ["Structure & chemistry", "class, functional groups, ionisation state, stereochemistry, and the reactivity that makes it useful here"],
      ["Role in the pathway", "its position in the flux, what consumes and produces it, and why the cell routes carbon through this intermediate"],
      ["Regulatory significance", "whether it acts as an allosteric effector or signal anywhere, and on what"],
      ["Clinical relevance", "diseases or drugs where this metabolite accumulates, is depleted, or is measured — with the mechanism"],
      ["Key facts", "3-4 '- ' bullets worth memorising"],
    ],
    phd: [
      ["Structure & chemistry", "full stereochemistry, tautomers/anomers where relevant, pKa values of ionisable groups, and the chemical basis of its reactivity"],
      ["Metabolic roles", "every pathway that produces or consumes it, and the relative flux through each"],
      ["Concentration & compartmentation", "typical intracellular concentrations by compartment and tissue where known, and how they compare to enzyme Km values"],
      ["Regulatory significance", "allosteric targets, signalling roles, and any moonlighting functions"],
      ["Clinical & research relevance", "disease associations, use as a biomarker, and drug targets — with mechanism"],
      ["Open questions", "anything genuinely unresolved about it (omit this header if nothing qualifies)"],
    ],
  },
  reaction: {
    undergrad: [
      ["What happens", "the transformation in plain terms, expanding all abbreviations"],
      ["The enzyme", "its name, what class of reaction it catalyses, and what that means"],
      ["Cofactors & energy", "cofactors used, ATP/NADH changes, and whether the step is reversible or irreversible"],
      ["Why it matters", "its significance in the pathway and how it connects to the steps on either side"],
      ["Clinical link", "any disease or drug that hits this step, and how"],
      ["Exam pointer", "the one thing most likely to be asked about this step"],
    ],
    masters: [
      ["What happens", "the chemistry of the transformation — which bonds break and form"],
      ["Enzyme & mechanism", "enzyme class, catalytic strategy, the role of each cofactor, and the sequence of chemical events"],
      ["Energetics", "ΔG°' if well established, the in-vivo driving force, and why the step is reversible or not"],
      ["Regulation", "allosteric effectors, covalent modification, hormonal and transcriptional control"],
      ["Integration", "how this step is coordinated with the rest of metabolism"],
      ["Clinical relevance", "diseases, deficiencies and drugs, with the mechanism of each link"],
    ],
    phd: [
      ["Chemistry", "the transformation at the level of electron movement and transition state"],
      ["Catalytic mechanism", "catalytic residues, the chemical steps in order, and the evidence that established the mechanism"],
      ["Structural basis", "fold family, active-site architecture, conformational changes on catalysis, and quaternary structure where it matters"],
      ["Kinetics & thermodynamics", "Km, kcat, Ki with the isoform and organism they were measured in; ΔG°' vs in-vivo ΔG; note that values are condition-dependent"],
      ["Flux control", "whether this step genuinely carries flux control, and on what evidence"],
      ["Regulation", "allosteric, covalent, transcriptional, and by substrate availability"],
      ["Pathophysiology & drug targeting", "disease variants, their molecular consequence, and inhibitors of therapeutic interest"],
      ["Contested points", "where the literature disagrees (omit this header if nothing qualifies)"],
    ],
  },
  pathway: {
    undergrad: [
      ["Overview", "what the pathway does and its big-picture purpose"],
      ["Location", "where in the cell and which tissues"],
      ["Net reaction & energy", "inputs, outputs, and the ATP/NADH/FADH2/GTP balance, counted out explicitly"],
      ["The key steps", "the committed, rate-limiting and irreversible steps and why they matter (bullets)"],
      ["Regulation", "the main activators, inhibitors and hormonal controls (bullets)"],
      ["Connections", "how it links to the other pathways you have met"],
      ["Clinical relevance", "the diseases and deficiencies that are actually taught"],
      ["Exam tips", "3-4 commonly tested facts (bullets)"],
    ],
    masters: [
      ["Overview", "what the pathway achieves and its place in metabolism"],
      ["Organisation & compartmentation", "where each step happens and which transporters move intermediates between compartments"],
      ["Net reaction & thermodynamics", "the balance sheet, plus which steps are far from equilibrium and why"],
      ["Enzymology of the key steps", "the mechanism and cofactor chemistry of the committed and regulated steps"],
      ["Regulation", "allosteric, covalent, hormonal and transcriptional control, and how they are layered (bullets)"],
      ["Integration", "reciprocal regulation with opposing pathways and how flux is partitioned at branch points"],
      ["Pathophysiology & drug targets", "inherited disorders, their molecular lesion, and drugs acting on the pathway"],
      ["Exam tips", "3-4 things most often tested (bullets)"],
    ],
    phd: [
      ["Overview", "what the pathway achieves, and how our understanding of it was established"],
      ["Organisation & flux control", "which steps carry control by metabolic control analysis rather than by textbook tradition, and the evidence"],
      ["Enzymology", "mechanism, structure and kinetics of the enzymes that matter, with isoform differences"],
      ["Thermodynamics & kinetics", "mass-action ratios vs equilibrium constants, in-vivo ΔG, and how substrate concentrations sit relative to Km"],
      ["Regulation", "the full regulatory hierarchy — allosteric, covalent, transcriptional, and by compartmentation and channelling"],
      ["Integration", "crosstalk with other pathways, tissue-specific wiring, and whole-body flux"],
      ["Pathophysiology & therapeutics", "disease mechanisms at molecular resolution and the state of drug development"],
      ["Open questions", "what remains genuinely unresolved in the field"],
    ],
  },
};

function pick(level) {
  return LEVEL[level] ?? LEVEL[DEFAULT_LEVEL];
}

function sectionBlock(kind, level) {
  const list = SECTIONS[kind][level] ?? SECTIONS[kind][DEFAULT_LEVEL];
  return list.map(([header, detail]) => `**${header}** — ${detail}.`).join("\n");
}

function systemPrompt(level, { json = false } = {}) {
  const L = pick(level);
  return [
    `You are writing biochemistry study notes for ${L.audience}.`,
    `Follow the conventions, terminology and step numbering of ${L.books}.`,
    L.depth,
    PEDAGOGY,
    ACCURACY,
    GROUNDING,
    json ? "Respond ONLY with JSON." : FORMAT,
  ].join(" ");
}

/**
 * Build the provider-agnostic request for one explanation.
 * `kind` is "metabolite" | "reaction" | "pathway"; `level` is one of LEVELS.
 */
export function buildRequest(kind, name, context, level = DEFAULT_LEVEL) {
  const lvl = LEVELS.includes(level) ? level : DEFAULT_LEVEL;
  const L = pick(lvl);
  // Wide enough to carry a real retrieved fact sheet, not just a hint. The old
  // 600-char cap truncated UniProt function text mid-sentence.
  const ctx = String(context ?? "").slice(0, 2600);
  const maxTokens = L.tokens[kind] ?? L.tokens.reaction;

  if (kind === "metabolite") {
    return {
      json: true,
      maxTokens,
      messages: [
        { role: "system", content: systemPrompt(lvl, { json: true }) },
        {
          role: "user",
          content:
            `Metabolite from a metabolic pathway: "${name}".` +
            (ctx ? ` Context: ${ctx}.` : "") +
            ` Return JSON {"fullName": string, "explanation": string}.\n` +
            `"fullName" = the unambiguous full chemical name for a database lookup (e.g. "L-Orn" -> "L-ornithine").\n` +
            `"explanation" = markdown using these bold section headers, each on its own line, in this order:\n` +
            sectionBlock("metabolite", lvl),
        },
      ],
    };
  }

  if (kind === "pathway") {
    return {
      json: false,
      maxTokens,
      messages: [
        { role: "system", content: systemPrompt(lvl) },
        {
          role: "user",
          content:
            `Write a study guide for the "${name}" pathway. Use these bold section headers, each on its own line, in this order:\n` +
            sectionBlock("pathway", lvl) +
            `\n\nConnect the steps into a single story rather than listing them.` +
            (ctx ? ` Context: ${ctx}` : ""),
        },
      ],
    };
  }

  return {
    json: false,
    maxTokens,
    messages: [
      { role: "system", content: systemPrompt(lvl) },
      {
        role: "user",
        content:
          `Write a study entry for this reaction. Use these bold section headers, each on its own line, in this order:\n` +
          sectionBlock("reaction", lvl) +
          `\n\nEnzyme/reaction: ${name}` +
          (ctx ? `\nDetails: ${ctx}` : ""),
      },
    ],
  };
}
