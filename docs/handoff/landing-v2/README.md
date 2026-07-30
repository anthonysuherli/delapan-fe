# Handoff: delapan.ai Landing Page Redesign (v2)

## Overview
A redesign of the delapan.ai marketing landing page. delapan is an open-source
knowledge-base **grounding engine**: it grounds a domain once, keeps every fact
with the source it came from, fills gaps from the web on demand, and returns
answers with citations and a coverage verdict (ground -> grow -> answer).

The old page failed on three counts: it never said what the product was, it had
no call to action, and it read as vague. This redesign fixes all three:

- **One claim, once.** The hero states "design an agent memory you can audit" and
  nothing competes with it.
- **A single CTA, repeated exactly twice** (hero + closing section), plus one in the
  sticky nav: **read the docs**. Secondary affordance is the install line
  \`npx delapan init\` as plain text, never as a second button.
- **Proof above the fold.** An interactive force-directed graph of a real KB sits
  directly under the hero; selecting a node reveals its \`grounded_in\` findings with
  category, confidence, and source domain. Auditability is demonstrated, not claimed.

Primary audience: developers building agents who need auditable memory. Secondary:
investors and partners. Primary conversion action: **read the docs / self-host**.

## About the Design Files
The files in this bundle are **design references created in HTML** — prototypes that
show the intended look, copy, and behavior. They are **not production code to copy
directly**.

The task is to **recreate these designs in the target codebase's existing
environment** (React, Next.js, Astro, Vue — whatever the marketing site already uses),
following its established patterns, component library, and build conventions. If no
environment exists yet, pick the framework most appropriate for a
mostly-static marketing page with one interactive island (the graph), and implement
there.

Two specific notes on translation:
1. The prototypes are built on a **component-streaming runtime** with a custom
   templating layer (\`<x-import>\`, \`<sc-for>\`, \`<sc-if>\`, \`{{ }}\` holes). None of
   that should survive into production — read it as "loop", "conditional", and
   "interpolate value". Structure and styling are what matter.
2. All styling in the prototypes is **inline** for streaming reasons. In production,
   use whatever the codebase uses (CSS modules, Tailwind, styled-components) — but
   keep the values identical, and prefer the design-system CSS custom properties
   (see Design Tokens) over hardcoded hex.

## Fidelity
**High-fidelity (hifi).** \`Landing Page v2.dc.html\` is the canonical design: final
colors, typography, spacing, copy, interaction, and motion. Recreate it
pixel-accurately using the codebase's existing libraries.

Two additional files ship as context, not as targets:
- \`Landing Wireframes.dc.html\` — **lofi**. Five explored page structures (1a-1e).
  1b was chosen. Included so you can see what was rejected and why.
- \`Landing Page.dc.html\` — **hifi, superseded**. The denser first pass at 1b.
  Retained because a few sections there (three-column "how it works" with phase log,
  three-column use-case rows) may be wanted back later. **Do not build this one.**

---

## The delapan Design System
The page is built entirely on delapan's own design system. Nothing visual here is
invented — every color, type size, and component is drawn from it.

**Look:** a "daylight instrument panel." Cool-paper surfaces, 1px hairline rules,
a single amber annunciator accent used sparingly. No gradients, no photography, no
illustration, no emoji.

**Type:** three families.
- **Big Shoulders Display** (700) — condensed industrial display. Wordmark, headlines,
  step titles, verdict bands. Always UPPERCASE with 0.01-0.2em tracking.
- **IBM Plex Mono** (400/500) — every label, count, keycap, and data value. Uppercase
  mono labels with wide tracking are the system's signature.
- **IBM Plex Sans** (400/500) — reading copy.

All three load from Google Fonts; no font binaries ship. If self-hosting is required
in your environment, flag it.

**Voice:** the machine reports facts about itself. Terse, technical, **lowercase**
for UI labels and buttons; UPPERCASE for section labels. Impersonal — neither "I" nor
"you" where avoidable. No exclamation points, no marketing enthusiasm, no emoji.
Domain nouns are exact and must not be paraphrased: *finding*, *node*, *edge*,
*grounded_in*, *provenance*, *coverage* (rich / sparse / gap), *preamble*, *explore*,
*schema drift*, *synopsis*.

**Components used from the system** (namespace \`window.DelapanDesignSystem_a684d2\`):
\`Logomark\`, \`Button\`, \`TypeChip\`, \`ConfidenceBar\`, \`VerdictBand\`.
In production, use the equivalents from your own component library rather than porting
these — but match their rendered appearance exactly (specced below).

---

## Screens / Views

There is **one screen**: a single-column, centered, scrolling marketing page.

### Global frame
- **Page background:** \`--bg0\` \`#f5f7fa\`
- **Body text:** \`--font-body\` (IBM Plex Sans), 13px base, color \`--text\` \`#1f2b3a\`
- **Antialiasing:** \`-webkit-font-smoothing: antialiased\`, \`text-rendering: optimizeLegibility\`
- **Content width:** \`max-width: 1180px\`, centered, \`padding: 0 32px\`
  - FAQ section narrows to \`max-width: 780px\`
  - Verdict-band demo narrows to \`max-width: 620px\`
- **Vertical rhythm:** every major section opens with \`padding-top: 132px\`. This is the
  single most important spacing value on the page — the generosity is the design.
- **Smooth scrolling:** \`html { scroll-behavior: smooth }\` (nav links are hash anchors)
- **Paragraphs:** \`text-wrap: pretty\`
- **Selection:** \`::selection { background: rgba(180,83,9,.14) }\`
- **Links:** \`color: var(--text-dim)\`, no underline, \`transition: color 240ms cubic-bezier(.2,.9,.3,1)\`;
  on hover \`color: var(--text)\`. Define these defaults globally — the amber accent is
  *not* used for body links.

> **Note on v1 vs v2:** v1 (\`Landing Page.dc.html\`) carried a 3.5%-opacity fractal-noise
> film grain overlay and a blueprint grid + viewfinder brackets on the graph canvas, both
> canonical delapan app treatments. v2 deliberately removes them for the marketing
> context — the page defers to the graph instead of framing it as app chrome. If you want
> the grain back, it is \`<svg>\` + \`feTurbulence baseFrequency="0.8" numOctaves="3"\`,
> \`position: fixed\`, \`opacity: .035\`, \`pointer-events: none\`, \`z-index: 60\`.

---

### 1. Sticky header
**Purpose:** persistent access to the one CTA; light orientation.

**Layout:** \`position: sticky; top: 0; z-index: 40\`. Height **60px**. Inner row is
\`max-width: 1180px\`, \`padding: 0 32px\`, \`display: flex\`,
\`justify-content: space-between\`, \`align-items: center\`, \`gap: 32px\`.

**Surface:** \`background: rgba(245,247,250,.82)\` with
\`backdrop-filter: blur(14px) saturate(140%)\`; bottom border
\`1px solid rgba(211,219,230,.7)\`. The saturation boost keeps the amber logo core from
going muddy behind the blur — keep it.

**Left — logo lockup:** \`display: flex; align-items: center; gap: 11px\`, wrapped in an
\`<a href="#top">\`.
- \`Logomark\`, **\`variant="dark"\`**, \`size={26}\`. The brilliant-cut faceted "8" — a rigid
  figure-eight cut as a gem, table plus four bevels per lobe, lit from upper-left, with
  the **amber table core as the only brand color**. The dark variant renders slate facets
  against the amber core, which is what reads as "orange/black" on the paper background.
  **Do not recolor the amber table, redraw the facets, or stretch the mark.** Source SVGs
  live at \`assets/logo-{light,dark,mono}.svg\` in the design system.
- Wordmark: text \`delapan\` (lowercase), Big Shoulders Display 700, **19px**,
  \`letter-spacing: .05em\`, \`color: var(--text)\`.

**Right — nav:** \`display: flex; align-items: center; gap: 26px\`.
- \`how it works\` -> \`#how\`, \`faq\` -> \`#faq\`. Both IBM Plex Mono **11px**,
  \`letter-spacing: .05em\`, lowercase, \`color: var(--text-dim)\` -> \`var(--text)\` on hover.
- CTA: \`Button variant="active"\`, label \`read the docs\`. Overrides:
  \`font-family: var(--font-mono)\`, \`font-size: 11px\`, \`padding: 7px 14px\`,
  \`border-radius: var(--radius-pill)\`.

**Behavior:** no scroll-state change, no shadow-on-scroll, no shrink. It is simply always
there.

---

### 2. Hero
**Purpose:** state what the product is in one line and offer one action.

**Layout:** \`padding: 132px 32px 0\`. \`display: flex; flex-direction: column;\`
\`align-items: center; text-align: center\`. Anchor id \`top\`.

**Elements, in order:**

1. **Eyebrow** — \`grounding engine\`. IBM Plex Mono, **10px**,
   \`letter-spacing: .24em\`, \`text-transform: uppercase\`, \`color: var(--text-faint)\`.
2. **Headline** — \`design an agent memory you can audit\`.
   Big Shoulders Display 700, \`font-size: clamp(60px, 7.8vw, 108px)\`,
   \`line-height: .86\`, \`letter-spacing: .008em\`, \`text-transform: uppercase\`,
   \`color: var(--text)\`, \`max-width: 17ch\`, \`margin: 26px 0 0\`.
   The \`17ch\` measure is doing real work — it forces a three-line break with a short
   last line. Preserve it.
   *Copy history: this replaced the shorter "agent memory you can audit" (which used
   \`clamp(64px, 8.4vw, 116px)\` / \`max-width: 15ch\`). Both are viable; the shorter line
   is the safer fallback if the longer one crowds at some viewport.*
3. **Subhead** — \`delapan grounds a domain once and keeps every fact with the source it
   came from. when something is missing it goes and gets it. every answer arrives cited.\`
   IBM Plex Sans **17px**, \`line-height: 1.72\`, \`color: var(--text-dim)\`,
   \`max-width: 53ch\`, \`margin: 32px 0 0\`.
4. **CTA row** — \`margin: 40px 0 0\`, \`display: flex; align-items: center; gap: 18px;\`
   \`flex-wrap: wrap; justify-content: center\`.
   - \`Button variant="active"\`, label \`read the docs\`. Overrides: \`font-size: 13px\`,
     \`padding: 13px 26px\`, \`border-radius: var(--radius-pill)\`, \`letter-spacing: .03em\`.
   - Install line as **plain text, not a button**: \`or \` in
     \`color: var(--text-faint)\` followed by \`npx delapan init\` in
     \`color: var(--text-dim)\` (non-italic \`<i>\` is used purely as a hook — use a
     \`<span>\`). IBM Plex Mono **12px**.
     This asymmetry is intentional: two equal buttons was the v1 mistake.

---

### 3. Graph canvas (the hero proof)
**Purpose:** demonstrate auditability. This is the most important interactive element on
the page and the main implementation effort.

**Container:** \`padding: 64px 32px 0\` (note: 64px, not 132px — the graph belongs to the
hero). \`border: 1px solid var(--line)\`, \`border-radius: var(--radius-lg)\` (6px),
\`overflow: hidden\`, \`background: var(--bg0)\`,
\`box-shadow: 0 1px 2px rgba(31,43,58,.04)\`.

**Canvas region:** \`position: relative\`, \`height: 520px\`, \`overflow: hidden\`.
Background is a soft vignette only:
\`radial-gradient(ellipse 70% 60% at 50% 46%, #ffffff, rgba(255,255,255,0) 72%), var(--bg0)\`.

**Coordinate system.** Node positions are authored in an abstract space; the visible
window is \`x: 100-970\`, \`y: 80-670\` (\`VX=100, VY=80, VW=870, VH=590\`).
- Edges render in an \`<svg viewBox="100 80 870 590" preserveAspectRatio="none">\`
  absolutely filling the container, \`pointer-events: none\`, with
  \`vector-effect: non-scaling-stroke\` on every line so hairlines stay 1px under the
  non-uniform stretch.
- Nodes are **DOM elements**, not SVG, positioned by percentage:
  \`left: (x - 100) / 870 * 100%\`, \`top: (y - 80) / 590 * 100%\`,
  \`transform: translate(-50%, -50%)\`.
  This mirrors how the real control panel composes sigma.js output with DOM overlays.

**Nodes.** Each is a \`<div>\` wrapper containing a circular \`<span>\` plus an optional
label.
- **Diameter:** \`2 * (5.5 + min(degree, 8) * 1.25)\` px — i.e. **11px** for a leaf,
  up to **31px** for the most-connected node. Size encodes degree; this is canonical
  delapan.
- **Fill:** entity-type hue, fixed:
  concept \`#0284c7\`, technology \`#d97706\`, person \`#db2777\`,
  company \`#059669\`, project \`#7c3aed\`.
- **Border:** none in v2 (v1 had a 1.5px white ring — dropped for cleanliness).
- **Shadow:** unselected \`0 1px 3px rgba(31,43,58,.14)\`;
  selected \`0 0 0 5px rgba(180,83,9,.16), 0 1px 3px rgba(31,43,58,.2)\` — an amber halo,
  not a border change.
- **Cursor:** \`grab\`. \`touch-action: none\` (required for pointer-drag on touch).
- **z-index:** 14 selected, 10 otherwise.

**Neighborhood dimming.** With a node selected, that node and its direct neighbors are
\`opacity: 1\`; everything else drops to **\`opacity: 0.16\`**. Edges: lit
\`stroke: #c4cedb\`, dimmed \`stroke: #e9edf3\`, both \`stroke-width: 1\`. This single
mechanic is what makes a 22-node graph legible; do not soften it.

**Labels.** IBM Plex Mono **10px**, \`letter-spacing: .02em\`, absolutely positioned
\`left: 50%\`, \`top: diameter + 6px\`, \`transform: translateX(-50%)\`,
\`white-space: nowrap\`. Selected: \`color: var(--text)\`, \`font-weight: 500\`.
Otherwise \`color: var(--text-faint)\`, \`font-weight: 400\`.
Visibility follows the \`nodeLabels\` setting (see Configuration): \`lit\` shows labels for
the selected node and its neighbors plus whatever is hovered; \`all\` shows every label;
\`none\` shows only selected + hovered.
*v1 gave labels a \`rgba(245,247,250,.72)\` chip background for legibility over the
blueprint grid; v2 drops it since the background is plain.*

**Motion.** \`left\` and \`top\` transition at **420ms \`cubic-bezier(.2,.9,.3,1)\`**;
\`opacity\` at **320ms ease**. While a node is being dragged its transition is set to
\`none\` so it tracks the pointer exactly. No bounce, no spring.

**Caption row** (below the canvas, inside the bordered container, outside the
overflow-hidden region): \`padding: 14px 0 16px\`, centered, IBM Plex Mono **10px**,
\`letter-spacing: .16em\`, uppercase, \`color: var(--text-faint)\`. Text:
\`22 nodes · 31 edges · drag any node\` (falls back to \`… · select a node\` when nothing
is selected). It lives outside the canvas specifically so it cannot collide with
bottom-edge node labels — a bug in the first pass.

---

### 4. Evidence panel (\`grounded_in\`)
**Purpose:** close the audit loop — show that a node is nothing but a pointer to sourced
findings.

Sits directly beneath the caption inside the same bordered container.
\`border-top: 1px solid var(--line)\`, \`background: var(--bg1)\` \`#eef1f6\`,
\`padding: 26px 30px 28px\`. Toggleable via the \`showEvidence\` setting.

**Header row:** \`display: flex; align-items: center; gap: 12px; flex-wrap: wrap;\`
\`margin-bottom: 20px\`.
- \`TypeChip type={node.type}\` — colored dot + type name.
- Node label: IBM Plex Sans **15px**, \`font-weight: 500\`, \`color: var(--text)\`,
  \`flex: none; white-space: nowrap\`.
- Right-aligned (\`margin-left: auto\`, \`flex: none\`, \`white-space: nowrap\`):
  \`grounded in N findings\`, IBM Plex Mono **10px**, \`letter-spacing: .16em\`, uppercase,
  \`color: var(--text-faint)\`.
  The \`flex: none\` + \`nowrap\` on both are load-bearing — without them, long node names
  like "Agentic exploration" wrap mid-phrase.

**Findings grid:** \`display: grid;\`
\`grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 26px\`.
Each finding is a \`flex-direction: column; gap: 9px\` cell:
- **Title** — IBM Plex Sans **14.5px**, \`line-height: 1.55\`, \`color: var(--text)\`.
- **Meta row** — \`display: flex; align-items: center; gap: 12px\`, IBM Plex Mono
  **10px**, \`color: var(--text-faint)\`:
  - category, \`letter-spacing: .12em\`, uppercase
  - \`ConfidenceBar value={0-1} width={54}\`
  - source domain as a link, \`color: var(--cyan)\` \`#0e7490\`, suffixed \` ↗\`.
    Cyan is the system's provenance/info hue — keep provenance links cyan, never amber.

*v1 additionally rendered relation pills (\`Relation\` component) and pill-shaped
provenance chips here. v2 reduces to prose + bar + link. The \`Relation\` component is
still the right choice if relations come back.*

---

### 5. "Three moves, in order" (how it works) — \`#how\`
**Purpose:** explain the mechanism.

\`padding: 132px 32px 0\`.

**Section headline:** \`three moves, in order\`, centered, \`max-width: 24ch\`,
\`margin: 0 auto\`. Big Shoulders Display 700, **44px**, \`line-height: 1.02\`,
\`letter-spacing: .01em\`, uppercase, \`color: var(--text)\`.

**Three columns:** \`display: grid;\`
\`grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 64px;\`
\`margin-top: 76px\`. No dividers, no cards, no borders — whitespace separates them.
Each column is \`flex-direction: column; gap: 14px\`:
- **Index** — \`01\` / \`02\` / \`03\`, IBM Plex Mono **10px**, \`letter-spacing: .2em\`,
  \`color: var(--text-faint)\`.
- **Title** — \`ground\` / \`grow\` / \`answer\`. Big Shoulders Display 700, **26px**,
  \`letter-spacing: .1em\`, uppercase, \`color: var(--text)\`.
- **Body** — IBM Plex Sans **14.5px**, \`line-height: 1.78\`, \`color: var(--text-dim)\`.

Exact copy:
- **ground** — "everything ingested becomes a finding — titled, scored, and stamped with
  the url it came from. nodes and edges hold no prose of their own; they cite findings."
- **grow** — "a query that lands short is a signal, not a failure. the engine plans,
  searches, crawls, extracts, and merges — and the knowledge base is larger than it was."
- **answer** — "a read assembles a preamble: only the findings that matter here, ordered
  by similarity and confidence, graded rich, sparse, or gap. that is what your agent
  consumes."

**Verdict band demo:** \`max-width: 620px\`, \`margin: 76px auto 0\`.
\`VerdictBand coverage="rich" note="kb can answer"\`, children being preformatted text:

```
preamble · 6 findings · 0.91 mean confidence

f01  findings are the atomic unit …
f25  provenance keeps every claim …
f10  the knowledge graph is typed …

grounded_in: 9 urls across 4 domains
```

Caption beneath: \`what an answer looks like\`, \`margin: 16px 0 0\`, centered,
IBM Plex Mono **10px**, \`letter-spacing: .14em\`, uppercase,
\`color: var(--text-faint)\`.

*v1 showed three visuals here — an \`EvidenceItem\` under "ground" and a five-row
\`PhaseStep\` log under "grow" (planning / searching / crawling / extracting / merging,
with done/active/pending ticks). v2 keeps only the verdict band. The phase log is worth
restoring if "grow" needs more weight.*

---

### 6. Use cases (three rows)
**Purpose:** show three shapes of the same KB for three audiences.

\`padding: 132px 32px 0\`. Three rows, each:
\`display: grid; grid-template-columns: 220px 1fr; gap: 56px; padding: 40px 0;\`
\`align-items: start\`. \`border-top: 1px solid var(--line)\` on all three;
\`border-bottom\` on the last only.

- **Left cell** — \`for agents\` / \`for research\` / \`for audit\`. IBM Plex Mono **10px**,
  \`letter-spacing: .2em\`, uppercase, \`color: var(--text-faint)\`, \`padding-top: 5px\`
  for optical alignment with the heading beside it.
- **Right cell** — \`flex-direction: column; gap: 12px\`:
  - \`<h4>\` IBM Plex Sans **24px**, \`font-weight: 500\`, \`letter-spacing: -.01em\`,
    \`color: var(--text)\`. Note: sans, not display — this is the one place body type is
    used at heading scale, which keeps the section quieter than section 5.
  - \`<p>\` **15px**, \`line-height: 1.72\`, \`color: var(--text-dim)\`, \`max-width: 62ch\`.

Exact copy:
1. **for agents / memory that survives a model swap** — "the knowledge base is the
   durable layer. change the model and the facts, the scores, and the provenance all
   stay. tap it over mcp for a preamble instead of stuffing context and hoping."
2. **for research / a knowledge base you edit by hand** — "nodes, edges, and findings are
   all editable in the control panel, with undo. a wrong relation is corrected once and
   stays corrected. it is a working document, not a build artifact."
3. **for audit / every claim, one click from its source** — "grounded_in ties each node
   and edge to finding ids, and each finding to the urls and queries that surfaced it.
   drift is flagged by diffing the schema you intended against the one the graph grew."

---

### 7. FAQ — \`#faq\`
**Purpose:** clear the five objections that stop a developer from installing.

\`max-width: 780px\`, \`padding: 132px 32px 0\`.

**Label:** \`questions\`, \`margin: 0 0 44px\`, IBM Plex Mono **10px**,
\`letter-spacing: .24em\`, uppercase, \`color: var(--text-faint)\`.

**Each item:** \`border-top: 1px solid var(--line)\` (last item also \`border-bottom\`).
- **Trigger row** — \`display: flex; align-items: center; justify-content: space-between;\`
  \`gap: 20px; padding: 22px 0; cursor: pointer\`.
  - Question: IBM Plex Sans **16.5px**, \`font-weight: 500\`, \`color: var(--text)\`,
    lowercase.
  - Glyph: \`+\` collapsed / \`−\` (U+2212 minus, not a hyphen) expanded. IBM Plex Mono
    **14px**, \`color: var(--text-faint)\`.
- **Answer** — \`padding: 0 0 24px\`, \`max-width: 64ch\`, **15px**,
  \`line-height: 1.75\`, \`color: var(--text-dim)\`.

**Behavior:** independent toggles (**not** an accordion — multiple can be open). Item 0
is open on load. Currently an instant show/hide; if you animate, use a height/opacity
transition at 180ms \`cubic-bezier(.2,.9,.3,1)\` to match the system.

Exact Q&A:
1. **is this just a vector database?** — "no. embeddings are only the retrieval layer.
   the unit of storage is a finding — text with a category, a confidence, and its
   provenance — and a typed graph sits over the top of it."
2. **self-hosted or hosted?** — "both. sqlite and sqlite-vec give you a knowledge base in
   a single file, with no infrastructure. point it at supabase and pgvector when it needs
   to be shared. same engine, same api."
3. **how are stale facts corrected?** — "re-ground the topic. new findings are merged
   against the old ones rather than overwriting them, so the correction and what it
   replaced both stay inspectable."
4. **how do i plug it into my agent?** — "mcp. the engine ships an mcp server — tap a
   knowledge base for a preamble, or trigger explore when coverage comes back gap. an
   http api sits underneath if you prefer it."
5. **license and pricing** — "the engine is mit and self-hostable, permanently. the hosted
   control panel is in private beta; pricing arrives with it."

---

### 8. Closing CTA
\`padding: 132px 32px 140px\`, centered column.
- **Headline** — \`ground it once\`, \`max-width: 20ch\`. Big Shoulders Display 700,
  **52px**, \`line-height: .98\`, \`letter-spacing: .01em\`, uppercase.
- **Body** — "one command puts a knowledge base on your machine. nothing to provision."
  \`margin: 22px 0 0\`, \`max-width: 46ch\`, **16px**, \`line-height: 1.72\`,
  \`color: var(--text-dim)\`.
- **CTA row** — \`margin: 34px 0 0\`, identical to the hero's (same button style object,
  same \`or npx delapan init\` text). Repeating it verbatim is intentional.

---

### 9. Footer
\`border-top: 1px solid var(--line)\`, \`background: var(--bg1)\`. Single row:
\`max-width: 1180px\`, \`padding: 30px 32px\`,
\`display: flex; align-items: center; justify-content: space-between; gap: 32px;\`
\`flex-wrap: wrap\`.
- **Left** — \`Logomark size={18}\` (light variant) + \`gap: 11px\` + \`delapan · mit\`
  in IBM Plex Mono **10px**, \`letter-spacing: .16em\`, uppercase,
  \`color: var(--text-faint)\`.
- **Right** — \`docs\` \`github\` \`mcp\` \`changelog\`, \`gap: 24px\`, IBM Plex Mono
  **11px**.

*v1 used a four-column dark footer on \`--text\` \`#1f2b3a\` with a repeated CTA. v2's
one-line light footer is the deliberate choice — the closing CTA section already did that
job.*

---

## Interactions & Behavior

**Graph — select.** \`pointerdown\` on a node selects it and begins a drag in the same
gesture. Selection drives: the amber halo, neighborhood dimming, label visibility, and the
entire evidence panel below. Initial selection on load is \`c_finding\` — chosen because
its two findings articulate the core pitch.

**Graph — drag.** \`pointerdown\` on a node sets \`drag = nodeId\` and calls
\`preventDefault()\` + \`stopPropagation()\`. \`pointermove\` on the **canvas** maps client
coords back through the container's \`getBoundingClientRect()\` into graph space and writes
\`pos[nodeId]\`. Drag ends on \`pointerup\` / \`pointerleave\` on the canvas **and** on a
\`window\`-level \`pointerup\` listener — the window listener is what prevents a node
sticking to the cursor when the pointer is released outside the canvas. Positions are
session-only; no persistence, no reset control in v2.

**Graph — hover.** Sets \`hover = nodeId\`, which can reveal a label the current
\`nodeLabels\` mode would otherwise hide. No other hover affordance on nodes.

**FAQ.** Click anywhere on the trigger row toggles that item. Independent, not exclusive.

**Nav.** Hash anchors + \`scroll-behavior: smooth\`. The 60px sticky header will overlap
anchored headings — add \`scroll-margin-top: 76px\` to \`#how\` and \`#faq\` in production
(the prototype's generous 132px section padding masks this; a real implementation should
be explicit).

**Loading / error / empty states.** None designed — the page is static content plus a
client-side graph with inlined data. If the graph is ever fed from the live API, it needs:
a loading state (use the system's \`Spinner\`), an error state (diagnostic voice, e.g.
\`embeddings unavailable (503) — engine can't band coverage right now\`), and an
empty-selection state for the evidence panel. **Flag this to design before shipping a
live-data version.**

**Responsive.** Only partially specified — the prototype was designed at desktop width.
What already adapts: the hero headline clamps, the "three moves" and findings grids are
\`auto-fit\`, the footer and CTA rows wrap. What is **not** designed and needs a design
pass:
- The 520px graph canvas on narrow screens — likely a shorter canvas plus a "core"
  density (see \`graphDensity\`), or a static image fallback with the interactive version
  desktop-only. Dragging 11px targets on touch also fails the 44px minimum-hit-target
  rule; consider tap-to-select only on touch.
- The use-case rows' fixed \`220px\` first column should stack below ~720px.
- Header nav at very narrow widths.

**Accessibility gaps to close in implementation** (the prototype does not handle these):
- FAQ triggers must be real \`<button>\` elements with \`aria-expanded\` and
  \`aria-controls\`, keyboard operable.
- Graph nodes need keyboard access — at minimum a focusable list of nodes, or arrow-key
  traversal, with the evidence panel as an \`aria-live\` region. A non-visual equivalent of
  the graph (the same findings as a list) is the honest answer.
- Verify contrast of \`--text-faint\` \`#8595a9\` on \`--bg1\` \`#eef1f6\` at 10px — it is
  used heavily for labels and is likely below 4.5:1. Either darken to \`--text-dim\` or
  accept it only for decorative duplicated text.
- \`prefers-reduced-motion\`: disable the 420ms position transitions and smooth scroll.
- The \`Logomark\` needs an accessible name; decorative instances need \`aria-hidden\`.

---

## State Management

All state is local to the graph section; the rest of the page is static.

| State | Type | Initial | Drives |
|---|---|---|---|
| \`sel\` | node id or null | \`"c_finding"\` | halo, dimming, labels, evidence panel, caption |
| \`hover\` | node id or null | \`null\` | label reveal |
| \`pos\` | \`{ [id]: {x, y} }\` | \`{}\` | node positions, overriding authored defaults |
| \`drag\` | node id or null | \`null\` | disables position transition; gates \`pointermove\` |
| \`faq\` | \`{ [index]: boolean }\` | \`{ 0: true }\` | FAQ expansion |

**Derived per render** (recompute, don't store): degree per node from the visible edge
list; the neighbor set of \`sel\`; per-node diameter, opacity, shadow, z-index, and label
visibility; and the selected node's findings list.

**Data fetching:** none. All graph data is inlined as three literals — \`N\` (22 nodes:
id, type, label, x, y, grounded finding ids, core flag), \`E\` (31 edges: source, verb
phrase, target), \`F\` (21 findings: title, category, confidence, source count, provenance
domain). This is a curated subset of delapan's real mock KB and is the right amount of
data for the page — it is dense enough to look real and sparse enough to stay legible.
If you swap in live API data, keep it to roughly this size and preserve the authored
x/y positions (or run a real ForceAtlas2 layout, which is what the app does).

**Configuration** (exposed as tweakable props in the prototype; in production these are
build-time constants unless you have a reason to expose them):
| Prop | Values | Default | Effect |
|---|---|---|---|
| \`nodeLabels\` | \`lit\` / \`all\` / \`none\` | \`lit\` | which labels render |
| \`showEvidence\` | boolean | \`true\` | evidence panel visibility |
| \`graphDensity\` | \`full\` / \`core\` | \`full\` | \`core\` filters to 13 flagged nodes and their induced edges — this is the intended narrow-viewport / reduced-complexity mode |

---

## Design Tokens

All from the delapan design system. **Reference the custom properties, not the hex.**

**Surfaces**
| Token | Value | Use |
|---|---|---|
| \`--bg0\` | \`#f5f7fa\` | page + canvas |
| \`--bg1\` | \`#eef1f6\` | evidence panel, footer |
| \`--bg2\` | \`#e5eaf2\` | (unused here) |
| \`--bg3\` | \`#dce3ed\` | (unused here) |

**Ink**
| Token | Value | Use |
|---|---|---|
| \`--text\` | \`#1f2b3a\` | headlines, emphasis |
| \`--text-dim\` | \`#5a6b80\` | body copy, links |
| \`--text-faint\` | \`#8595a9\` | mono labels, captions |

**Rules**
| Token | Value |
|---|---|
| \`--line\` | \`#d3dbe6\` |
| \`--line-bright\` | \`#b9c5d4\` |

**Accent (amber annunciator — sparingly)**
| Token | Value | Use on this page |
|---|---|---|
| \`--accent\` | \`#b45309\` | CTA fill, logo table core |
| \`--accent-bright\` | \`#d97706\` | CTA hover; also the technology node hue |
| \`--accent-dim\` | \`rgba(180,83,9,.14)\` | active button fill, selection highlight |
| selected-node halo | \`rgba(180,83,9,.16)\` | 5px node ring |

**Status hues** (only \`--cyan\` and the rich-green verdict appear here)
\`--green #15803d\` (rich) · \`--amber #b45309\` (sparse) · \`--red #b91c1c\` (gap/drift) ·
\`--cyan #0e7490\` (provenance/info)

**Entity-type hues** (fixed — do not reassign)
concept \`#0284c7\` · technology \`#d97706\` · person \`#db2777\` ·
company \`#059669\` · project \`#7c3aed\`

**Typography scale as used**
| Role | Family | Size | Weight | Tracking | Line-height |
|---|---|---|---|---|---|
| hero headline | Big Shoulders | \`clamp(60,7.8vw,108)\` | 700 | .008em | .86 |
| section headline | Big Shoulders | 44px | 700 | .01em | 1.02 |
| closing headline | Big Shoulders | 52px | 700 | .01em | .98 |
| step title | Big Shoulders | 26px | 700 | .1em | — |
| wordmark | Big Shoulders | 19px | 700 | .05em | — |
| use-case heading | Plex Sans | 24px | 500 | -.01em | — |
| hero subhead | Plex Sans | 17px | 400 | — | 1.72 |
| FAQ question | Plex Sans | 16.5px | 500 | — | — |
| body / FAQ answer | Plex Sans | 15px | 400 | — | 1.72-1.75 |
| step body | Plex Sans | 14.5px | 400 | — | 1.78 |
| finding title | Plex Sans | 14.5px | 400 | — | 1.55 |
| body default | Plex Sans | 13px | 400 | — | 1.65 |
| CTA label | Plex Sans | 13px | — | .03em | — |
| install line | Plex Mono | 12px | 400 | — | — |
| nav / footer link | Plex Mono | 11px | 400 | .05em | — |
| node label | Plex Mono | 10px | 400/500 | .02em | — |
| eyebrow / caption | Plex Mono | 10px | 400 | .14-.24em | — |
| finding meta | Plex Mono | 10px | 400 | .12em | — |

**Radius** — \`--radius-sm 3px\` · \`--radius 4px\` · \`--radius-lg 6px\` ·
\`--radius-pill 999px\` (CTAs only — a v2 departure from the app's tight-radius default,
and the one place this page reads softer than the product)

**Shadows** — graph container \`0 1px 2px rgba(31,43,58,.04)\` ·
node \`0 1px 3px rgba(31,43,58,.14)\` ·
selected node \`0 0 0 5px rgba(180,83,9,.16), 0 1px 3px rgba(31,43,58,.2)\` ·
(system floating-layer elevation, unused here: \`0 10px 30px rgba(31,43,58,.16)\`)

**Spacing** — section rhythm **132px** · in-section step **64-76px** · grid gap
**26/56/64px** · container padding **32px** · row padding **40px 0** · FAQ row
**22px 0**

**Motion** — \`--t-fast 120ms\` (color/border) · \`--t-med 180ms\` (entrances) ·
graph position **420ms** · graph opacity **320ms** · link color **240ms** ·
easing \`cubic-bezier(.2,.9,.3,1)\` throughout. No bounce, no spring, no parallax,
no scale-on-press.

---

## Assets

- **Logomark** — the brilliant-cut faceted "8". Design-system component; SVGs at
  \`assets/logo-light.svg\`, \`assets/logo-dark.svg\`, \`assets/logo-mono.svg\`. Header uses
  \`dark\` at 26px, footer uses default \`light\` at 18px. Do not recolor the amber table,
  redraw the facets, or stretch the mark.
- **Fonts** — Big Shoulders Display (700), IBM Plex Mono (400/500), IBM Plex Sans
  (400/500), all from Google Fonts via \`tokens/fonts.css\`. No binaries ship. Self-host if
  your environment requires it, and flag that.
- **No images, no icons, no illustration.** Every glyph on the page is Unicode text:
  \`↗\` external link · \`+\` / \`−\` FAQ · \`·\` separator. The design system ships no icon
  set by design; if a new surface needs one, use a thin-stroke set (e.g. Lucide) and flag
  the substitution. Never filled/duotone icons, never emoji.
- **Graph data** is inlined in the prototype (see State Management) — a curated subset of
  delapan's mock KB.

---

## Files

In this bundle:
| File | Status | Notes |
|---|---|---|
| \`Landing Page v2.dc.html\` | **build this** | hifi, canonical |
| \`Landing Page.dc.html\` | reference | hifi, superseded denser pass; source for the phase log + relation pills if wanted back |
| \`Landing Wireframes.dc.html\` | reference | lofi, five explored structures (1a-1e); 1b chosen |
| \`_ds/\` | reference | the bound delapan design system — tokens, \`styles.css\`, component bundle |

Each prototype is a self-contained HTML file: one template plus one logic class, with all
styling inline. Open directly in a browser.

**Reading a \`.dc.html\` file:** the markup inside \`<x-dc>\` is the template;
\`{{ name }}\` interpolates a value from the logic class's \`renderVals()\`;
\`<sc-for list as>\` is a loop, \`<sc-if value>\` a conditional; \`<x-import\`
\`component-from-global-scope="Namespace.Component">\` mounts a design-system component
with its attributes as props. Translate these to your framework's equivalents.

**Upstream source of truth** (if you have access — worth reading for the graph
implementation and the interaction patterns):
- Frontend / design source: https://github.com/anthonysuherli/delapan-fe — tokens live in
  \`src/styles/tokens.css\`; panels in \`src/panels/*.tsx\`; read \`CLAUDE.md\` for optimistic
  mutations, command/undo, and sigma reducers.
- Engine: https://github.com/anthonysuherli/delapan-be — SQLite + sqlite-vec / Supabase +
  pgvector, MCP server, HTTP API.

---

## Implementation order (suggested)

1. Tokens + fonts + global resets (including \`a\` / \`a:hover\`).
2. Static sections: header, hero, three moves, use cases, closing CTA, footer. These are
   most of the page and carry no state.
3. FAQ toggles — as accessible \`<button>\`s from the start.
4. Graph: render nodes and edges from the data literals at authored positions, no
   interaction.
5. Selection + neighborhood dimming + the evidence panel. This is the payload of the page;
   budget real time for it.
6. Drag, including the \`window\`-level \`pointerup\`.
7. Responsive and accessibility passes — both need design input (see the flagged gaps
   above).
