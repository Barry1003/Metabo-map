# Figma Make Prompt — MetaboMap UI

Design the interface for **MetaboMap**, a web app that turns metabolic biochemistry pathways into interactive, explorable diagrams for students, lecturers, and researchers. Desktop-first, tablet-responsive.

---

## Critical constraint — read this first

**Do not build a graph/network rendering engine.** The pathway diagram is rendered at runtime by Cytoscape.js in the real application. Your job is the interface *around* the canvas: the shell, panels, controls, and states.

For the canvas region, produce a **static illustrative mock** — hand-placed circles, rounded squares, and connector lines that show what a laid-out pathway looks like at rest. It only needs to communicate scale, density, spacing, and color semantics. It will be replaced with a live canvas element.

---

## What the product does

A user picks a pathway (Glycolysis, the Citric Acid Cycle, Gluconeogenesis, the Urea Cycle). The app draws it as a directed diagram. Clicking any molecule or enzyme opens an inspector panel with its chemical structure, a plain-language explanation, and links to primary literature. A running counter tracks ATP, NADH, and FADH₂ as the user moves through the pathway. A quiz mode hides the enzyme names and asks the user to place them.

The audience is people studying under time pressure. The interface should feel like a precise scientific instrument, not a consumer app. Calm, dense, legible when projected onto a lecture screen.

---

## Visual direction

The palette is drawn from laboratory reagents and biochemical stains rather than generic UI colors. Every hue carries meaning; nothing is decorative.

### Color tokens

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#090D12` | Canvas base. Deep, blue-shifted near-black |
| `--surface` | `#131A22` | Panels, toolbars, cards |
| `--surface-raised` | `#1A232D` | Hover states, active rows, modals |
| `--rule` | `#1E2732` | Hairline borders, 1px only |
| `--text` | `#E8EEF4` | Primary text |
| `--text-dim` | `#7D8B9C` | Labels, captions, secondary |
| `--metabolite` | `#48C9D9` | Molecule nodes. Bromothymol teal |
| `--enzyme` | `#F2A93B` | Enzyme and reaction nodes. Amber |
| `--cofactor` | `#5C6B85` | ATP/NADH/water satellites. Deliberately recessive |
| `--energy` | `#FFD166` | Energy ledger only. Gold |
| `--alert` | `#E2564B` | Knockouts, disease overlays, errors |

Compartment bands use the base hues at 4–6% opacity as large background fills, with a 1px `--rule` border and a small label.

### Typography

- **UI and body:** IBM Plex Sans — 400, 500, 600
- **Data and identifiers:** IBM Plex Mono — Reactome IDs, PMIDs, SMILES strings, ΔG values, ledger counters, node counts
- **Section eyebrows:** IBM Plex Sans Condensed, uppercase, 11px, letter-spacing 0.08em, `--text-dim`

The mono face is doing real work here. Anything a scientist would copy, cite, or type into another tool is set in mono. That distinction should be visible at a glance.

### Shape and surface

- Border radius: 4px on panels and buttons, 2px on chips and badges. Nothing pill-shaped.
- Borders over shadows. Use 1px `--rule` hairlines to separate regions; avoid drop shadows except on the modal overlay.
- Generous line-height (1.6) in the inspector prose, tight (1.2) in data readouts.

### The signature element

The **energy ledger** is what this app is remembered by. It is a persistent horizontal instrument strip that sits at the bottom edge of the canvas, spanning its width. Three counters — ATP, NADH, FADH₂ — set large in IBM Plex Mono, each with a condensed uppercase label and a thin horizontal bar showing net production versus consumption. Give this element more care than anything else on the screen. It should read like a readout on a piece of lab equipment.

---

## Screens and components to design

### 1. Main application shell

Full-viewport, three regions:

- **Top bar** (56px): wordmark left; pathway search input centered, roughly 480px wide with a magnifier glyph and placeholder "Search a pathway"; on the right, three icon toggles — cofactors, compartments, quiz mode — plus a help icon.
- **Canvas** (fills remaining space): `--ink` background with a very faint 24px dot grid at about 3% opacity. Contains the static pathway mock. Floating zoom controls bottom-right (zoom in, zoom out, fit to view, reset), each 32px square. Legend bottom-left in a small `--surface` card: four rows keyed by color to metabolite, enzyme, cofactor, and compartment.
- **Inspector panel** (right, 380px, collapsible): detailed below.

The energy ledger strip sits along the bottom of the canvas region, above the canvas edge, 64px tall.

### 2. Pathway mock (static)

Show roughly 16–20 nodes so density reads honestly:

- Metabolites as 12px circles in `--metabolite` with the label set beneath in 12px IBM Plex Sans.
- Enzymes as small rounded rectangles in `--enzyme`, label inside, 11px.
- Cofactors as 6px circles in `--cofactor`, unlabeled or with tiny mono labels, clustered close to their parent reaction.
- Edges as 1.5px lines with small arrowheads. A few curve; most run top to bottom.
- Two compartment bands running horizontally behind the nodes, labeled `CYTOSOL` and `MITOCHONDRIAL MATRIX` in condensed uppercase, sitting in the top-left corner of each band.
- One node shown in a selected state: 2px ring in `--text`, slightly brighter fill.

### 3. Inspector panel

Stacked sections, each separated by a hairline:

1. **Header** — entity name at 20px/600. Below it, two small badges: type (Metabolite / Enzyme) and compartment. A close button top-right.
2. **Structure** — a square region, roughly 340px, `--ink` background with a hairline border, containing a simple line-drawing of a molecular structure. Below it, the molecular formula and PubChem CID in mono, `--text-dim`.
3. **Summary** — three or four short paragraphs and a bulleted list. This is the only place with real prose; give it comfortable measure and 1.6 line-height.
4. **Energy contribution** — a compact row: `+2 ATP`, `−1 ATP`, `+1 NADH`, set in mono with `--energy` used for positive values.
5. **Literature** — three rows, each with a PMID in mono, a paper title truncated to two lines, and a journal-year line in `--text-dim`.

Design a second variant where the structure section is absent (large protein complexes have no drawable structure) and the summary expands to fill the space. Do not leave an empty box.

### 4. Search disambiguation modal

Triggered when a query is ambiguous. Centered, 480px wide, `--surface-raised`, over a 60%-opacity `--ink` scrim. Heading: "Which pathway did you mean?" Below it, three selectable rows, each showing a pathway name, a one-line description, and a Reactome ID in mono. A "None of these" text link at the bottom.

### 5. Quiz mode

Same canvas, altered: every enzyme node's label is replaced by a dashed-outline empty slot in `--enzyme` at 40% opacity. A panel replaces the inspector on the right, listing 8 draggable enzyme name chips. Design three chip states — resting, dragging, and placed-correct. Placed-correct nodes get a filled `--enzyme` background. A score chip sits top-right of the canvas: `4 / 8` in mono. Wrong placements flash `--alert` then return.

### 6. Empty, loading, and error states

- **Empty** (first visit): centered in the canvas, a short heading, one line of guidance, and six suggested pathway chips the user can click. The screen should invite a click, not explain the product.
- **Loading**: skeleton nodes fading in staggered, plus a mono line reading `Loading R-HSA-70171 · 84 nodes`.
- **Error**: a compact card. State what failed and what to do next, in the interface's own voice. No apology, no vague wording.

### 7. Tablet layout (1024px)

The inspector becomes a bottom sheet occupying 55% of viewport height, draggable to full height. The top bar collapses its toggles into a single overflow button. The energy ledger sits above the sheet and stays visible.

---

## Interaction notes

Keep motion minimal and functional. Panel entry uses a spring, roughly 240ms, sliding from the right edge. Node hover raises brightness by about 15% and adds a 1px ring — no glow, no scale change. Ledger counters roll their digits when values change. Nothing else animates. Reduced-motion preference disables all of it.

---

## What to avoid

- No gradients, no glassmorphism, no neon glow effects.
- No pill-shaped buttons or heavily rounded cards.
- No emoji or illustrative icons in the data regions. Icons only in the toolbar, and stroke-only at 1.5px.
- No purple. No default Tailwind blue or emerald.
- Do not center-align body text or use decorative dividers between every element.

---

## Deliverables

Deliver, in this order:

1. Main shell with a metabolite selected and the inspector open
2. Inspector panel variant with no chemical structure
3. Search disambiguation modal
4. Quiz mode
5. Empty state
6. Tablet layout of the main shell