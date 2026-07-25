# EG Design-Philosophy Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the delapan control panel into conformance with the EG design philosophy — brand color leaves the data channel, every color encoding gains a second channel, ambient alarm motion is removed, and the whole surface snaps to a 4px Bauhaus grid.

**Architecture:** Design tokens are re-layered into `--chrome-*` / `--data-*` / `--state-*` so a violation is visible in the variable name at the call site. A new `src/graph/encoding.ts` becomes the single source for the type→(color, glyph) pair, consumed by the canvas label renderer, the legend, and the inspector chips, so the mapping cannot drift across surfaces. A Vitest suite enforces the invariants the way the source guideline enforces its own with `assertNonAdditive`.

**Vision goals served:** *"A graph you can watch grow live"* and *"HITL decisions show their consequence first"* — this makes the surface those goals render on honest and readable. Respects the Non-Goal *"Not a greenfield dashboard."*

**Tech Stack:** React 18, TypeScript (strict), Vite 6, Zustand, sigma.js v3 / graphology, Vitest (node environment, no DOM). No CSS framework. **No new dependencies.**

**Spec:** `docs/truenorth/specs/2026-07-25-eg-guidelines-restyle-design.md`

## Global Constraints

- **No new dependency.** No `@sigma/node-square`, no WebGL node programs, no CSS framework.
- **`npm run build` is the type-check gate** (`tsc --noEmit && vite build`). It is strict: `noUnusedLocals` and `noUnusedParameters` mean an orphaned import or binding **fails the build**. Run it before claiming any task compiles.
- **Do not touch** `src/api/`, `src/state/`, `src/graph/graphStore.ts`, `src/graph/layout.ts`, or any mutation/undo path. This is a presentation change only.
- **Out of scope:** `src/styles/tracking.css`, `src/duet/`.
- **Never hard-code a hex in a component.** Every color reaches CSS through a token; every color reaches TS through `src/graph/encoding.ts`.
- **`type` is reserved by sigma** — it picks the render program. The domain entity type is `nodeType` on node attributes. Never conflate them.
- Tests live beside the code as `*.test.ts`, run under Vitest in a **`node` environment (no DOM)** — do not write tests that need `document` or `window`.
- There is no lint step and no formatter config. Match the surrounding style. Existing files use a terse module docstring at the top; keep that convention.

---

### Task 1: The encoding module and its invariants

The load-bearing task. Everything downstream imports from here.

**Files:**
- Create: `src/graph/encoding.ts`
- Test: `src/graph/encoding.test.ts`

**Interfaces:**
- Consumes: nothing (leaf module).
- Produces, relied on by Tasks 2–5:
  - `typeColor(type: string): string`
  - `typeGlyph(type: string): string`
  - `isRemainder(type: string): boolean`
  - `channelCount(): number`
  - `resetAssignments(): void` *(test-only helper; exported because Vitest module state persists across test cases in a file)*
  - `CHROME: readonly string[]`, `RING: readonly string[]`, `GLYPHS: readonly string[]`, `REST_COLOR: string`, `REST_GLYPH: string`

- [ ] **Step 1: Write the failing test**

Create `src/graph/encoding.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  CHROME,
  GLYPHS,
  REST_COLOR,
  REST_GLYPH,
  RING,
  channelCount,
  isRemainder,
  resetAssignments,
  typeColor,
  typeGlyph,
} from "./encoding";

beforeEach(() => resetAssignments());

describe("chrome never encodes data", () => {
  it("shares no hue between the chrome and data palettes", () => {
    const lower = (s: string) => s.toLowerCase();
    const chrome = new Set(CHROME.map(lower));
    for (const hue of RING) expect(chrome.has(lower(hue))).toBe(false);
    expect(chrome.has(lower(REST_COLOR))).toBe(false);
  });

  it("never returns a chrome hue for any type, known or unknown", () => {
    const chrome = new Set(CHROME.map((s) => s.toLowerCase()));
    const types = ["concept", "technology", "person", "company", "project"];
    for (let i = 0; i < 40; i++) types.push(`unknown-${i}`);
    for (const t of types) expect(chrome.has(typeColor(t).toLowerCase())).toBe(false);
  });
});

describe("the ring is capped and reports its remainder", () => {
  it("stays within the 8-channel cap", () => {
    expect(channelCount()).toBeLessThanOrEqual(8);
  });

  it("pushes overflow types onto the shared remainder channel", () => {
    const overflow: string[] = [];
    for (let i = 0; i < RING.length + 5; i++) overflow.push(`t-${i}`);
    overflow.forEach((t) => typeColor(t));
    const rest = overflow.filter(isRemainder);
    expect(rest.length).toBeGreaterThan(0);
    for (const t of rest) {
      expect(typeColor(t)).toBe(REST_COLOR);
      expect(typeGlyph(t)).toBe(REST_GLYPH);
    }
  });
});

describe("no channel is colour-only", () => {
  it("gives every ring slot a glyph", () => {
    expect(GLYPHS.length).toBe(RING.length);
  });

  it("uses a distinct glyph per channel, so none silently collapses", () => {
    const all = [...GLYPHS, REST_GLYPH];
    expect(new Set(all).size).toBe(all.length);
  });

  it("returns a non-empty glyph for every type", () => {
    for (const t of ["concept", "person", "wildcard", "another"]) {
      expect(typeGlyph(t).length).toBeGreaterThan(0);
    }
  });
});

describe("channel assignment is stable", () => {
  it("keeps a type on the same channel across repeated lookups", () => {
    const first = typeColor("technology");
    const glyph = typeGlyph("technology");
    for (let i = 0; i < 5; i++) {
      expect(typeColor("technology")).toBe(first);
      expect(typeGlyph("technology")).toBe(glyph);
    }
  });

  it("does not hand a known type's slot to an unknown one", () => {
    const known = new Set(
      ["concept", "technology", "person", "company", "project"].map(typeColor),
    );
    expect(known.has(typeColor("some-new-type"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test -- src/graph/encoding.test.ts
```

Expected: FAIL — `Failed to resolve import "./encoding"`.

- [ ] **Step 3: Write the module**

Create `src/graph/encoding.ts`:

```ts
/**
 * Type → visual channel mapping. Every type carries TWO channels: a hue and a
 * glyph. Hue alone fails the ~8% of men with a colour-vision deficiency, so the
 * glyph is the load-bearing channel and the hue is the fast one.
 *
 * The ring is CVD-safe and capped — any type past it falls onto a shared
 * remainder channel that the legend reports rather than silently truncating.
 *
 * Invariants live in encoding.test.ts. This module is the single source for the
 * pair; canvas, legend, and inspector all read it so they cannot drift apart.
 */

export interface TypeChannel {
  type: string;
  color: string;
  glyph: string;
}

/** Brand chrome. Illegal in a data channel — asserted in encoding.test.ts. */
export const CHROME: readonly string[] = ["#b45309", "#d97706"];

/**
 * CVD-safe categorical ring, Okabe-Ito where usable on light paper.
 * Okabe-Ito orange (#E69F00) and vermillion (#D55E00) are excluded: they
 * collide with chrome amber. Yellow (#F0E442) is excluded: illegible on #f5f7fa.
 */
export const RING: readonly string[] = [
  "#0072B2", // blue
  "#009E73", // bluish green
  "#CC79A7", // reddish purple
  "#762A83", // purple
  "#0E7490", // teal
  "#56B4E9", // sky blue
];

export const GLYPHS: readonly string[] = ["■", "▲", "●", "◆", "▬", "◇"];

/** The shared overflow channel. Reported by the legend, never silent. */
export const REST_COLOR = "#8595a9";
export const REST_GLYPH = "○";

/** Fixed slots, so the panel looks the same on every boot. */
const BASE_SLOT: Record<string, number> = {
  concept: 0,
  technology: 1,
  person: 2,
  company: 3,
  project: 4,
};

const REMAINDER = -1;

const assigned = new Map<string, number>();
let nextSlot = Object.keys(BASE_SLOT).length;

function slotOf(type: string): number {
  const base = BASE_SLOT[type];
  if (base !== undefined) return base;
  let slot = assigned.get(type);
  if (slot === undefined) {
    slot = nextSlot < RING.length ? nextSlot++ : REMAINDER;
    assigned.set(type, slot);
  }
  return slot;
}

export function typeColor(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_COLOR : RING[slot]!;
}

export function typeGlyph(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_GLYPH : GLYPHS[slot]!;
}

/** True when this type shares the overflow channel — the legend must say so. */
export function isRemainder(type: string): boolean {
  return slotOf(type) === REMAINDER;
}

/** Total distinct channels, remainder included. Capped at 8 by the guideline. */
export function channelCount(): number {
  return RING.length + 1;
}

/** Test-only: Vitest keeps module state across cases in a file. */
export function resetAssignments(): void {
  assigned.clear();
  nextSlot = Object.keys(BASE_SLOT).length;
}
```

- [ ] **Step 4: Run the tests and make sure they pass**

```bash
npm run test -- src/graph/encoding.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/graph/encoding.ts src/graph/encoding.test.ts
git commit -m "feat(encoding): CVD-safe type channels with a glyph as second encoding"
```

---

### Task 2: Re-layer the tokens, rewire `colors.ts`

**Files:**
- Modify: `src/styles/tokens.css` (full rewrite, 44 lines)
- Modify: `src/graph/colors.ts` (drop `BASE_COLORS` + `FALLBACK_RING`, re-export from `encoding.ts`)
- Test: `src/graph/encoding.test.ts` (append a drift guard)

**Interfaces:**
- Consumes: everything Task 1 produces.
- Produces: `src/graph/colors.ts` continues to export `typeColor`, `lighten`, `DIM_NODE`, `DIM_EDGE`, `EDGE_COLOR`, `ACCENT`, `VISITED_MIX` — **unchanged signatures**, so the four existing import sites keep working untouched.

- [ ] **Step 1: Write the failing drift test**

The hexes now live in two places — `encoding.ts` (for TS) and `tokens.css` (for CSS). Append to `src/graph/encoding.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("tokens.css mirrors the module", () => {
  const css = readFileSync(join(__dirname, "../styles/tokens.css"), "utf8");

  it("declares one --data-N token per ring slot, in order", () => {
    RING.forEach((hue, i) => {
      const declared = new RegExp(`--data-${i + 1}:\\s*${hue};`, "i").test(css);
      expect(declared, `--data-${i + 1} should be ${hue}`).toBe(true);
    });
  });

  it("declares the remainder channel", () => {
    expect(new RegExp(`--data-rest:\\s*${REST_COLOR};`, "i").test(css)).toBe(true);
  });

  it("keeps chrome amber out of every --data-* token", () => {
    const dataTokens = [...css.matchAll(/--data-[\w-]+:\s*([^;]+);/g)].map((m) =>
      m[1]!.trim().toLowerCase(),
    );
    expect(dataTokens.length).toBeGreaterThan(0);
    for (const hue of CHROME) expect(dataTokens).not.toContain(hue.toLowerCase());
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test -- src/graph/encoding.test.ts
```

Expected: FAIL — `--data-1 should be #0072B2` is `false` (tokens.css has no `--data-*` yet).

- [ ] **Step 3: Rewrite `src/styles/tokens.css`**

Replace the whole file:

```css
/* delapan control panel — design tokens
   daylight instrument-panel: cool paper, hairline rules, amber annunciators.
   Ink/accent pairs hold WCAG contrast on --bg0: --text ~13:1, --text-dim ~5:1,
   --chrome-accent (amber-700) ~4.6:1; --text-faint is decorative-only.

   THREE LAYERS, and the prefix is the rule:
     --chrome-*  brand. Top bar, active markers, selection ring. NEVER data.
     --data-*    categorical channels. Paired with a glyph in graph/encoding.ts.
     --state-*   coverage banding only. Never decoration.
   A --chrome-* token on a data surface is a bug; encoding.test.ts enforces it. */

:root {
  /* type */
  --font-display: "Big Shoulders Display", "Arial Narrow", sans-serif;
  --font-mono: "IBM Plex Mono", "SFMono-Regular", Menlo, monospace;
  --font-body: "IBM Plex Sans", "Helvetica Neue", sans-serif;

  /* surfaces */
  --bg0: #f5f7fa;
  --bg1: #eef1f6;
  --bg2: #e6ebf2;
  --bg3: #dce3ed;
  --line: #d3dbe6;
  --line-bright: #b7c3d4;

  /* ink */
  --text: #1f2b3a;
  --text-dim: #55677c;
  --text-faint: #8595a9;
  --text-canvas: #465a70; /* sigma label ink */

  /* chrome — brand only, never a data encoding */
  --chrome-accent: #b45309;
  --chrome-accent-bright: #d97706;
  --chrome-accent-dim: rgba(180, 83, 9, 0.1);
  --chrome-accent-deep: #92400e;
  --chrome-accent-pale: #fbbf6e;

  /* legacy aliases — 44 existing call sites; new code uses --chrome-* */
  --accent: var(--chrome-accent);
  --accent-bright: var(--chrome-accent-bright);
  --accent-dim: var(--chrome-accent-dim);

  /* data — CVD-safe categorical ring, mirrors RING in graph/encoding.ts.
     Okabe-Ito orange/vermillion excluded (collide with chrome amber);
     yellow excluded (illegible on --bg0). Capped: overflow → --data-rest. */
  --data-1: #0072B2;
  --data-2: #009E73;
  --data-3: #CC79A7;
  --data-4: #762A83;
  --data-5: #0E7490;
  --data-6: #56B4E9;
  --data-rest: #8595a9;

  /* state — coverage banding, always paired with a glyph + text label */
  --state-rich: #15803d;
  --state-sparse: #b45309;
  --state-gap: #dc2626;

  /* legacy aliases for the coverage trio */
  --rich: var(--state-rich);
  --sparse: var(--state-sparse);
  --gap: var(--state-gap);

  /* signals */
  --green: #15803d;
  --red: #dc2626;
  --cyan: #0e7490;
  --focus: #2283e2;

  /* geometry — 4px base unit; every gap/pad is a multiple */
  --u: 4px;
  --u2: 8px;
  --u3: 12px;
  --u4: 16px;
  --u6: 24px;
  --u8: 32px;

  --rail-w: 268px;
  --inspector-w: 336px;
  --topbar-h: 48px;
  --statusbar-h: 28px;
  --radius: 4px;
}
```

Note `--state-sparse` intentionally holds the same hex as chrome amber. That is not a violation — the coverage band is dual-encoded with a glyph and a text label (Task 5), and the token name says which layer owns it. The test only forbids chrome hexes inside `--data-*`.

- [ ] **Step 4: Rewire `src/graph/colors.ts`**

Replace the whole file:

```ts
/**
 * Canvas colour constants. The type→channel mapping lives in ./encoding — this
 * module re-exports typeColor so existing import sites keep working, and owns
 * only the non-categorical canvas colours.
 */

export { typeColor, typeGlyph, isRemainder } from "./encoding";

export const DIM_NODE = "#d8e0ea";
export const DIM_EDGE = "#e6ebf2";
export const EDGE_COLOR = "#b3bfcf";

/** Chrome, used on canvas for the SELECTION RING only — never as a data hue. */
export const ACCENT = "#b45309";

export const VISITED_MIX = 0.45;

/** Mix a hex color toward white (amount 0..1) — used for the explored tint. */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
```

- [ ] **Step 5: Run the tests and the type-check**

```bash
npm run test && npm run build
```

Expected: tests PASS (12 now), build PASS. If the build reports an unused import in `LeftRail.tsx` or `Inspector.tsx`, do **not** delete the import — those files still call `typeColor`, and the re-export keeps them valid. An error here means the re-export line is wrong.

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/graph/colors.ts src/graph/encoding.test.ts
git commit -m "refactor(tokens): split into chrome/data/state layers, amber leaves the data channel"
```

---

### Task 3: Render the glyph on the canvas

**Files:**
- Modify: `src/graph/canvasDraw.ts` (whole file, 59 lines)
- Modify: `src/graph/GraphCanvas.tsx` (pass `nodeType` through to the label renderer)

**Interfaces:**
- Consumes: `typeGlyph` from `../graph/encoding`.
- Produces: nothing new; `drawNodeLabel` / `drawNodeHover` keep their sigma-required signatures.

Sigma passes the node's *display* data to the label renderer, which does not include our custom `nodeType`. `drawNodeLabel` therefore reads it off the same object — sigma's `nodeReducer` output is spread into display data, so returning `nodeType` from the reducer makes it available here.

- [ ] **Step 1: Widen the label data type and draw the glyph**

Replace `src/graph/canvasDraw.ts`:

```ts
/**
 * Custom 2D-canvas draw functions for sigma labels/hover — the hover card is
 * tinted to the instrument-panel theme instead of sigma's stock styling.
 *
 * The label carries the node's TYPE GLYPH before its text. That glyph is the
 * second encoding channel: hue alone fails colour-vision-deficient readers.
 */

import type { Attributes } from "graphology-types";
import type { Settings } from "sigma/settings";
import type { NodeDisplayData, PartialButFor } from "sigma/types";
import { typeGlyph } from "./encoding";

type LabelData = PartialButFor<NodeDisplayData, "x" | "y" | "size" | "label" | "color"> & {
  nodeType?: string;
};

const INK = "#465a70";
const INK_STRONG = "#1f2b3a";
const CARD_FILL = "rgba(255, 255, 255, 0.95)";
const GLYPH_GAP = 4;

/** "▲ label", or just "label" when the node has no type. */
function withGlyph(data: LabelData): string {
  const glyph = data.nodeType ? typeGlyph(data.nodeType) : "";
  return glyph ? `${glyph} ${data.label}` : String(data.label);
}

export function drawNodeLabel<N extends Attributes, E extends Attributes, G extends Attributes>(
  context: CanvasRenderingContext2D,
  data: LabelData,
  settings: Settings<N, E, G>,
): void {
  if (!data.label) return;
  const size = settings.labelSize;
  context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  context.fillStyle = INK;
  context.fillText(withGlyph(data), data.x + data.size + GLYPH_GAP + 1, data.y + size / 3);
}

export function drawNodeHover<N extends Attributes, E extends Attributes, G extends Attributes>(
  context: CanvasRenderingContext2D,
  data: LabelData,
  settings: Settings<N, E, G>,
): void {
  if (!data.label) return;
  const size = settings.labelSize;
  const text = withGlyph(data);
  context.font = `${settings.labelWeight} ${size}px ${settings.labelFont}`;
  const width = context.measureText(text).width;
  const x = data.x + data.size + GLYPH_GAP + 1;
  const y = data.y;
  const padX = 6;
  const padY = 5;

  context.beginPath();
  context.fillStyle = CARD_FILL;
  context.strokeStyle = data.color ?? INK;
  context.lineWidth = 1;
  const rx = x - padX;
  const ry = y - size / 2 - padY;
  const rw = width + padX * 2;
  const rh = size + padY * 2;
  const r = 3;
  context.moveTo(rx + r, ry);
  context.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
  context.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
  context.arcTo(rx, ry + rh, rx, ry, r);
  context.arcTo(rx, ry, rx + rw, ry, r);
  context.closePath();
  context.fill();
  context.stroke();

  context.fillStyle = INK_STRONG;
  context.fillText(text, x, y + size / 3);
}
```

The two literal hexes that were inline (`"#465a70"`, `"#b45309"`) are now named constants at the top of the module, and the hover stroke falls back to ink rather than to chrome amber — a hover ring is not a brand surface.

- [ ] **Step 2: Pass `nodeType` through the reducer**

In `src/graph/GraphCanvas.tsx`, find the `nodeReducer` (starts at **line 62**). It returns a `Partial<NodeDisplayData>`. Add `nodeType` to every returned object so the label renderer can read it. The minimal edit is to spread it into the base return — locate the reducer's `return { ... }` statements and ensure each includes:

```ts
nodeType: data.nodeType,
```

If the reducer has a single return with conditional spreads, add the line once at the top level of the returned object literal. Do **not** change any other reducer field — selection, hover, and travel styling stay exactly as they are.

- [ ] **Step 3: Type-check**

```bash
npm run build
```

Expected: PASS. If `nodeType` is rejected as not assignable to `Partial<NodeDisplayData>`, cast the reducer's return with `as Partial<NodeDisplayData>` at that single site — sigma's display type is closed, and this is the documented way to carry an extra field to a custom renderer.

- [ ] **Step 4: Verify visually**

```bash
npm run dev
```

Open `http://localhost:5173`. Every node label must read as `<glyph> <name>` — e.g. `■ some-concept`. Hover a node: the card shows the same glyph. **Judgement call:** if the glyph is illegible noise at default zoom, fall back to a bracketed letter code (`[c]`, `[t]`) by changing `withGlyph` only — the rest of the plan is unaffected. Record which you chose in the commit message.

- [ ] **Step 5: Commit**

```bash
git add src/graph/canvasDraw.ts src/graph/GraphCanvas.tsx
git commit -m "feat(canvas): prefix node labels with the type glyph"
```

---

### Task 4: Glyphs in the legend and inspector chips, and report the remainder

`type-dot` is the shared swatch class, rendered at **four** sites: `LeftRail.tsx:161`, `LeftRail.tsx:218`, `Inspector.tsx:94`, `Inspector.tsx:313`. All four become a color + glyph mark.

**Files:**
- Modify: `src/panels/LeftRail.tsx` (lines 157–170 legend, line 216–218 chip)
- Modify: `src/panels/Inspector.tsx` (lines 94, 313)
- Modify: `src/styles/panels.css` (`.lr-legend*` block, lines 71–98; add `.type-mark`, `.lr-remainder`)

**Interfaces:**
- Consumes: `typeColor`, `typeGlyph`, `isRemainder` from `../graph/colors` (re-exported from `encoding.ts` in Task 2).
- Produces: CSS classes `.type-mark` and `.lr-remainder`, used only within this task.

- [ ] **Step 1: Add the glyph mark styles**

In `src/styles/panels.css`, immediately before `.lr-legend` (**line 71**), add:

```css
/* the type mark: hue + glyph. Never render one without the other — the glyph
   is what survives when hue collapses for a colour-vision-deficient reader. */
.type-mark {
  display: inline-block;
  min-width: 11px;
  font-size: 10px;
  line-height: 1;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.lr-remainder {
  margin-top: var(--u);
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}
```

- [ ] **Step 2: Update the legend**

In `src/panels/LeftRail.tsx`, change the import on **line 9**:

```ts
import { isRemainder, typeColor, typeGlyph } from "../graph/colors";
```

Replace the legend row swatch at **line 161**:

```tsx
<span className="type-mark" style={{ color: typeColor(type) }}>
  {typeGlyph(type)}
</span>
```

Then, immediately after the `.lr-legend` closing tag (after the `typeEntries.map(...)` block, around **line 170**), add the remainder report:

```tsx
{typeEntries.some(([type]) => isRemainder(type)) && (
  <div className="lr-remainder">
    {typeEntries.filter(([type]) => isRemainder(type)).length} further type(s) share the
    remainder channel
  </div>
)}
```

This is the guideline's "cap at N, always report the remainder" — never a silent truncation.

- [ ] **Step 3: Update the three remaining `type-dot` sites**

`LeftRail.tsx:218` (the drift-aware chip) — keep the drift branch, add the glyph:

```tsx
<span
  className="type-mark"
  style={{ color: drift ? "var(--red)" : typeColor(type) }}
>
  {drift ? "!" : typeGlyph(type)}
</span>
```

`Inspector.tsx:94` and `Inspector.tsx:313` — both are
`<span className="type-dot" style={{ background: typeColor(attrs.nodeType) }} />`. Replace each with:

```tsx
<span className="type-mark" style={{ color: typeColor(attrs.nodeType) }}>
  {typeGlyph(attrs.nodeType)}
</span>
```

Update the `Inspector.tsx` import on **line 9** to `import { typeColor, typeGlyph } from "../graph/colors";`.

- [ ] **Step 4: Type-check and verify**

```bash
npm run build && npm run dev
```

Expected: build PASS. In the browser, the left-rail legend, the schema chips, and both inspector headers must all show the **same glyph** for the same type as the canvas does. That consistency is the whole point of the shared module.

If `.type-dot` now has no remaining usages, delete its CSS rule — cleaning up orphans your own change created is the repo convention. Check first:

```bash
grep -rn "type-dot" src/
```

- [ ] **Step 5: Commit**

```bash
git add src/panels/LeftRail.tsx src/panels/Inspector.tsx src/styles/panels.css
git commit -m "feat(panels): dual-encode type chips and legend with glyphs, report the remainder"
```

---

### Task 5: Dual-encode the coverage band, tag provenance

**Files:**
- Modify: `src/panels/LeftRail.tsx` (coverage verdict block, lines 320–332)
- Modify: `src/panels/Inspector.tsx` (evidence sections at lines 143, 280; the ungrounded placeholder at line 492)
- Modify: `src/styles/panels.css` (add `.prov` and `.lr-verdict-glyph`)

**Interfaces:**
- Consumes: nothing new.
- Produces: CSS class `.prov`, reused in Task 6.

- [ ] **Step 1: Add the provenance tag style**

Append to `src/styles/panels.css`:

```css
/* honesty of materials: name what a figure IS. emitted = extracted from a real
   source; derived = computed from findings; projected = an estimate. */
.prov {
  font-family: var(--font-mono);
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
}

.lr-verdict-glyph {
  margin-right: var(--u);
}
```

- [ ] **Step 2: Glyph the coverage band**

In `src/panels/LeftRail.tsx`, the verdict block currently reads (**lines 322–329**):

```tsx
<div className={`lr-verdict-band ${state.coverage}`}>
  {state.coverage}
  <small>
    {state.coverage === "rich" && "KB can answer"}
    ...
```

Replace the band's opening so the verdict carries a glyph, and label the band as an estimate:

```tsx
<div className={`lr-verdict-band ${state.coverage}`}>
  <span className="lr-verdict-glyph">
    {state.coverage === "rich" ? "●" : state.coverage === "sparse" ? "▲" : "■"}
  </span>
  {state.coverage}
  <small>
    {state.coverage === "rich" && "KB can answer"}
    {state.coverage === "sparse" && "partial grounding"}
    {state.coverage === "gap" && "needs exploration"}
  </small>
  <span className="prov">projected</span>
</div>
```

`rich`/`sparse`/`gap` is currently green/amber/red — the textbook red-green CVD failure. It now reads from glyph and text as well as hue. `projected` is honest: the band is an embedding-similarity estimate, not a model output.

- [ ] **Step 3: Tag evidence provenance**

In `src/panels/Inspector.tsx`, both evidence headers (**lines 143 and 280**) read:

```tsx
Evidence <span className="sect-aux">{attrs.grounded_in.length} finding(s)</span>
```

Append the tag to each:

```tsx
Evidence <span className="sect-aux">{attrs.grounded_in.length} finding(s)</span>{" "}
<span className="prov">emitted</span>
```

And the ungrounded placeholder at **line 492**:

```tsx
return (
  <div className="placeholder">
    ungrounded — no evidence attached <span className="prov">unattributed</span>
  </div>
);
```

- [ ] **Step 4: Type-check and verify**

```bash
npm run build && npm run dev
```

Expected: build PASS. Run a coverage probe in the left rail; the verdict must show glyph + word + `PROJECTED`. Select a node with evidence; the header must show `EMITTED`.

- [ ] **Step 5: Commit**

```bash
git add src/panels/LeftRail.tsx src/panels/Inspector.tsx src/styles/panels.css
git commit -m "feat(panels): dual-encode the coverage band, tag figure provenance"
```

---

### Task 6: Get brand amber off the findings histogram

Violation 4 from the spec. `.fv-bar--verified i { background: var(--accent); }` puts the brand hue on a data mark, and the `VERIFIED_MIN = 0.9` threshold is legible only by hue.

**Files:**
- Modify: `src/styles/panels.css` (`.fv-bar--verified` at line 893; `.fv-hist` at line 865)
- Modify: `src/panels/FindingsView.tsx` (the `.fv-hist` container, lines 116–146)

**Interfaces:**
- Consumes: `VERIFIED_MIN` from `../findings/derive` — already imported at `FindingsView.tsx:10`.
- Produces: nothing downstream.

- [ ] **Step 1: Move the bar off chrome and add the threshold rule**

In `src/styles/panels.css`, replace `.fv-bar--verified i` (**line 893**):

```css
.fv-bar--verified i {
  background: var(--state-rich);
}
```

Then append, after `.fv-bar--muted i` (line 899):

```css
/* the VERIFIED_MIN boundary — a reference line that ENCODES A THRESHOLD, which
   is the only kind of rule the data-ink budget pays for. */
.fv-threshold {
  position: absolute;
  top: 0;
  bottom: 18px;
  width: 0;
  border-left: 1px dashed var(--line-bright);
  pointer-events: none;
}

.fv-threshold span {
  position: absolute;
  bottom: -16px;
  left: 2px;
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-faint);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}
```

- [ ] **Step 2: Render the rule**

In `src/panels/FindingsView.tsx`, inside the `.fv-hist` container, immediately before the closing `</div>` that follows the `fv-axis` block (**around line 145**), add:

```tsx
<div
  className="fv-threshold"
  style={{ left: `calc(12px + (100% - 24px) * ${VERIFIED_MIN})` }}
>
  <span>{VERIFIED_MIN.toFixed(2)} verified</span>
</div>
```

The `12px` / `24px` come from `.fv-hist { padding: 0 12px 18px; }` — the bars occupy the width between those paddings, so this lands the rule exactly on the 0.90 position of the data area.

- [ ] **Step 3: Type-check and verify**

```bash
npm run build && npm run dev
```

Expected: build PASS. Switch to the findings view. The verified bars must be **green, not amber**, and a dashed rule labelled `0.90 verified` must sit exactly at the left edge of the first verified bar. If the rule is visibly off, the padding constants in the `calc()` disagree with `.fv-hist` — re-read line 871 and match them.

- [ ] **Step 4: Commit**

```bash
git add src/panels/FindingsView.tsx src/styles/panels.css
git commit -m "fix(findings): brand amber off the histogram, threshold as a reference line"
```

---

### Task 7: Remove the ambient alarms

Calm technology: *never blinking, badging, autoplaying*. This applies to readers who have set **no** motion preference, so the `prefers-reduced-motion` block is not a defence.

**Files:**
- Modify: `src/styles/layout.css` (`.sb-dot` / `.sb-dot--mock` at lines 150–164, `@keyframes blink`)
- Modify: `src/styles/motion.css` (`.blink` at line 180, `body::after` grain at line 185, reduced-motion block at 191–214)
- Modify: `src/styles/canvas.css` (`pulse-glow` at line 185, `avatar-ring` at line 195)
- Modify: `src/styles/panels.css` (blink usage at line 161)

- [ ] **Step 1: Kill the status dots' blink**

In `src/styles/layout.css`, replace lines 150–164:

```css
.sb-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
}

.sb-dot--mock {
  background: var(--chrome-accent);
}
```

Both the `box-shadow` glow and the `animation` go. The dot already sits beside the words `live api` / `offline` in `StatusBar.tsx`, and `MOCK DATA` is already a text badge — the state was never carried by the blink. Then delete the now-unused `@keyframes blink` from this file.

- [ ] **Step 2: Remove the remaining loops**

- `src/styles/panels.css` **line 161**: delete the `animation: blink 2.4s ease-in-out infinite;` declaration from whichever rule holds it.
- `src/styles/motion.css` **lines 180–187**: delete the `.blink` rule and the `body::after { animation: dlpn-grain ... }` rule entirely, plus the `@keyframes dlpn-grain` definition and the `--grain-dur` variable if it has no other reader. The film grain is decorative ink — Tufte's first erasing principle.
- `src/styles/canvas.css` **lines 185 and 195**: remove the `animation:` declarations from the `pulse-glow` and `avatar-ring` rules, keeping the static ring/border they draw. Delete both `@keyframes` blocks.

**Keep** the one-shot boot motion — `.shell-scan`, `dlpn-rise`, `dlpn-slidein`, `dlpn-ring`. Those teach where something came from, which the guideline explicitly permits. **Keep** `.spin` in `base.css:242`: a loading spinner is a progress indicator, not ambient decoration.

- [ ] **Step 3: Trim the reduced-motion block**

In `src/styles/motion.css`, the block at lines 191–214 lists selectors that no longer animate. Remove the now-dead entries — `.blink`, `.sb-dot`, `.sb-dot--mock`, `body::after` — keeping `.lr-drift-note` and the one-shot boot entries. Do not remove the block itself.

- [ ] **Step 4: Verify nothing ambient survives**

```bash
grep -rn "infinite" src/styles/
```

Expected: exactly one hit — `base.css:242`, the `.spin` spinner. Any other hit is a missed alarm.

```bash
npm run build && npm run dev
```

Expected: build PASS. Watch the panel idle for 15 seconds: nothing may pulse, blink, or drift. The boot sweep on first load is expected and correct.

- [ ] **Step 5: Commit**

```bash
git add src/styles/layout.css src/styles/motion.css src/styles/canvas.css src/styles/panels.css
git commit -m "fix(motion): remove ambient alarm loops and the decorative film grain"
```

---

### Task 8: The Bauhaus pass — grid, hairlines, numerals, deference

**Files:**
- Modify: `src/styles/panels.css`, `src/styles/layout.css`, `src/styles/canvas.css`, `src/styles/base.css`

- [ ] **Step 1: Snap spacing to the grid**

Across the four files, replace literal `padding` / `margin` / `gap` pixel values with the `--u` scale: `4px`→`var(--u)`, `8px`→`var(--u2)`, `12px`→`var(--u3)`, `16px`→`var(--u4)`, `24px`→`var(--u6)`, `32px`→`var(--u8)`. Values that are **not** multiples of 4 (`7px`, `9px`, `11px`, `18px`, `2px`, `1px`, `3px`) round to the nearest multiple **only where it is a spacing value**. Leave hairline widths (`1px`, `2px`, `3px` borders), font sizes, and the fine-tuned `.fv-hist` padding of `18px` alone — that one is load-bearing for the threshold `calc()` in Task 6.

- [ ] **Step 2: Hairlines instead of shadows**

```bash
grep -rn "box-shadow" src/styles/
```

For each hit: if it is on a **surface** (rail, panel, tile, chip, bar), replace with `border: 1px solid var(--line);`. If it is on a genuinely **floating** layer — modal, toast, hover card, dropdown — keep it: there it encodes elevation rather than decorating. Also remove any `linear-gradient` / `radial-gradient` on a surface.

- [ ] **Step 3: Tabular numerals on every figure**

Add `font-variant-numeric: tabular-nums;` to every rule that renders a number: stat counters (`.lr-counter`), legend counts (already has it), findings counts, status-bar figures, axis labels. A quick way to find candidates:

```bash
grep -rn "font-family: var(--font-mono)" src/styles/
```

Mono figures without `tabular-nums` jitter as values change — the guideline requires it in **all** numeric displays.

- [ ] **Step 4: The rail recedes**

In `src/styles/layout.css`, change the left rail's surface to `--bg0` with a single hairline right rule instead of a filled panel background, so the canvas reads as the hero rather than one of three equal columns:

```css
background: var(--bg0);
border-right: 1px solid var(--line);
```

Find the rule by `grep -n "\.lr\b" src/styles/layout.css`. Do not change `--rail-w`.

- [ ] **Step 5: Flush left, and the last hard-coded hexes**

```bash
grep -rn "text-align: center" src/styles/
```

Remove each hit **except** on chart/axis titles (`.fv-axis` and any figure caption) — the guideline permits centering there and nowhere else.

```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/styles/ | grep -v tokens.css
```

Expected before: 7 hits (`#8595a9` ×3, `#b45309` ×2, `#92400e` ×2, `#fbbf6e`). Replace each with its token — `var(--text-faint)`, `var(--chrome-accent)`, `var(--chrome-accent-deep)`, `var(--chrome-accent-pale)` (the last two were added in Task 2 for exactly this). Expected after: **zero hits**.

- [ ] **Step 6: Verify**

```bash
npm run build && npm run test && npm run dev
```

Expected: build PASS, tests PASS. In the browser, confirm nothing has collapsed — the rail, inspector, canvas, findings view, and both modals must all still lay out correctly. Spacing changes are the easiest place in this plan to break a layout; look at every surface.

- [ ] **Step 7: Commit**

```bash
git add src/styles/
git commit -m "style(bauhaus): snap to the 4px grid, hairlines over shadows, tabular numerals"
```

---

### Task 9: Update the stale convention doc, and verify the whole spec

**Files:**
- Modify: `CLAUDE.md` (the "Conventions" section)

- [ ] **Step 1: Fix the drifted convention line**

`CLAUDE.md` currently says:

> The visual language is a dark "instrument panel": amber annunciators, IBM Plex Mono/Sans, Big Shoulders Display wordmark. Use the CSS variables in `tokens.css`; don't hard-code colors.

It has been **light** since `tokens.css` was written ("daylight instrument-panel: cool paper", `--bg0: #f5f7fa`). Replace with:

> The visual language is a daylight "instrument panel": cool paper, hairline rules, amber annunciators, IBM Plex Mono/Sans, Big Shoulders Display wordmark. Tokens live in `tokens.css` in three layers — `--chrome-*` (brand; never a data encoding), `--data-*` (CVD-safe categorical channels, always paired with a glyph from `src/graph/encoding.ts`), `--state-*` (coverage banding). Don't hard-code colors, and don't encode anything by hue alone — `src/graph/encoding.test.ts` enforces both.

Also add to the "Where things live" table:

> | Type colors **and glyphs** | `src/graph/encoding.ts` |

replacing the existing `| Type colors | src/graph/colors.ts |` row.

- [ ] **Step 2: Run every acceptance check from the spec**

```bash
npm run build && npm run test
```

Expected: build PASS, all tests PASS.

```bash
grep -rn "b45309\|d97706" src/graph/
```

Expected: hits only in `encoding.ts` (the `CHROME` constant, which exists to be excluded) and `colors.ts` (the `ACCENT` selection-ring constant). **No hit inside `RING`.**

```bash
grep -rn "infinite" src/styles/
```

Expected: exactly one hit — `.spin` in `base.css`.

```bash
grep -rn "#[0-9a-fA-F]\{6\}" src/styles/ | grep -v tokens.css
```

Expected: zero hits.

- [ ] **Step 3: Visual and CVD verification**

```bash
npm run dev
```

Capture screenshots of: the graph view, the findings view, the coverage probe with a result, and the inspector with a selected node. Then check the CVD requirement — the one that the whole dual-encoding argument rests on:

Open DevTools → Rendering → **Emulate vision deficiencies → Deuteranopia**. With hue collapsed, every node type must still be distinguishable **by glyph**, the coverage band must still be readable by glyph + word, and the findings histogram's verified region must still be identifiable by the dashed threshold rule's position. If any of these fails, the second channel is not doing its job — fix it before finishing.

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: correct the stale dark-theme convention, document the token layers"
```

---

## Self-review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 Token architecture (3 layers, grid, palette, `--focus`) | 2 |
| §2 `encoding.ts` single source | 1, and consumed in 3–4 |
| §3 Calm technology (loops, grain, keep one-shot) | 7 |
| §4 Honesty of materials (emitted/derived/projected, coverage glyph) | 5 |
| §5 Deference + Bauhaus (rail, hairlines, grid, numerals, flush-left, hexes) | 8 |
| §6 Enforcement (4 invariants) | 1, extended in 2 |
| Violation 1 (amber as data hue) | 2 |
| Violation 2 (color-only type) | 1, 3, 4 |
| Violation 3 (ambient alarms) | 7 |
| Violation 4 (amber on the histogram) | 6 |
| `CLAUDE.md` drift | 9 |
| Verification checks 1–6 | 9 |

No gaps.

**Type consistency:** `typeColor` / `typeGlyph` / `isRemainder` / `channelCount` / `resetAssignments` are defined in Task 1 and used under those exact names in Tasks 2, 3, 4. `CHROME` / `RING` / `GLYPHS` / `REST_COLOR` / `REST_GLYPH` are exported in Task 1 and consumed by the Task 2 drift test. `.type-mark` and `.prov` are defined in Tasks 4 and 5 before their use. `VERIFIED_MIN` is imported at `FindingsView.tsx:10` already.

**Known risks carried from the spec:**
- Glyph legibility at small canvas label size — decision point built into Task 3 Step 4, with the letter-code fallback specified.
- Task 8's spacing sweep is the most likely place to break a layout; its Step 6 requires checking every surface, not just one.
