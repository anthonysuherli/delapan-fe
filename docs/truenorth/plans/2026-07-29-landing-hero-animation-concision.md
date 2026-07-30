# Landing Hero Animation + Concision Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing page's decorative hero background with a product-telling supersede-chain animation, retire the redundant Resolution video section, and cut every section's prose roughly in half.

**Architecture:** A new `SupersedeChain` SVG component (pure CSS keyframes, no JS timers) becomes the hero's right column; its base styles ARE the final animation frame so `prefers-reduced-motion` degrades to a static resolved state for free. `MarkField` (whose only consumer is the hero) and the `Resolution` section are deleted. Copy edits are text-only changes inside existing components.

**Vision goals served:** "Hosted public tier with account isolation" — the public landing page at `/` is the hosted tier's front door.

**Tech Stack:** React 18 + TypeScript strict, Vite 6, Vitest (node env, `src/**/*.test.ts` only — no `.tsx` tests), CSS in `src/styles/landing.css` under the `--p8-*` token system.

**Spec:** `docs/truenorth/specs/2026-07-29-landing-hero-animation-concision-design.md`

## Global Constraints

- The literal-scan gate (`src/styles/literals.test.ts`) forbids raw hex/rgba colours, integer `z-index`, and px `border-radius` in `landing.css` and `site-shell.css` — every colour/radius resolves through a `--p8-*` token (defined in `site.css`, which is NOT scanned).
- The SVG component may carry **no inline `fill`/`style` attributes** except nothing at all — geometry in the TSX, paint in `landing.css` (the retired MarkField's convention, minus its animation-delay exception).
- Copy rule (spec §3): specific over abstract; keep every `lp-code` token (`grounded_in`, `superseded_by`, `valid_from`, `invalidated_at`); if a sentence could appear in any SaaS company's copy, rewrite it.
- Strict build: `noUnusedLocals`/`noUnusedParameters` — orphaned imports fail `npm run build`.
- Kicker numbers derive from the `SECTIONS` array position in `LandingApp.tsx` — never hardcode them.
- `landing.css`'s header comment documents the page's motion policy; it must be updated when the hero animation lands (Task 5), not left claiming "nothing moves unbidden."
- Commit after every task; run `npm run build && npm run test` before each commit.

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/landing/Problem.tsx` | modify | copy trim (merge 2 paragraphs → 1) |
| `src/landing/Pillars.tsx` | modify | copy trim (3 cards → ~2 lines each) |
| `src/landing/Coverage.tsx` | modify | copy trim (body → 1 sentence) |
| `src/landing/WhereItPlugsIn.tsx` | modify | copy trim (3 cards → ~2 lines each) |
| `src/landing/WhatItIsnt.tsx` | modify | copy trim (contrast bodies halved) |
| `src/landing/Resolution.tsx` | delete | section retired |
| `public/demo-resolution.mp4`, `public/demo-resolution-poster.png` | delete | video assets orphaned by Resolution removal |
| `src/landing/LandingApp.tsx` | modify | drop Resolution from `SECTIONS` |
| `src/site/CtaRow.tsx` | modify | add secondary GitHub link |
| `src/styles/site-shell.css` | modify | `.ss-cta-ghost` style |
| `src/landing/SupersedeChain.tsx` | create | hero SVG animation (geometry only) |
| `src/landing/supersedeChain.test.ts` | create | render assertions (a11y, labels, no inline paint) |
| `src/landing/Hero.tsx` | modify | swap MarkField → SupersedeChain, two-column markup |
| `src/site/MarkField.tsx`, `src/site/markFieldCells.ts`, `src/site/markFieldCells.test.ts` | delete | orphaned by hero swap |
| `src/styles/landing.css` | modify | hero grid, `.lp-sc-*` styles + keyframes, delete `.mf-*`, update header + reduced-motion |

---

### Task 1: Copy trims across five sections

**Files:**
- Modify: `src/landing/Problem.tsx`
- Modify: `src/landing/Pillars.tsx`
- Modify: `src/landing/Coverage.tsx`
- Modify: `src/landing/WhereItPlugsIn.tsx`
- Modify: `src/landing/WhatItIsnt.tsx`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: no API changes — components keep their `{ index }: { index: number }` prop signatures and section markup structure. Only text nodes change.

- [ ] **Step 1: Trim Problem.tsx — merge two paragraphs into one**

Replace the two `<p className="lp-body">` elements with a single one:

```tsx
/**
 * The gap core/memory/ exists to close. Every claim here describes the
 * status quo delapan is arguing against, not a delapan feature.
 */
export function Problem({ index }: { index: number }) {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">{String(index).padStart(2, "0")} — the problem</p>
      <h2>agent memory is append-only</h2>
      <p className="lp-body">
        Ingest a domain twice and you get two copies of every fact; correct one and the
        contradiction sits in the store for a retrieval to pick at random. And when the agent
        answers, nothing says which fact it leaned on, where that fact came from, or whether it
        was still true.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Trim Pillars.tsx card bodies to ~2 lines each**

Replace the three `<p>` bodies inside the `.lp-pillar` divs (headings, rules, and structure unchanged):

```tsx
<div className="lp-pillar">
  <div className="lp-pillar-rule" />
  <h3>grounded</h3>
  <p>
    Every finding carries <span className="lp-code">grounded_in</span> — the source it was
    extracted from. Nodes and edges keep it too, so a claim traces to a page, not a
    similarity score.
  </p>
</div>

<div className="lp-pillar">
  <div className="lp-pillar-rule" />
  <h3>self-correcting</h3>
  <p>
    A candidate fact is resolved against what the base already knows <em>before</em> it is
    written — add, update, no-op, or supersede. Re-ingesting overlap produces updates, not
    copies.
  </p>
</div>

<div className="lp-pillar">
  <div className="lp-pillar-rule" />
  <h3>nothing is lost</h3>
  <p>
    Superseding retires a fact — <span className="lp-code">valid_from</span>,{" "}
    <span className="lp-code">invalidated_at</span>,{" "}
    <span className="lp-code">superseded_by</span> — so you can ask what the base believed at
    any point. Nothing is deleted.
  </p>
</div>
```

- [ ] **Step 3: Trim Coverage.tsx body to one sentence**

Replace the `<p className="lp-body">` with:

```tsx
<p className="lp-body">
  Every read is scored against the base before any work happens — an agent that knows its
  grounding is thin can say so.
</p>
```

The `VERDICTS` array and verdict rows stay byte-identical.

- [ ] **Step 4: Trim WhereItPlugsIn.tsx card bodies to ~2 lines each**

Replace the three `<p>` bodies (headings and structure unchanged):

```tsx
<div className="lp-target">
  <h3>claude code</h3>
  <p>
    A plugin exposes the base over MCP — resume, search, explore, backlog, projects, archive.
    Every answer can name the findings it used.
  </p>
</div>

<div className="lp-target">
  <h3>your product</h3>
  <p>
    The same engine serves an HTTP API behind your own key: one request returns a grounded
    context block and its coverage band.
  </p>
</div>

<div className="lp-target">
  <h3>your machine</h3>
  <p>
    The local tier runs on SQLite — no credentials, no cloud. The hosted tier is the same
    engine behind the same storage protocol.
  </p>
</div>
```

- [ ] **Step 5: Halve WhatItIsnt.tsx contrast bodies**

Replace the `CONTRASTS` array (the `PLANNED` array and all JSX stay untouched):

```tsx
const CONTRASTS = [
  {
    title: "not a memory layer",
    body: "Fact stores hand your agent raw material it still has to reason over. delapan keeps the reasoning distilled, scored, and attributed.",
  },
  {
    title: "not a vector database",
    body: "A vector store returns neighbours. It has no opinion on whether one fact superseded another, or where either came from.",
  },
  {
    title: "not a RAG framework",
    body: "Frameworks hand you parts to assemble. This is an engine that researches, resolves, and serves.",
  },
];
```

- [ ] **Step 6: Verify build and tests**

Run: `npm run build && npm run test`
Expected: build passes (text-only changes), all existing tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/landing/Problem.tsx src/landing/Pillars.tsx src/landing/Coverage.tsx src/landing/WhereItPlugsIn.tsx src/landing/WhatItIsnt.tsx
git commit -m "copy: trim landing sections to spec — Stripe specificity rule, ~half the prose"
```

---

### Task 2: Retire the Resolution section

**Files:**
- Modify: `src/landing/LandingApp.tsx`
- Delete: `src/landing/Resolution.tsx`
- Delete: `public/demo-resolution.mp4`
- Delete: `public/demo-resolution-poster.png`

**Interfaces:**
- Consumes: nothing.
- Produces: `SECTIONS` in `LandingApp.tsx` becomes `[Problem, Pillars, Coverage, WhereItPlugsIn, WhatItIsnt]` (5 entries). Task 5 modifies `Hero.tsx` only, so no collision.

- [ ] **Step 1: Remove Resolution from LandingApp.tsx**

Delete the import line `import { Resolution } from "./Resolution";` and change the array to:

```tsx
const SECTIONS = [Problem, Pillars, Coverage, WhereItPlugsIn, WhatItIsnt];
```

- [ ] **Step 2: Delete the component and its assets**

```bash
git rm src/landing/Resolution.tsx public/demo-resolution.mp4 public/demo-resolution-poster.png
```

- [ ] **Step 3: Verify no dangling references**

Run: `grep -rn "Resolution\|demo-resolution" src/ index.html`
Expected: only hits are `src/site/docs/Resolution.tsx` and its imports/usages (the docs page component — different component, stays) and unrelated words. No hit in `src/landing/` or for `demo-resolution`.

- [ ] **Step 4: Verify build and tests**

Run: `npm run build && npm run test`
Expected: PASS — strict unused-import checks confirm the removal is clean.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: retire the Resolution video section — the hero animation will tell this story"
```

---

### Task 3: Secondary GitHub CTA

**Files:**
- Modify: `src/site/CtaRow.tsx`
- Modify: `src/styles/site-shell.css`

**Interfaces:**
- Consumes: nothing.
- Produces: `CtaRow` renders primary pill + ghost link + note. Class `.ss-cta-ghost` exists in `site-shell.css`.

- [ ] **Step 1: Add the ghost link to CtaRow.tsx**

```tsx
/**
 * The one signup CTA — used by the landing hero, closing section, and
 * anywhere else on the site that asks for an account. Single source of the
 * beta note so the string can't drift between call sites. The ghost link is
 * the research-pattern secondary: visually lighter, pointing at the public
 * engine repo.
 */
export function CtaRow() {
  return (
    <div className="ss-cta-row">
      <a className="ss-cta" href="/signup">
        create an account
      </a>
      <a className="ss-cta-ghost" href="https://github.com/anthonysuherli/delapan-be">
        view the engine on github
      </a>
      <span className="ss-cta-note">free · invite-gated beta</span>
    </div>
  );
}
```

- [ ] **Step 2: Add `.ss-cta-ghost` to site-shell.css**

Insert directly after the `.ss-cta:hover` rule (keeps the cta family together):

```css
/* the quiet secondary — hairline pill, ink text, no fill */
.ss-cta-ghost {
  display: inline-block;
  padding: var(--p8-space-2) var(--p8-space-5);
  border: 1px solid var(--p8-line);
  color: var(--p8-ink);
  border-radius: var(--p8-radius-pill);
  text-decoration: none;
  font-size: var(--p8-text-sm);
  font-weight: 500;
  transition: border-color var(--p8-dur-fast) var(--p8-ease);
}

.ss-cta-ghost:hover {
  border-color: var(--p8-ink);
}
```

- [ ] **Step 3: Verify build and tests (literal-scan covers site-shell.css)**

Run: `npm run build && npm run test`
Expected: PASS — every value above resolves through a token, so the literal scan stays green.

- [ ] **Step 4: Commit**

```bash
git add src/site/CtaRow.tsx src/styles/site-shell.css
git commit -m "feat: quiet secondary CTA to the public engine repo"
```

---

### Task 4: SupersedeChain component (TDD)

**Files:**
- Create: `src/landing/supersedeChain.test.ts`
- Create: `src/landing/SupersedeChain.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: `export function SupersedeChain(): JSX.Element` — no props. Root SVG carries `className="lp-sc"` and `aria-hidden="true"`. Task 5 renders it and styles every `lp-sc-*` class.

- [ ] **Step 1: Write the failing test**

`src/landing/supersedeChain.test.ts` (must be `.ts`, not `.tsx` — vitest's include is `src/**/*.test.ts` and the env is node, hence `createElement` + `renderToStaticMarkup`):

```ts
/**
 * The hero animation's contract: hidden from AT (the h1 + lede are the text
 * alternative), tells the whole resolution story in its labels, and carries
 * no inline paint — colors resolve through .lp-sc-* classes in landing.css
 * so the literal-scan gate governs them.
 */
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { SupersedeChain } from "./SupersedeChain";

const html = renderToStaticMarkup(createElement(SupersedeChain));

describe("SupersedeChain", () => {
  it("is hidden from the accessibility tree", () => {
    expect(html).toContain('aria-hidden="true"');
  });

  it("names the provenance fields and every resolver op", () => {
    for (const label of [
      "grounded_in",
      "add",
      "update",
      "noop",
      "supersede",
      "invalidated_at",
      "superseded_by",
    ]) {
      expect(html, `missing label: ${label}`).toContain(label);
    }
  });

  it("carries no inline paint — landing.css owns every colour", () => {
    expect(html).not.toMatch(/fill="/);
    expect(html).not.toMatch(/stroke="/);
    expect(html).not.toMatch(/style="/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/landing/supersedeChain.test.ts`
Expected: FAIL — cannot resolve `./SupersedeChain`.

- [ ] **Step 3: Write the component**

`src/landing/SupersedeChain.tsx`:

```tsx
/**
 * The hero's product visual: write-time resolution as a ~10s CSS loop —
 * a grounded finding, a contradicting candidate, the resolver landing on
 * supersede, the old fact retired in place (never deleted). Pure SVG,
 * animated entirely by landing.css keyframes: no timers, no state, no
 * inline paint. Base styles are the FINAL frame, so prefers-reduced-motion
 * (animation: none) shows the resolved state statically for free.
 */
export function SupersedeChain() {
  return (
    <svg
      className="lp-sc"
      aria-hidden="true"
      viewBox="0 0 340 220"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* source glyph, and the hairline that grounds fact A in it */}
      <g className="lp-sc-appear">
        <rect className="lp-sc-src" x="16" y="16" width="14" height="14" rx="2" />
        <text className="lp-sc-label" x="38" y="27">
          source
        </text>
        <line className="lp-sc-rule" x1="23" y1="34" x2="23" y2="76" />
        <text className="lp-sc-label" x="31" y="60">
          grounded_in
        </text>
      </g>

      {/* fact A — the incumbent; dims and takes the stamp at supersede time */}
      <g className="lp-sc-fact-a">
        <rect className="lp-sc-card" x="16" y="80" width="150" height="56" rx="6" />
        <rect className="lp-sc-line" x="28" y="94" width="110" height="6" rx="3" />
        <rect className="lp-sc-line" x="28" y="108" width="86" height="6" rx="3" />
      </g>
      <text className="lp-sc-stamp" x="28" y="130">
        invalidated_at
      </text>

      {/* fact B — the candidate; slides in from the right */}
      <g className="lp-sc-fact-b">
        <rect className="lp-sc-card lp-sc-card-new" x="188" y="80" width="136" height="56" rx="6" />
        <rect className="lp-sc-line" x="200" y="94" width="100" height="6" rx="3" />
        <rect className="lp-sc-line" x="200" y="108" width="84" height="6" rx="3" />
      </g>

      {/* the supersede pointer, old -> new */}
      <g className="lp-sc-link">
        <line className="lp-sc-rule" x1="166" y1="108" x2="188" y2="108" />
        <text className="lp-sc-label" x="112" y="156">
          superseded_by
        </text>
      </g>

      {/* resolver row — ticks through the ops, lands on supersede */}
      <g className="lp-sc-resolver">
        <text className="lp-sc-op lp-sc-op-add" x="16" y="196">
          add
        </text>
        <text className="lp-sc-op lp-sc-op-update" x="58" y="196">
          update
        </text>
        <text className="lp-sc-op lp-sc-op-noop" x="122" y="196">
          noop
        </text>
        <text className="lp-sc-op lp-sc-op-supersede" x="172" y="196">
          supersede
        </text>
      </g>
    </svg>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/landing/supersedeChain.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Verify full build and suite**

Run: `npm run build && npm run test`
Expected: PASS. (The component is not yet rendered anywhere; that's Task 5. `noUnusedLocals` does not flag unimported modules, only unused bindings inside files.)

- [ ] **Step 6: Commit**

```bash
git add src/landing/SupersedeChain.tsx src/landing/supersedeChain.test.ts
git commit -m "feat: SupersedeChain — the hero's write-time-resolution visual, geometry only"
```

---

### Task 5: Hero swap — render SupersedeChain, delete MarkField, animate in CSS

**Files:**
- Modify: `src/landing/Hero.tsx`
- Delete: `src/site/MarkField.tsx`, `src/site/markFieldCells.ts`, `src/site/markFieldCells.test.ts`
- Modify: `src/styles/landing.css`

**Interfaces:**
- Consumes: `SupersedeChain` from Task 4 (`import { SupersedeChain } from "./SupersedeChain";`).
- Produces: final hero markup — `.lp-hero` grid with `.lp-hero-copy` and `.lp-hero-visual` children.

- [ ] **Step 1: Rewrite Hero.tsx**

```tsx
/**
 * Hero. Problem-first, and the promise is one the shipped code keeps: findings
 * carry grounded_in, and the write-time resolver retires rather than deletes.
 * Two columns: the claim on the left, SupersedeChain showing it on the right.
 * Nav lives in SiteShell — this is just header + cta + visual.
 */
import { CtaRow } from "../site/CtaRow";
import { SupersedeChain } from "./SupersedeChain";

export function Hero() {
  return (
    <header className="lp-inner lp-hero">
      <div className="lp-hero-copy">
        <h1>where did your agent learn that?</h1>
        <p className="lp-lede">
          delapan researches a domain once, keeps every fact with the source it came from, and
          corrects itself when the facts move — without ever losing what it knew before.
        </p>
        <CtaRow />
      </div>
      <div className="lp-hero-visual">
        <SupersedeChain />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Delete the orphaned MarkField family**

```bash
git rm src/site/MarkField.tsx src/site/markFieldCells.ts src/site/markFieldCells.test.ts
```

Then verify nothing else references it:
Run: `grep -rn "MarkField\|markFieldCells\|mf-field\|mf-cell\|mf-ink\|mf-coral" src/`
Expected: hits only in `src/styles/landing.css` (removed in the next step).

- [ ] **Step 3: Rework landing.css — header comment, hero grid, `.lp-sc-*`, drop `.mf-*`**

3a. Replace the file's header comment (lines 1–8) with:

```css
/* the public landing page, restaged on the pixel-8 brand. Hairlines, and one
   moving thing: the hero's SupersedeChain loop — write-time resolution told
   in ~10s of quiet CSS keyframes (reduced-motion gets its final frame
   statically). Nothing else moves unbidden. Selectors are bare `.lp-*` —
   scoping comes from rendering only inside SiteShell's `.lp` wrapper, not
   from a `.site .lp*` compound selector. every color/spacing/radius/font
   value below resolves through a --p8-* token (site.css). Breakpoints/
   measures (ch, px grid max, px breakpoints) stay raw — structural, not
   brand-scale, same convention as site-shell.css. */
```

3b. Replace the `.lp-hero` and `.lp-hero-copy` rules (the paint-order comment about `.mf-field` goes away with it):

```css
.lp-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 400px);
  gap: var(--p8-space-7);
  align-items: center;
  padding: var(--p8-space-9) 0;
}
```

(`.lp-hero-copy { position: relative; }` is deleted — it existed only to out-paint the absolutely-positioned `.mf-field`.)

3c. Delete the entire "generative mark field" block: `.mf-field`, `.mf-cell`, `.mf-ink`, `.mf-coral`, `@keyframes dlpn-cellfade`, `@keyframes mf-breathe`, and both trailing comments.

3d. Insert the SupersedeChain block where the mark-field block was:

```css
/* --- supersede chain (hero visual) -------------------------------------------
   Base styles are the FINAL frame — resolved, superseded, stamped — and the
   keyframes replay the story over a shared 10s clock (fade-outs at 96-100%
   soften the loop restart). reduced-motion turns animation off and lands on
   the base styles, i.e. the finished state. */

.lp-sc {
  width: 100%;
  height: auto;
}

.lp-sc text {
  font-family: var(--p8-font-mono);
  font-size: 10px;
}

.lp-sc-label {
  fill: var(--p8-muted);
}

.lp-sc-src {
  fill: var(--p8-accent);
}

.lp-sc-rule {
  stroke: var(--p8-line);
  stroke-width: 1;
}

.lp-sc-card {
  fill: var(--p8-panel);
  stroke: var(--p8-line);
  stroke-width: 1;
}

.lp-sc-card-new {
  stroke: var(--p8-accent);
}

.lp-sc-line {
  fill: var(--p8-line);
}

.lp-sc-stamp {
  fill: var(--p8-warning);
}

.lp-sc-op {
  fill: var(--p8-muted-2);
}

.lp-sc-op-supersede {
  fill: var(--p8-accent);
  font-weight: 600;
}

/* choreography — every animation runs on the same 10s infinite clock */
.lp-sc-appear {
  animation: lp-sc-appear 10s var(--p8-ease) infinite;
}

.lp-sc-fact-a {
  opacity: 0.45;
  animation: lp-sc-retire 10s var(--p8-ease) infinite;
}

.lp-sc-fact-b {
  animation: lp-sc-arrive 10s var(--p8-ease) infinite;
}

.lp-sc-stamp,
.lp-sc-link {
  animation: lp-sc-late 10s var(--p8-ease) infinite;
}

.lp-sc-op-add {
  animation: lp-sc-tick-add 10s step-end infinite;
}

.lp-sc-op-update {
  animation: lp-sc-tick-update 10s step-end infinite;
}

.lp-sc-op-noop {
  animation: lp-sc-tick-noop 10s step-end infinite;
}

.lp-sc-op-supersede {
  animation: lp-sc-tick-supersede 10s step-end infinite;
}

@keyframes lp-sc-appear {
  0% { opacity: 0; }
  8%, 96% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes lp-sc-retire {
  0% { opacity: 0; }
  8%, 55% { opacity: 1; }
  62%, 96% { opacity: 0.45; }
  100% { opacity: 0; }
}

@keyframes lp-sc-arrive {
  0%, 15% { opacity: 0; transform: translateX(16px); }
  25%, 96% { opacity: 1; transform: translateX(0); }
  100% { opacity: 0; }
}

@keyframes lp-sc-late {
  0%, 58% { opacity: 0; }
  66%, 96% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes lp-sc-tick-add {
  0%, 30% { fill: var(--p8-muted-2); }
  30.1%, 35% { fill: var(--p8-ink); }
  35.1%, 100% { fill: var(--p8-muted-2); }
}

@keyframes lp-sc-tick-update {
  0%, 35% { fill: var(--p8-muted-2); }
  35.1%, 40% { fill: var(--p8-ink); }
  40.1%, 100% { fill: var(--p8-muted-2); }
}

@keyframes lp-sc-tick-noop {
  0%, 40% { fill: var(--p8-muted-2); }
  40.1%, 45% { fill: var(--p8-ink); }
  45.1%, 100% { fill: var(--p8-muted-2); }
}

@keyframes lp-sc-tick-supersede {
  0%, 45% { fill: var(--p8-muted-2); }
  45.1%, 100% { fill: var(--p8-accent); }
}
```

3e. In the `@media (max-width: 768px)` block, replace `.mf-field { display: none; }` with the stacked hero:

```css
.lp-hero {
  grid-template-columns: 1fr;
  gap: var(--p8-space-6);
}
```

(Grid auto-placement puts `.lp-hero-visual` after `.lp-hero-copy` — the spec's "animation below the copy on mobile".)

3f. Replace the reduced-motion block at the end of the file:

```css
/* --- reduced motion: no loop — base styles are the resolved final frame ------- */

@media (prefers-reduced-motion: reduce) {
  .lp-sc,
  .lp-sc * {
    animation: none;
  }
}
```

- [ ] **Step 4: Verify build and full suite**

Run: `npm run build && npm run test`
Expected: PASS — no unused imports (MarkField gone from Hero), literal-scan green (all `.lp-sc-*` values are tokens; `font-size: 10px` and `stroke-width: 1` are not in the scanned literal classes), markFieldCells tests gone with their subject.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: hero shows the supersede chain — MarkField retired with its cells"
```

---

### Task 6: Browser verification

**Files:** none (verification only).

**Interfaces:**
- Consumes: everything above.
- Produces: evidence the page works — screenshots/console check.

- [ ] **Step 1: Start the dev server and load the landing page**

Start the `dev` server (port 5173) and open `/`. Confirm zero console errors.

- [ ] **Step 2: Eyeball the animation loop**

Watch one full ~10s cycle: fact A + source appear → fact B slides in → ops tick add/update/noop → supersede holds → A dims with `invalidated_at`, `superseded_by` rule appears → soft restart. Confirm it reads as instrument-quiet, not flashy.

- [ ] **Step 3: Reduced motion**

Emulate `prefers-reduced-motion: reduce` (browser devtools rendering settings). Expected: no motion at all; the SVG statically shows the final resolved state (A dimmed + stamped, B current, supersede highlighted).

- [ ] **Step 4: Mobile layout**

At 375px width: hero stacks copy-then-visual, no horizontal scroll anywhere on the page, section rhythm intact, CTA row wraps cleanly with the new ghost link.

- [ ] **Step 5: Sections & numbering**

Confirm the page has 5 numbered sections (01 the problem → 05 where it fits), no video section, and the trimmed copy reads correctly.

- [ ] **Step 6: Screenshot evidence**

Capture desktop hero (mid-animation and final frame) and the 375px stacked hero for the session record.

---

## Self-Review (done at write time)

- **Spec coverage:** §1 hero animation → Tasks 4+5; §2 Resolution retirement → Task 2; §3 copy trims → Task 1 (all six rows; ClosingCta explicitly unchanged); §4 CTA → Task 3; §5 verification → every task's build/test steps + Task 6. MarkField deletion (spec §1) → Task 5.
- **Placeholder scan:** all code steps carry complete code; no TBDs.
- **Type consistency:** `SupersedeChain` takes no props everywhere it appears; class names `lp-sc-*` match between Task 4 TSX and Task 5 CSS (`lp-sc`, `lp-sc-appear`, `lp-sc-fact-a/b`, `lp-sc-card`, `lp-sc-card-new`, `lp-sc-line`, `lp-sc-rule`, `lp-sc-src`, `lp-sc-label`, `lp-sc-stamp`, `lp-sc-link`, `lp-sc-resolver` (unstyled grouping), `lp-sc-op` + four op modifiers).
- **Known judgment call:** `text` font-size 10px in SVG user units scales with the viewBox — acceptable; the literal scan does not gate font sizes.
