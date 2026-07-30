# Landing v2 Instrument-Panel Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public landing page pixel-accurately from the vendored v2 design handoff — instrument-panel look, interactive KB-graph proof, docs-first CTA.

**Architecture:** The landing route stops using `SiteShell` and renders its own v2 frame. New per-section components under `src/landing/`, ported design-system primitives under `src/landing/ds/`, one interactive island (`KbGraph`) with inlined data, all styling in a rewritten `src/styles/landing.css` (scanned) resolving through a new token definition file (exempt). Everything else in the app is untouched.

**Vision goals served:** "Hosted public tier with account isolation" — the public landing page at `/` (docs-first conversion per the ratified spec).

**Tech Stack:** React 18 + TypeScript strict, Vite 6, Vitest (node env, `.ts` tests only, `createElement` + `renderToStaticMarkup` for render tests). No new dependencies.

**Spec:** `docs/truenorth/specs/2026-07-29-landing-v2-instrument-design.md`
**Canonical design (in-repo):** `docs/handoff/landing-v2/Landing Page v2.dc.html` (exact markup/values, lines cited per task), `docs/handoff/landing-v2/README.md` (written spec), `docs/handoff/landing-v2/_ds/delapan-design-system-*/` (tokens + component sources in `_ds_bundle.js`).

## Global Constraints

- **The handoff wins.** Every color, size, spacing, tracking, and copy string comes verbatim from the vendored handoff files — implementers read them directly; this plan cites file + line rather than re-transcribing. Where the spec's "Deviations" section (spec §Deviations, items 1–5) overrides the handoff, the spec wins; there are no other deviations.
- The literal-scan gate (`src/styles/literals.test.ts`) still scans `landing.css`: no raw hex/rgba, integer z-index, or px border-radius there — values resolve through the new `--dlpv2-*`-prefixed custom properties in `src/styles/landing-v2-tokens.css` (a definition file, NOT added to the scan). Prefix ALL new tokens `--dlpv2-` to avoid colliding with the app's `tokens.css` (`--bg0` etc. exist there with different values). Exceptions that are structural, not brand-scale (breakpoints, ch measures, the 520px canvas height, clamp() font sizes, tracking em values, line-heights, the graph viewBox constants) stay raw, matching the existing convention.
- **All v2 styles scope under `.lpv2`** (the root class LandingApp renders). No global element selectors — the rest of the site must not inherit v2 link/selection/body styles.
- Domain nouns verbatim, all-lowercase voice for UI labels, UPPERCASE for section labels — never paraphrase: finding, node, edge, grounded_in, provenance, coverage (rich/sparse/gap), preamble, explore, schema drift, synopsis.
- Install line is `git clone github.com/anthonysuherli/delapan` (spec Deviation 1 — `npx delapan init` is a dead command; never ship it). GitHub links → `https://github.com/anthonysuherli/delapan` (never delapan-be).
- Tests are `.ts` files (vitest include `src/**/*.test.ts`, node env).
- Strict build (`noUnusedLocals` etc.); run `npm run build && npm run test` before every commit.
- Kicker/step numbering and FAQ items come from data arrays, not hardcoded copies of markup.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/styles/landing-v2-tokens.css` | create | `--dlpv2-*` custom properties (values from `_ds/*/tokens/*.css`) |
| `src/styles/landing.css` | rewrite | all `.lpv2-*` rules; stays literal-scanned |
| `src/landing/ds/Logomark.tsx` | create | faceted-8 mark (port from `_ds_bundle.js` `components/brand/Logomark.jsx`) |
| `src/landing/ds/Button.tsx` | create | the amber `variant="active"` pill (port; only the variants the page uses) |
| `src/landing/ds/TypeChip.tsx`, `ds/ConfidenceBar.tsx`, `ds/VerdictBand.tsx` | create | evidence + verdict primitives (port) |
| `src/landing/ds/ds.test.ts` | create | render assertions for the five primitives |
| `src/landing/graphData.ts` | create | `N`/`E`/`F` literals + `TYPE_COLORS` + viewBox constants, copied exactly from prototype lines 216–285 |
| `src/landing/kbGraphModel.ts` | create | pure derivations: visible set (full/core), degree, neighbor/lit set, node diameter |
| `src/landing/kbGraphModel.test.ts` | create | tests for those derivations |
| `src/landing/KbGraph.tsx` | create | the interactive island (drag/select/hover/evidence panel) |
| `src/landing/SiteHeader.tsx`, `Hero.tsx`, `ThreeMoves.tsx`, `UseCases.tsx`, `Faq.tsx`, `ClosingCta.tsx`, `SiteFooter.tsx` | create/rewrite | one section each, markup per prototype |
| `src/landing/faq.ts` + `faq.test.ts` | create | FAQ data + toggle-state helper + tests |
| `src/landing/LandingApp.tsx` | rewrite | `.lpv2` root; composes sections; no SiteShell |
| `src/landing/{Problem,Pillars,Coverage,Resolution,WhereItPlugsIn,WhatItIsnt}.tsx`, `src/site/MarkField.tsx`, `src/site/markFieldCells.{ts,test.ts}` | delete | superseded by v2 (MarkField's only consumer was the old hero) |
| `public/demo-resolution.mp4`, `public/demo-resolution-poster.png` | delete | orphaned by Resolution removal |

`src/site/CtaRow.tsx` and `SiteShell.tsx` stay untouched (other routes still use them).

---

### Task 1: Tokens + design-system primitives (TDD)

**Files:**
- Create: `src/styles/landing-v2-tokens.css`
- Create: `src/landing/ds/Logomark.tsx`, `src/landing/ds/Button.tsx`, `src/landing/ds/TypeChip.tsx`, `src/landing/ds/ConfidenceBar.tsx`, `src/landing/ds/VerdictBand.tsx`
- Test: `src/landing/ds/ds.test.ts`

**Interfaces:**
- Consumes: token values from `docs/handoff/landing-v2/_ds/delapan-design-system-a684d241-041d-49e4-aa44-45573a1d2cf2/tokens/{colors,typography,geometry,semantic}.css`; component sources embedded in `_ds/_ds_bundle.js` (search for `components/brand/Logomark.jsx`, `components/core/Button.jsx`, `components/graph/TypeChip.jsx`, `components/data/ConfidenceBar.jsx`, `components/feedback/VerdictBand.jsx` — each `try { (() => { ... })() }` block is that component's readable JSX source).
- Produces:
  - `Logomark({ variant?: "light" | "dark" | "mono", size?: number, title?: string }): JSX.Element` — when `title` is given renders `role="img"` + `<title>`; otherwise `aria-hidden="true"`.
  - `DsButton({ href: string, kind: "nav" | "hero", children: ReactNode })` — an `<a>` styled as the DS `variant="active"` amber pill; `kind` selects the two override sets from prototype lines 366–367 (`navCta`: mono 11px, 7px 14px padding; `heroCta`: 13px, 13px 26px, letter-spacing .03em; both pill radius).
  - `TypeChip({ type: string })`, `ConfidenceBar({ value: number, width?: number })`, `VerdictBand({ coverage: "rich" | "sparse" | "gap", note: string, children: ReactNode })` — rendered appearance matched to the bundle sources exactly.
  - Tokens: every custom property from the four token files, renamed with the `--dlpv2-` prefix (e.g. `--bg0` → `--dlpv2-bg0`), all under a `.lpv2 { … }` block (not `:root` — scoping is the isolation mechanism). Also `--dlpv2-type-{concept,technology,person,company,project}`.

- [ ] **Step 1: Write the failing test** — `src/landing/ds/ds.test.ts`, same pattern as the repo's `supersedeChain.test.ts` on the parked branch (createElement + renderToStaticMarkup, node env): Logomark renders `aria-hidden="true"` without `title` and `role="img"` with it; DsButton renders an `<a href>` with the given label; TypeChip lowercases and displays the type name; ConfidenceBar clamps `value` into [0,1] and exposes it via `aria-hidden` presentation (decorative) plus a `0.91`-style printed value only if the bundle source prints one (match the source); VerdictBand prints the coverage word and note. Inline paint IS allowed in these components only where the bundle source computes colors from props (TypeChip/ConfidenceBar node colors) — assert instead that NO raw hex appears that isn't prop-derived (i.e. static hex belongs in CSS/tokens).
- [ ] **Step 2: Run it** — `npx vitest run src/landing/ds/ds.test.ts`. Expected: FAIL (modules missing).
- [ ] **Step 3: Create the tokens file** — transcribe the four handoff token files into `src/styles/landing-v2-tokens.css` under `.lpv2`, `--dlpv2-` prefix, one section comment per source file. Import it from `src/main.tsx` alongside the other stylesheets (match how existing css files are imported — check `src/main.tsx`/`Root.tsx` for the pattern).
- [ ] **Step 4: Port the five components** — read each source block out of `_ds_bundle.js` and rewrite as typed React function components. Colors/typography via `var(--dlpv2-…)`; geometry values verbatim. Keep each file under ~120 lines; the Logomark's SVG paths are copied exactly (never redrawn — handoff README forbids it).
- [ ] **Step 5: Green** — `npx vitest run src/landing/ds/ds.test.ts` passes; then `npm run build && npm run test`.
- [ ] **Step 6: Commit** — `feat(landing-v2): dlpv2 tokens + ported DS primitives (Logomark, Button, TypeChip, ConfidenceBar, VerdictBand)`

---

### Task 2: Frame — header, hero, closing, footer; LandingApp rewired; old landing deleted

**Files:**
- Create: `src/landing/SiteHeader.tsx`, `src/landing/SiteFooter.tsx`
- Rewrite: `src/landing/Hero.tsx`, `src/landing/ClosingCta.tsx`, `src/landing/LandingApp.tsx`
- Rewrite: `src/styles/landing.css` (frame + hero + closing + footer rules; later tasks append their sections)
- Delete: `src/landing/Problem.tsx`, `Pillars.tsx`, `Coverage.tsx`, `Resolution.tsx`, `WhereItPlugsIn.tsx`, `WhatItIsnt.tsx`, `src/site/MarkField.tsx`, `src/site/markFieldCells.ts`, `src/site/markFieldCells.test.ts`, `public/demo-resolution.mp4`, `public/demo-resolution-poster.png`

**Interfaces:**
- Consumes: Task 1's `Logomark` and `DsButton`.
- Produces: `LandingApp` renders `<div className="lpv2">` containing `SiteHeader`, `<main>` with `Hero` + placeholders-free composition (sections added by Tasks 3–4 slot between Hero and ClosingCta — leave a clearly-marked composition array), `ClosingCta`, `SiteFooter`. An exported `InstallLine` mini-component (used by Hero and ClosingCta) rendering `or git clone github.com/anthonysuherli/delapan` per spec Deviation 1.

- [ ] **Step 1: Markup + copy from the prototype** — header: prototype lines 30–42 (60px sticky, blur backdrop, lockup gap 11px, wordmark Big Shoulders 700 19px .05em, nav mono 11px `how it works`→`#how`, `faq`→`#faq`, nav-kind DsButton → `/docs`); hero: lines 44–52 (eyebrow, clamp headline max 17ch, 53ch subhead, hero-kind DsButton + InstallLine); closing: lines 190–197 ("ground it once", support line per spec Deviation 1: "one clone puts a knowledge base on your machine. nothing to provision."); footer: lines 199–212 (`delapan · mit` + Logomark size 18 aria-hidden; links docs→`/docs`, github→public repo, mcp→`/docs/quickstart`, changelog→`/changelog` per spec Deviation 2). Copy strings byte-for-byte from the prototype except the two deviations.
- [ ] **Step 2: landing.css rewrite** — delete every existing rule; new `.lpv2`-scoped rules per README "Global frame" (13px Plex Sans body, link colors + 240ms transition, `::selection` amber 14%, `text-wrap: pretty`, 1180px/32px content column, 132px section rhythm, `scroll-margin-top: 76px` on `#how`/`#faq` targets, smooth scroll via `.lpv2`-scoped `scroll-behavior` on html replaced by `scroll-behavior: smooth` set from a `useEffect` in LandingApp adding a class to `<html>` — simplest: apply `scroll-behavior:smooth` on `html:has(.lpv2)`; verify `:has` passes the build's browserslist, else set it inline from LandingApp effect and remove on unmount). All colors via `--dlpv2-*`.
- [ ] **Step 3: Delete the old components/assets** (`git rm` the list above); update anything importing them (only `LandingApp` should).
- [ ] **Step 4: Grep gate** — `grep -rn "MarkField\|markFieldCells\|lp-hero\|lp-section\|lp-pillar\|demo-resolution" src/ index.html` → no hits outside `landing.css` history (i.e. zero hits).
- [ ] **Step 5:** `npm run build && npm run test` — strict build proves no dangling imports; literal scan proves the rewritten landing.css resolves through tokens.
- [ ] **Step 6: Commit** — `feat(landing-v2): v2 frame — sticky header, hero, closing, footer; old landing retired`

---

### Task 3: The graph island (TDD on the model)

**Files:**
- Create: `src/landing/graphData.ts`, `src/landing/kbGraphModel.ts`, `src/landing/KbGraph.tsx`
- Test: `src/landing/kbGraphModel.test.ts`
- Modify: `src/landing/LandingApp.tsx` (slot KbGraph after Hero), `src/styles/landing.css` (canvas/evidence styles)

**Interfaces:**
- Consumes: Task 1's `TypeChip`, `ConfidenceBar`; `--dlpv2-type-*` tokens.
- Produces:
  - `graphData.ts`: `export const NODES: GraphNode[]`, `EDGES: GraphEdge[]`, `FINDINGS: Record<string, Finding>`, `TYPE_COLORS: Record<string, string>`, `VIEW = { x:100, y:80, w:870, h:590 }` — literal-for-literal from prototype lines 216–285 (22 nodes, 31 edges, 21 findings; tuple arrays mapped to typed objects exactly as the script does).
  - `kbGraphModel.ts` (pure, no React): `visible(density: "full"|"core")` → `{ ns, es }` (core = `core`-flagged nodes + induced edges); `degrees(es)`; `neighborsOf(sel, es)`; `diameter(degree)` = `2*(5.5 + min(degree,8)*1.25)`; `isLit(id, sel, neighbors)`.
  - `KbGraph({ density?: "full"|"core" })`: state `{ sel, hover, pos, drag }` and behavior per prototype lines 287–371 — pointer drag remaps client coords into the 870×590 viewBox space, selection halo `0 0 0 5px` amber 16%, non-lit nodes at opacity .16, label visibility mode `lit`, 420ms position transitions (`transition: none` while dragging; ALL transitions disabled under `prefers-reduced-motion` via CSS), HUD line, evidence panel (TypeChip + label + `grounded in N findings`, finding cards with title, category, ConfidenceBar, provenance domain as plain text per spec Deviation 2) inside `aria-live="polite"`. Keyboard access per spec Deviation 3: each node is a `<button>` (focusable), Enter/Space selects; initial `sel = "c_finding"`.

- [ ] **Step 1: Failing model tests** — degree counts for a hand-picked node (`j_delapan` has 11 edges in `E`— count from data, don't guess in the test; derive expected from the literal), neighbor set of `c_finding`, `visible("core")` returns exactly the 13 core-flagged nodes and only edges with both ends core, diameter clamps at degree 8, `isLit` truth table (no selection → all lit).
- [ ] **Step 2: RED** — `npx vitest run src/landing/kbGraphModel.test.ts` fails (modules missing).
- [ ] **Step 3: Implement** `graphData.ts` + `kbGraphModel.ts`. **GREEN**, then build `KbGraph.tsx` on top.
- [ ] **Step 4: CSS** — canvas container per prototype lines 55–56 & README §3 (520px, vignette via tokens + a `--dlpv2-*`-resolved radial gradient; the pure-white gradient stop may live in the tokens file), evidence panel per lines 73–91. Mobile (≤720px): 380px canvas, `density="core"` (LandingApp passes it via a `matchMedia` hook), drag disabled on touch (`pointerdown` selects only when `pointerType === "touch"`).
- [ ] **Step 5:** `npm run build && npm run test`.
- [ ] **Step 6: Commit** — `feat(landing-v2): interactive KB-graph proof — data, model, island, evidence panel`

---

### Task 4: Content sections — three moves, verdict sample, use cases, FAQ (TDD on FAQ state)

**Files:**
- Create: `src/landing/ThreeMoves.tsx`, `src/landing/UseCases.tsx`, `src/landing/Faq.tsx`, `src/landing/faq.ts`
- Test: `src/landing/faq.test.ts`
- Modify: `src/landing/LandingApp.tsx` (compose), `src/styles/landing.css` (section rules)

**Interfaces:**
- Consumes: Task 1's `VerdictBand`.
- Produces: `ThreeMoves` (id `how`) with the 01/02/03 grid from a `MOVES` array (prototype lines 96–114) plus the VerdictBand sample (lines 115–124: coverage `rich`, note `kb can answer`, the 6-line monospace body verbatim); `UseCases` rows from a `CASES` array (lines 127–149); `faq.ts` exports `FAQ_ITEMS` (5 q/a pairs verbatim, lines 151–187) and `toggleFaq(state, i)` pure helper; `Faq` renders real `<button>` triggers with `aria-expanded`/`aria-controls`, first item open.

- [ ] **Step 1: Failing FAQ test** — `toggleFaq` flips independent indices without touching others; initial state `{0: true}`; double-toggle returns to start.
- [ ] **Step 2: RED**, implement `faq.ts`, **GREEN**.
- [ ] **Step 3: Build the three components + CSS** — values/copy verbatim from the prototype lines cited; use-case rows stack below 720px (spec Deviation 4); `+`/`−` glyph from state.
- [ ] **Step 4:** `npm run build && npm run test`.
- [ ] **Step 5: Commit** — `feat(landing-v2): three moves, verdict sample, use cases, accessible FAQ`

---

### Task 5: Responsive + reduced-motion + a11y sweep

**Files:**
- Modify: `src/styles/landing.css`, and any component where a gap is found.

**Interfaces:** consumes everything; produces the final page.

- [ ] **Step 1:** Walk spec Deviations 3–4 as a checklist against the built page: FAQ keyboard, node focus/Enter/Space, `aria-live` evidence, reduced-motion (no 420ms transitions, no smooth scroll), scroll-margin on anchors, Logomark names, ≤720px use-case stack + 380px core graph + tap-select, ≤480px nav collapse (CTA only), no horizontal scroll at 375px.
- [ ] **Step 2:** Contrast check the handoff flagged: `--dlpv2-text-faint` on `--dlpv2-bg1` at 10px — compute the ratio; where it's below 4.5:1 AND the text is informative (HUD line, evidence categories), move to `--dlpv2-text-dim`; keep faint only for decorative/duplicated text. Note each change in the commit body.
- [ ] **Step 3:** `npm run build && npm run test`; commit — `fix(landing-v2): a11y + responsive closes from the handoff punch list`

---

### Task 6: Browser verification (controller, in-session)

- [ ] Side-by-side vs the prototype (handoff server on :8765): header/hero/graph/sections/footer fidelity at 1280px.
- [ ] Interactions: drag a node, select via keyboard, evidence panel updates + announces; FAQ keyboard toggles; CTA & footer links resolve (docs routes exist, GitHub 200s).
- [ ] Reduced-motion simulation; 375px and 768px passes; zero console errors; screenshots for the record.

---

## Self-Review (done at write time)

- **Spec coverage:** structure §Page structure → Tasks 2–4; island → Task 3; DS/tokens → Task 1; Deviations 1–2 → Tasks 2 (copy/links) & 3 (provenance text); Deviations 3–4 → Tasks 3/4 inline + Task 5 sweep; Deviation 5 → Task 2 CSS scoping; "What this replaces" deletions → Task 2; Verification → Task 6 + per-task gates.
- **Placeholder scan:** tasks cite exact handoff files/line ranges for every value instead of re-transcribing 375 lines — deliberate; the handoff is vendored in-repo and is the single source of truth (Global Constraint 1). No TBDs.
- **Type consistency:** `DsButton` kind names, `KbGraph` density prop, `toggleFaq` signature, and `--dlpv2-` prefix used consistently across tasks.
