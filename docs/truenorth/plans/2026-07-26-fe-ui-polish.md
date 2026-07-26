# delapan-fe UI Polish — Instrument-Grade Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the delapan-fe token system (effects, radius, z-index, motion, canvas colors), re-polish the graph shell + console/auth surfaces on that base, upgrade empty/loading/error states, and build the `enterNodes` motion primitive — all test-enforced.

**Architecture:** Additive token completion in `src/styles/tokens.css` + `src/styles/motion.css`, with the canvas palette moved behind the existing TS↔CSS mirror pattern (`src/graph/encoding.ts` ↔ `tokens.css`, drift-tested). Mechanical CSS migration follows, then component consolidation (`<Wordmark>`, `.auth-card`, `<Interstitial>`), then a pure-math enter-animation module driven by the existing rAF loop in `src/graph/motion.ts`. A literal-scan Vitest gate lands last, after migration, so it is born green.

**Vision goals served:** "A graph you can watch grow live" (enterNodes is the rendering half of the live delta stream); "Hosted public tier" (console/auth journey polish).

**Tech Stack:** React 18 + TypeScript strict, Vite 6, plain CSS (no framework), sigma.js v3 + graphology, Zustand, Vitest (node env, no DOM). **No new dependencies.**

**Spec:** `docs/truenorth/specs/2026-07-26-fe-ui-polish-design.md` (ratified 2026-07-26).

## Global Constraints

- Branch: create `design/ui-polish` off `feat/signup-path` (auth screens in scope live there). If `feat/signup-path` merges to `main` mid-work, rebase onto `main`.
- Light-only. No dark theme, no `prefers-color-scheme` additions.
- Out of scope — do NOT edit: `src/styles/tracking.css` (except nothing — leave whole file), `src/styles/landing.css`, `public/duet-app.html`, `src/landing/`, `src/tracking/TrackingApp.tsx`, `src/duet/`. (`src/tracking/SignInForm.tsx` IS in scope — it renders the in-scope auth screens.)
- Type gate: `npm run build` (runs `tsc --noEmit` then vite build). Strict: unused imports fail the build.
- Test gate: `npm run test` (vitest run, node env — no DOM, no rAF; pure logic only).
- Every new animation must be instant/absent under `prefers-reduced-motion: reduce`.
- Never introduce `Math.random()` into positioning (layout is deterministically seeded).
- Sigma gotcha: node attribute `type` is reserved by sigma; the domain type lives on `nodeType`.
- Spec invariant: enters slightly longer than exits; nothing interactive above 500ms.
- Match surrounding style; terse comments only where the code can't say it.

**Planned deviations from spec (agreed rationale, do not "fix"):**
1. Z-index bands: cross-surface bands become tokens; the *intra-canvas* stack in `canvas.css` (values 4–40, ordering overlays inside one surface) stays literal with a header comment and a literal-scan allowlist. Collapsing it to one token would destroy required ordering.
2. Console skeleton tiles: dropped — `ConsoleApp` renders statically from `TILES`; there is nothing to wait for.
3. Literal-scan covers hex/rgba colors, z-index, and px border-radius. Duration literals are not scanned (staggered `animation-delay` choreography makes a regex gate too noisy); durations are normalized by Task 9 and held by review.
4. Glow alpha ladder: existing alphas (.1/.12/.15/.25/.3/.45/.5) round to the 3-rung ladder (.1/.25/.45). Sub-perceptual nudges, accepted in brainstorming.
5. Connection-lost banner: already covered — `api.onApiModeChange` (store.ts:565) toasts "engine unreachable — switched to built-in mock data" and StatusBar shows the MOCK DATA badge. No new work.
6. Search keyboard navigation: TopBar search already implements ArrowDown/Enter result navigation (TopBar.tsx:158–175). No new work.
7. Spec §5 node exits (200ms fade-through-dim) and the edge-fade behind anchored enters were not implemented this pass; field-error timing shipped at --t-micro not 240ms. Deferred to spec 2 / backlog (final-review finding, recorded 2026-07-26).

---

### Task 1: Branch + token completion

**Files:**
- Modify: `src/styles/tokens.css` (append inside `:root`)
- Modify: `src/styles/motion.css:8-17` (`:root` block)
- Test: `src/styles/tokens.test.ts` (create)

**Interfaces:**
- Produces: CSS custom properties `--glow-1..3`, `--shadow-1..4`, `--shadow-drawer`, `--card-veil`, `--r-1`, `--r-2`, `--r-3`, `--r-pill`, `--z-search`, `--z-drawer`, `--z-modal`, `--z-toast`, `--z-boot`, `--t-micro`, `--t-press`, `--t-pop`, `--t-enter`, `--t-exit`, `--ease-out`. Every later CSS task consumes these exact names.

- [ ] **Step 1: Create the branch**

```bash
git checkout feat/signup-path && git checkout -b design/ui-polish
```

- [ ] **Step 2: Write the failing test**

Create `src/styles/tokens.test.ts`:

```ts
/**
 * The token scales exist and keep their contract shapes. Companion to
 * encoding.test.ts (which owns the data-palette mirror); this file owns the
 * effect/geometry/motion scales added by the 2026-07-26 UI-polish spec.
 */
import { describe, expect, it } from "vitest";
import tokensCss from "./tokens.css?raw";
import motionCss from "./motion.css?raw";

const has = (css: string, decl: RegExp) => decl.test(css);

describe("effect tokens", () => {
  it("declares the amber glow ladder as rgba colours", () => {
    for (const n of [1, 2, 3]) {
      expect(has(tokensCss, new RegExp(`--glow-${n}:\\s*rgba\\(180, 83, 9,`))).toBe(true);
    }
  });

  it("declares the four-step elevation scale plus the drawer directional", () => {
    for (const n of [1, 2, 3, 4]) {
      expect(has(tokensCss, new RegExp(`--shadow-${n}:`))).toBe(true);
    }
    expect(has(tokensCss, /--shadow-drawer:\s*-18px/)).toBe(true);
  });

  it("declares the card veil", () => {
    expect(has(tokensCss, /--card-veil:\s*rgba\(255, 255, 255, 0\.6\)/)).toBe(true);
  });
});

describe("geometry tokens", () => {
  it("declares the radius scale and aliases --radius onto it", () => {
    expect(has(tokensCss, /--r-1:\s*2px/)).toBe(true);
    expect(has(tokensCss, /--r-2:\s*4px/)).toBe(true);
    expect(has(tokensCss, /--r-3:\s*6px/)).toBe(true);
    expect(has(tokensCss, /--r-pill:\s*999px/)).toBe(true);
    expect(has(tokensCss, /--radius:\s*var\(--r-2\)/)).toBe(true);
  });

  it("declares the cross-surface z bands in ascending order", () => {
    const bands = ["--z-search", "--z-drawer", "--z-modal", "--z-toast", "--z-boot"];
    const values = bands.map((b) => {
      const m = tokensCss.match(new RegExp(`${b}:\\s*(\\d+);`));
      expect(m, `${b} must be declared as a bare integer`).not.toBeNull();
      return Number(m![1]);
    });
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });
});

describe("motion tokens", () => {
  it("declares the micro/press/pop/enter/exit durations", () => {
    expect(has(motionCss, /--t-micro:\s*120ms/)).toBe(true);
    expect(has(motionCss, /--t-press:\s*90ms/)).toBe(true);
    expect(has(motionCss, /--t-pop:\s*160ms/)).toBe(true);
    expect(has(motionCss, /--t-enter:\s*240ms/)).toBe(true);
    expect(has(motionCss, /--t-exit:\s*180ms/)).toBe(true);
  });

  it("keeps enters longer than exits (spec invariant)", () => {
    const ms = (name: string) => Number(motionCss.match(new RegExp(`${name}:\\s*(\\d+)ms`))![1]);
    expect(ms("--t-enter")).toBeGreaterThan(ms("--t-exit"));
  });

  it("declares the standard ease-out", () => {
    expect(has(motionCss, /--ease-out:\s*cubic-bezier\(0\.16, 1, 0\.3, 1\)/)).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/styles/tokens.test.ts`
Expected: FAIL — every `expect(...).toBe(true)` on undeclared tokens.

- [ ] **Step 4: Add the tokens**

In `src/styles/tokens.css`, replace the final geometry block (lines 81–94, from `/* geometry` through `--radius: 4px;`) with:

```css
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

  /* radius scale — 2/4/6/pill. --radius is a legacy alias for --r-2. */
  --r-1: 2px;
  --r-2: 4px;
  --r-3: 6px;
  --r-pill: 999px;
  --radius: var(--r-2);

  /* effects — amber annunciator glow (3-rung alpha ladder; chrome family,
     never data) and the neutral elevation scale. */
  --glow-1: rgba(180, 83, 9, 0.1);
  --glow-2: rgba(180, 83, 9, 0.25);
  --glow-3: rgba(180, 83, 9, 0.45);
  --shadow-1: 0 1px 3px rgba(31, 43, 58, 0.1);
  --shadow-2: 0 10px 30px rgba(31, 43, 58, 0.16);
  --shadow-3: 0 14px 40px rgba(31, 43, 58, 0.2);
  --shadow-4: 0 24px 80px rgba(31, 43, 58, 0.24);
  --shadow-drawer: -18px 0 50px rgba(31, 43, 58, 0.2);
  --card-veil: rgba(255, 255, 255, 0.6);

  /* z bands — cross-surface stacking only. The intra-canvas overlay stack
     (canvas.css, values 4–40) orders layers inside one surface and stays
     local. */
  --z-search: 60;
  --z-drawer: 70;
  --z-modal: 100;
  --z-toast: 200;
  --z-boot: 320;
```

In `src/styles/motion.css`, replace the `:root` block (lines 8–17) with:

```css
:root {
  --ease-mech: cubic-bezier(0.2, 0.9, 0.3, 1);
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --t-micro: 120ms; /* hover/color transitions */
  --t-press: 90ms; /* button active nudge */
  --t-pop: 160ms; /* modal / popover in */
  --t-enter: 240ms; /* drawer / toast / element enter */
  --t-exit: 180ms; /* element exit — always shorter than enter */
  --t-rise: 500ms; /* panel stagger-rise */
  --t-settle: 800ms; /* graph node settle-in (sigma) */
  --t-camera: 680ms; /* sigma camera ease on select */
  --t-ring: 1100ms; /* selection pulse ring */
  --t-count: 1100ms; /* counter 0→target tween */
  --t-scan: 1400ms; /* one-shot boot scan line */
  --t-step: 320ms; /* phase-log step slide-in */
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/styles/tokens.test.ts` → PASS. Then `npm run test` → all green (encoding tests unaffected: `--data-*`/`--chrome-*` untouched).

- [ ] **Step 6: Commit**

```bash
git add src/styles/tokens.css src/styles/motion.css src/styles/tokens.test.ts
git commit -m "feat(tokens): effect, radius, z-band, and motion scales"
```

---

### Task 2: Canvas palette into the TS↔CSS contract

**Files:**
- Modify: `src/graph/encoding.ts` (append `CANVAS`)
- Modify: `src/styles/tokens.css` (append `--canvas-*` block)
- Modify: `src/graph/colors.ts`, `src/graph/canvasDraw.ts:18-20`, `src/graph/GraphCanvas.tsx:51,55`
- Test: `src/graph/encoding.test.ts` (extend)

**Interfaces:**
- Produces: `export const CANVAS = { dimNode, dimEdge, edge, edgeLabel, ink, inkStrong, cardFill } as const` in `encoding.ts`. `colors.ts` re-exports keep their existing names (`DIM_NODE`, `DIM_EDGE`, `EDGE_COLOR`, `ACCENT`) so no import site changes.

- [ ] **Step 1: Write the failing test**

Append to `src/graph/encoding.test.ts` (add `CANVAS` to the existing import from `./encoding`):

```ts
describe("tokens.css mirrors the canvas palette", () => {
  const TOKEN_OF: Record<keyof typeof CANVAS, string> = {
    dimNode: "--canvas-dim-node",
    dimEdge: "--canvas-dim-edge",
    edge: "--canvas-edge",
    edgeLabel: "--canvas-edge-label",
    ink: "--canvas-ink",
    inkStrong: "--canvas-ink-strong",
    cardFill: "--canvas-card",
  };

  it("declares one --canvas-* token per CANVAS entry, byte-identical", () => {
    for (const [key, token] of Object.entries(TOKEN_OF)) {
      const value = CANVAS[key as keyof typeof CANVAS].replace(/[()]/g, "\\$&");
      const declared = new RegExp(`${token}:\\s*${value};`, "i").test(tokensCss);
      expect(declared, `${token} should be ${CANVAS[key as keyof typeof CANVAS]}`).toBe(true);
    }
  });

  it("keeps chrome amber out of the canvas palette", () => {
    const chrome = new Set(CHROME.map((s) => s.toLowerCase()));
    for (const value of Object.values(CANVAS)) {
      expect(chrome.has(value.toLowerCase())).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/graph/encoding.test.ts`
Expected: FAIL — `CANVAS` is not exported.

- [ ] **Step 3: Implement**

Append to `src/graph/encoding.ts`:

```ts
/**
 * Non-categorical canvas palette (dim states, edge stroke, label ink, hover
 * card). WebGL/2D-canvas cannot read CSS custom properties, so this module is
 * the source of truth and tokens.css carries a --canvas-* mirror —
 * encoding.test.ts enforces the two never drift.
 */
export const CANVAS = {
  dimNode: "#d8e0ea",
  dimEdge: "#e6ebf2",
  edge: "#b3bfcf",
  edgeLabel: "#67788c",
  ink: "#465a70",
  inkStrong: "#1f2b3a",
  cardFill: "rgba(255, 255, 255, 0.95)",
} as const;
```

Append to `src/styles/tokens.css` `:root` (after the z bands):

```css
  /* canvas — sigma/2D-canvas palette; mirrors CANVAS in graph/encoding.ts.
     The TS side is the source of truth (WebGL can't read custom props). */
  --canvas-dim-node: #d8e0ea;
  --canvas-dim-edge: #e6ebf2;
  --canvas-edge: #b3bfcf;
  --canvas-edge-label: #67788c;
  --canvas-ink: #465a70;
  --canvas-ink-strong: #1f2b3a;
  --canvas-card: rgba(255, 255, 255, 0.95);
```

Rewrite `src/graph/colors.ts` lines 9–14 (keep the header comment, `VISITED_MIX`, and `lighten` unchanged):

```ts
export { typeColor, typeGlyph, isRemainder } from "./encoding";

import { CANVAS, CHROME } from "./encoding";

export const DIM_NODE = CANVAS.dimNode;
export const DIM_EDGE = CANVAS.dimEdge;
export const EDGE_COLOR = CANVAS.edge;

/** Chrome, used on canvas for the SELECTION RING only — never as a data hue. */
export const ACCENT = CHROME[0]!;
```

In `src/graph/canvasDraw.ts`, replace lines 18–20:

```ts
import { CANVAS } from "./encoding";

const INK = CANVAS.ink;
const INK_STRONG = CANVAS.inkStrong;
const CARD_FILL = CANVAS.cardFill;
```

(Keep the existing `typeGlyph` import; merge into one import statement from `./encoding`.)

In `src/graph/GraphCanvas.tsx`, import `CANVAS` from `./encoding` and replace lines 51 and 55:

```ts
      labelColor: { color: CANVAS.ink },
      // …
      edgeLabelColor: { color: CANVAS.edgeLabel },
```

- [ ] **Step 4: Verify**

Run: `npx vitest run src/graph/encoding.test.ts` → PASS. `npm run build` → clean.

- [ ] **Step 5: Commit**

```bash
git add src/graph/encoding.ts src/graph/encoding.test.ts src/graph/colors.ts src/graph/canvasDraw.ts src/graph/GraphCanvas.tsx src/styles/tokens.css
git commit -m "feat(tokens): canvas palette joins the drift-tested TS<->CSS contract"
```

---

### Task 3: Migrate CSS to the effect/radius/z tokens

**Files:**
- Modify: `src/styles/canvas.css`, `src/styles/layout.css`, `src/styles/panels.css`, `src/styles/base.css`, `src/styles/motion.css`

**Interfaces:**
- Consumes: Task 1 tokens. Purely mechanical; no selector changes.

- [ ] **Step 1: Apply the swap table**

`src/styles/canvas.css` — add this header comment at the top of the file:

```css
/* z-index here is the INTRA-canvas overlay stack (vignette < frames < hint <
   reticle < avatar < hopkeys < relpop < hud): local ordering, deliberately
   literal. Cross-surface stacking uses the --z-* bands in tokens.css. */
```

then swap (line numbers from current file):

| Line | From | To |
|---|---|---|
| 62 | `box-shadow: 0 0 8px rgba(180, 83, 9, 0.25);` | `box-shadow: 0 0 8px var(--glow-2);` |
| 110 | `box-shadow: 0 0 16px rgba(180, 83, 9, 0.15);` | `box-shadow: 0 0 16px var(--glow-1);` |
| 192 | `border: 1px solid rgba(180, 83, 9, 0.5);` | `border: 1px solid var(--glow-3);` |
| 213 | `border-radius: 4px;` | `border-radius: var(--r-2);` |
| 227 | `box-shadow: 0 0 10px rgba(180, 83, 9, 0.45);` | `box-shadow: 0 0 10px var(--glow-3);` |
| 241 | `border-radius: 6px;` | `border-radius: var(--r-3);` |
| 242 | `box-shadow: 0 14px 40px rgba(31, 43, 58, 0.18), 0 0 18px rgba(180, 83, 9, 0.1);` | `box-shadow: var(--shadow-3), 0 0 18px var(--glow-1);` |
| 289 | `border-radius: 6px;` | `border-radius: var(--r-3);` |
| 290 | `box-shadow: 0 0 24px rgba(180, 83, 9, 0.12);` | `box-shadow: 0 0 24px var(--glow-1);` |
| 301 | `border-bottom: 1px solid rgba(180, 83, 9, 0.3);` | `border-bottom: 1px solid var(--glow-2);` |
| 73 | `rgba(31, 43, 58, 0.16)` inside the radial-gradient | leave as-is (gradient stop, not an effect token; allowlisted in Task 13) |

`src/styles/layout.css`:

| Line | From | To |
|---|---|---|
| 88 | `z-index: 60;` | `z-index: var(--z-search);` |
| 92 | `box-shadow: 0 10px 30px rgba(31, 43, 58, 0.16);` | `box-shadow: var(--shadow-2);` |
| 170 | `border-radius: 3px;` | `border-radius: var(--r-1);` |

`src/styles/panels.css`:

| Line | From | To |
|---|---|---|
| 116 | `border-radius: 2px;` | `border-radius: var(--r-1);` |
| 135 | `border-radius: 999px;` | `border-radius: var(--r-pill);` |
| 460 | `border-radius: 3px;` | `border-radius: var(--r-1);` |
| 512, 520 | `border-radius: 2px;` | `border-radius: var(--r-1);` |
| 561 | `z-index: 70;` | `z-index: var(--z-drawer);` |
| 572 | `z-index: 71;` | `z-index: calc(var(--z-drawer) + 1);` |
| 578 | `box-shadow: -18px 0 50px rgba(31, 43, 58, 0.2);` | `box-shadow: var(--shadow-drawer);` |
| 636 | `border-radius: 999px;` | `border-radius: var(--r-pill);` |
| 698 | `z-index: 100;` | `z-index: var(--z-modal);` |
| 711 | `border-radius: 6px;` | `border-radius: var(--r-3);` |
| 712 | `box-shadow: 0 24px 80px rgba(31, 43, 58, 0.24);` | `box-shadow: var(--shadow-4);` |
| 769 | `z-index: 200;` | `z-index: var(--z-toast);` |
| 786 | `box-shadow: 0 10px 30px rgba(31, 43, 58, 0.18);` | `box-shadow: var(--shadow-2);` |
| 988 | `border-radius: 2px;` | `border-radius: var(--r-1);` |

(912 `border-radius: 1px 1px 0 0;` — leave; sub-token detail, allowlisted.)

`src/styles/base.css`:

| Line | From | To |
|---|---|---|
| 35 (scrollbar thumb) | `border-radius: 4px;` | `border-radius: var(--r-2);` |
| 163 (`.kbd`) | `border-radius: 3px;` | `border-radius: var(--r-1);` |
| 176 (`.type-dot`) | `border-radius: 2px;` | `border-radius: var(--r-1);` |
| 190 (`.type-chip`) | `border-radius: 999px;` | `border-radius: var(--r-pill);` |
| `.type-chip` | `background: rgba(255, 255, 255, 0.6);` | `background: var(--card-veil);` |

`src/styles/motion.css`:

| Line | From | To |
|---|---|---|
| 122 (`.shell-scan`) | `z-index: 320;` | `z-index: var(--z-boot);` |

(`border-radius: 50%` circles everywhere: leave — allowlisted.)

- [ ] **Step 2: Verify**

Run: `npm run build && npm run test`
Expected: both green. Then visual smoke: `npm run dev`, open `/kg`, confirm glows/shadows/drawer/modal/toast look unchanged (sub-perceptual alpha nudges only).

- [ ] **Step 3: Commit**

```bash
git add src/styles/
git commit -m "refactor(styles): effects, radii, and z bands resolve through tokens"
```

---

### Task 4: One Wordmark

**Files:**
- Create: `src/panels/Wordmark.tsx`
- Modify: `src/styles/base.css` (append), `src/styles/layout.css:42-56,211-225`, `src/styles/console.css:29-43`, `src/App.tsx:50-52`, `src/panels/TopBar.tsx:54`, `src/console/ConsoleApp.tsx:25`, `src/tracking/SignInForm.tsx:35-37`, `src/auth/SignUpForm.tsx:41-43,61-63`, `src/auth/PendingApp.tsx:19-21`

**Interfaces:**
- Produces: `Wordmark({ form: "display" | "lower", className?: string })` — `display` = `DELAPAN_8` stamp (Big Shoulders, amber `_8`), `lower` = lowercase `delapan` (Space Grotesk). Contexts keep sizing via their existing wrapper class. Out-of-scope `TrackingApp`/`DuetApp` keep their inline markup + `tracking.css` styles untouched.

- [ ] **Step 1: Create the component**

`src/panels/Wordmark.tsx`:

```tsx
/**
 * The one wordmark. `display` is the DELAPAN_8 stamp (boot, auth cards);
 * `lower` is the bar identity (top bar, console). Size is contextual — pass
 * the surface's sizing class via className.
 */
interface WordmarkProps {
  form: "display" | "lower";
  className?: string;
}

export function Wordmark({ form, className }: WordmarkProps) {
  const cls = ["wm", form === "display" ? "wm--display" : "wm--lower", className]
    .filter(Boolean)
    .join(" ");
  if (form === "lower") return <span className={cls}>delapan</span>;
  return (
    <span className={cls}>
      DELAPAN<span className="wm-8">_8</span>
    </span>
  );
}
```

- [ ] **Step 2: Add the CSS and thin out the duplicates**

Append to `src/styles/base.css`:

```css
/* --- wordmark ------------------------------------------------------------ */

.wm--display {
  font-family: var(--font-display);
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--text);
}

.wm--display .wm-8 {
  color: var(--accent);
}

.wm--lower {
  font-family: var(--font-brand);
  font-weight: 500;
  letter-spacing: -0.02em;
  text-transform: lowercase;
  color: var(--brand-ink);
}
```

`src/styles/layout.css` — reduce `.tb-wordmark` (42–56) to sizing only:

```css
.tb-wordmark {
  font-size: 20px;
}
```

and `.boot-wordmark` (211–225) to:

```css
.boot-wordmark {
  font-size: 44px;
}
```

(delete the now-duplicated family/weight/letter-spacing/color lines and the `.boot-wordmark span` rule).

`src/styles/console.css` — reduce `.cons-wordmark` (29–36) to:

```css
.cons-wordmark {
  font-size: 20px;
}
```

- [ ] **Step 3: Swap the render sites**

In each file, import `{ Wordmark } from "../panels/Wordmark"` (path-adjusted) and replace:

- `src/App.tsx:50-52` → `<Wordmark form="display" className="boot-wordmark" />`
- `src/panels/TopBar.tsx:54` → `<Wordmark form="lower" className="tb-wordmark" />`
- `src/console/ConsoleApp.tsx:25` → `<Wordmark form="lower" className="cons-wordmark" />`
- `src/tracking/SignInForm.tsx:35-37`, `src/auth/SignUpForm.tsx:41-43` and `61-63`, `src/auth/PendingApp.tsx:19-21` → `<Wordmark form="display" className="tracking-wordmark" />` (the `.tracking-wordmark` class now supplies only its 13px size; its family/color rules in `tracking.css` are redundant but `tracking.css` is out of scope — leave them, they agree).

- [ ] **Step 4: Verify + commit**

Run: `npm run build` → clean. Dev-server check: boot screen, top bar, console header, `/login`, `/signup` all render identical wordmarks.

```bash
git add src/panels/Wordmark.tsx src/styles/base.css src/styles/layout.css src/styles/console.css src/App.tsx src/panels/TopBar.tsx src/console/ConsoleApp.tsx src/tracking/SignInForm.tsx src/auth/SignUpForm.tsx src/auth/PendingApp.tsx
git commit -m "refactor(identity): single Wordmark component"
```

---

### Task 5: Auth layer — auth.css, .auth-card, Interstitial, field errors

**Files:**
- Create: `src/styles/auth.css`, `src/auth/Interstitial.tsx`
- Modify: `src/main.tsx` (import), `src/Root.tsx` (4 interstitial sites), `src/auth/AuthGate.tsx` (2 sites), `src/tracking/SignInForm.tsx`, `src/auth/SignUpForm.tsx`, `src/auth/PendingApp.tsx` (class swaps + `aria-invalid`), `src/styles/base.css` (error state)

**Interfaces:**
- Produces: `.auth-wrap`, `.auth-card`, `.auth-state`, `.auth-err` classes; `Interstitial({ line?: string, error?: string })`. In-scope screens stop using `.tracking-login`, `.tracking-login__panel`, `.tracking-state`, `.tracking-error` (TrackingApp/DuetApp keep them).

- [ ] **Step 1: Create `src/styles/auth.css`**

```css
/* Auth surfaces: sign-in / sign-up / waitlist cards + the branded
   interstitial. Promoted from tracking.css so the product auth journey no
   longer depends on the tracking surface's stylesheet. */

.auth-wrap,
.auth-state {
  display: grid;
  min-height: 100%;
  place-items: center;
  padding: var(--u6);
  background: var(--bg0);
}

.auth-card {
  display: grid;
  width: min(380px, 100%);
  gap: var(--u4);
  padding: 28px;
  background: var(--bg1);
  border: 1px solid var(--line-bright);
  border-radius: var(--radius);
  box-shadow: var(--shadow-1);
}

.auth-card > p {
  margin: 0;
  color: var(--text-dim);
}

.auth-card h1 {
  margin: 2px 0 0;
  font-family: var(--font-display);
  font-size: 24px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.auth-card label {
  display: grid;
  gap: 6px;
  color: var(--text-dim);
  font-family: var(--font-mono);
  font-size: 10px;
  text-transform: uppercase;
}

.auth-card .btn {
  justify-content: center;
  margin-top: var(--u);
}

.auth-err {
  margin: 0;
  color: var(--red);
}

/* the one branded wait screen: wordmark + line + a slow scan shimmer */
.auth-state {
  align-content: center;
  gap: var(--u2);
  justify-items: center;
  color: var(--text-dim);
  font-family: var(--font-mono);
}

.auth-state-wm {
  font-size: 22px;
}

.auth-state-line {
  display: flex;
  align-items: center;
  gap: var(--u2);
  margin: 0;
}
```

- [ ] **Step 2: Import it**

In `src/main.tsx`, add after the `tracking.css` import:

```ts
import "./styles/auth.css";
```

- [ ] **Step 3: Create `src/auth/Interstitial.tsx`**

```tsx
/**
 * The one branded wait/error screen for session and access gates — replaces
 * the three bare `.tracking-state` variants so waiting reads as the
 * instrument warming up.
 */
import { Wordmark } from "../panels/Wordmark";

export function Interstitial({ line, error }: { line?: string; error?: string }) {
  return (
    <main className="auth-state">
      <Wordmark form="display" className="auth-state-wm" />
      {error ? (
        <p className="auth-err">{error}</p>
      ) : (
        <p className="auth-state-line">
          <span className="spin" /> {line}
        </p>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Replace the interstitial sites**

`src/Root.tsx` — replace all four `<main className="tracking-state">…</main>` blocks:

- config error (in `Root()`): `return <Interstitial error={message} />;`
- `RedirectHome`: `return <Interstitial line="taking you home…" />;`
- session `undefined`: `return <Interstitial line="checking session…" />;`
- access `checking`/`idle`: `return <Interstitial line="checking access…" />;`

`src/auth/AuthGate.tsx` — replace both blocks:

- session `undefined`: `return <Interstitial line="checking session…" />;`
- config error: `return <Interstitial error={message} />;`

Import `{ Interstitial } from "./auth/Interstitial"` / `"./Interstitial"` respectively.

- [ ] **Step 5: Swap card classes + field errors**

In `src/tracking/SignInForm.tsx`: `className="tracking-login"` → `"auth-wrap"`, `"tracking-login__panel"` → `"auth-card"`, `"tracking-error"` → `"auth-err"`. Add `aria-invalid={Boolean(error)}` to both inputs. Same three swaps + `aria-invalid` in `src/auth/SignUpForm.tsx` (both branches). In `src/auth/PendingApp.tsx` (lines 17–18): `"tracking-login"` → `"auth-wrap"`, `"tracking-login__panel"` → `"auth-card"` (its `.pending-note`/`.pending-email` classes stay).

Append to `src/styles/base.css` after the `.inp:focus` rule:

```css
.inp[aria-invalid="true"] {
  border-color: var(--red);
}
```

- [ ] **Step 6: Verify + commit**

`npm run build` → clean. Dev check: `/login` (bad password → red fields + message), `/signup`, waitlist screen, and the interstitials (throttle network or log out/in to catch them).

```bash
git add src/styles/auth.css src/styles/base.css src/main.tsx src/auth/ src/tracking/SignInForm.tsx src/Root.tsx
git commit -m "feat(auth): shared auth card, branded interstitial, field error states"
```

---

### Task 6: `.inp` variants + Inspector inline-style migration

**Files:**
- Modify: `src/styles/base.css` (append variants + utilities), `src/styles/panels.css:170-171,388-391`, `src/panels/Inspector.tsx`, `src/panels/LeftRail.tsx` (drift class)

**Interfaces:**
- Produces: `.inp--lg`, utilities `.ml-auto`, `.row`, `.hint`. Data-driven inline styles (`typeColor(...)`, width percentages) stay inline — they are values, not styling.

- [ ] **Step 1: Add variants + utilities to `base.css`**

```css
.inp--lg {
  font-size: 15px;
  font-family: var(--font-body);
  padding: 7px 9px;
}

/* --- layout utilities ---------------------------------------------------- */

.ml-auto {
  margin-left: auto;
}

.row {
  display: flex;
  gap: var(--u);
}

.hint {
  color: var(--text-faint);
  font-size: 11px;
}
```

- [ ] **Step 2: Kill the `!important` escapes**

`src/styles/panels.css:388-391` — delete the three `!important` declarations from `.ins-label-input` (keep any other properties in that rule); in `src/panels/Inspector.tsx` give that input `className="inp inp--lg ins-label-input"`.

`src/styles/panels.css:169-171` — `.lr-drift` sits on a `.type-chip` (LeftRail.tsx:223: `` className={`type-chip${drift ? " lr-drift" : ""}`} ``), and the `!important` exists to outrank `.type-chip`'s own border/color. Beat it with specificity instead — change the rule's selector and drop both `!important`s:

```css
.type-chip.lr-drift {
  border-color: var(--red);
  color: var(--red);
}
```

No TSX change needed.

- [ ] **Step 3: Migrate Inspector inline styles**

In `src/panels/Inspector.tsx`, replace the static inline styles (current lines 127, 163, 188, 249, 298, 327, 359, 384, 486):

| Line | From | To |
|---|---|---|
| 163, 298, 384 | `style={{ marginLeft: "auto" }}` | `className="ml-auto"` (merge with existing className if present) |
| 327 | `className="arrow" style={{ marginLeft: "auto" }}` | `className="arrow ml-auto"` |
| 188 | `style={{ display: "flex", gap: 4 }}` | `className="row"` |
| 127 | `className="mono" style={{ fontSize: 10, color: "var(--text-faint)" }}` | `className="mono hint"` (add `.hint` font-size 11→keep 10? No: change to `className="mono hint"` and accept 11px — sub-point nudge) |
| 359 | `style={{ color: "var(--text-faint)", fontSize: 11 }}` | `className="hint"` |
| 249 | `style={{ background: "var(--accent)" }}` | keep — data-driven convention slot (chrome dot); acceptable, or add `.type-dot--chrome { background: var(--accent); }` and use it. Do the class. |
| 486 | `style={{ color: "var(--green)" }}` | add `.ins-prop-add { color: var(--green); }` to panels.css near `.ins-prop-del`, use `className="ins-prop-del ins-prop-add"` |
| 94, 323, 539 | `typeColor(...)` / width-% styles | keep inline (data-driven) |

Add to `src/styles/base.css` (with the type-dot rules):

```css
.type-dot--chrome {
  background: var(--accent);
}
```

- [ ] **Step 4: Verify + commit**

`npm run build && npm run test` → green. Dev check: inspector label input still 15px; drift warning still red; property rows unchanged.

```bash
git add src/styles/base.css src/styles/panels.css src/panels/Inspector.tsx src/panels/LeftRail.tsx
git commit -m "refactor(inspector): inp variants and utilities replace inline styles and !important"
```

---

### Task 7: Cross-cutting interaction states + rail rhythm + OKF cleanup

**Files:**
- Modify: `src/styles/base.css` (focus-visible list, press state, sect rhythm), `src/styles/panels.css` (legend hover, OKF block 828–852)

- [ ] **Step 1: Focus + press**

In `src/styles/base.css`, extend the existing focus rule (lines ~145–149) to:

```css
.btn:focus-visible,
.inp:focus-visible,
a:focus-visible,
.hopkey:focus-visible,
.tb-seg button:focus-visible,
.cons-tile:focus-visible {
  outline: 2px solid var(--focus);
  outline-offset: 1px;
}
```

Add after `.btn:disabled`:

```css
.btn:active:not(:disabled) {
  transform: translateY(0.5px);
  transition-duration: var(--t-press);
}
```

- [ ] **Step 2: Rail rhythm + legend hover**

In `src/styles/base.css`, change `.sect` padding to the unit scale:

```css
.sect {
  border-bottom: 1px solid var(--line);
  padding: var(--u3);
}
```

In `src/styles/panels.css`, after the existing `.lr-legend-row` rule (line 98), add:

```css
.lr-legend-row:hover {
  background: var(--bg2);
  border-radius: var(--r-1);
}
```

- [ ] **Step 2b: Console tile hover elevation + structural spacing sweep**

In `src/styles/console.css`, find the `.cons-tile` rule and add `box-shadow: var(--shadow-1);` plus a hover step:

```css
.cons-tile:hover {
  box-shadow: var(--shadow-2);
  border-color: var(--line-bright);
}
```

(if `.cons-tile` already declares a hover, merge these properties into it; add `transition: box-shadow var(--t-micro), border-color var(--t-micro);` on the base rule.)

Structural spacing sweep (spec §2 spacing rule): in `panels.css`, `canvas.css`, and `console.css`, replace raw `padding`/`gap`/`margin` values that are exact multiples of the scale — `4px`→`var(--u)`, `8px`→`var(--u2)`, `12px`→`var(--u3)`, `16px`→`var(--u4)`, `24px`→`var(--u6)`, `32px`→`var(--u8)` — in shorthand too (`padding: 9px 11px` stays; `padding: 8px 12px` → `padding: var(--u2) var(--u3)`). Leave odd optical values (7/9/9.5/11/14/18/28px) untouched. Mechanical; no layout change.

- [ ] **Step 3: OKF block**

Reformat `src/styles/panels.css:828-852` from single-line rules to the file's multiline style, and swap: `rgba(127, 127, 127, 0.14)` → `var(--bg2)`, `rgba(127, 127, 127, 0.16)` → `var(--bg3)`, `border-radius: 6px` → `var(--r-3)`, `var(--font-mono, monospace)` → `var(--font-mono)`.

- [ ] **Step 4: Verify + commit**

`npm run build` → clean. Dev check: tab through top bar/rail/console — every stop shows the 2px focus ring; buttons nudge on press; OKF reader unchanged visually.

```bash
git add src/styles/base.css src/styles/panels.css
git commit -m "feat(styles): universal focus ring, press state, rail rhythm, OKF cleanup"
```

---

### Task 8: States — empty canvas, findings skeleton, explore retry

**Files:**
- Modify: `src/graph/GraphCanvas.tsx` (empty state), `src/state/store.ts` (focus-explore signal), `src/panels/LeftRail.tsx` (focus + retry), `src/panels/FindingsView.tsx:32-37` (skeleton), `src/styles/canvas.css` (empty state CSS), `src/styles/panels.css` (skeleton CSS), `src/styles/motion.css` (shimmer keyframes + reduced-motion)

**Interfaces:**
- Consumes: `useStore().setAddNodeOpen(true)` (exists, store.ts:450).
- Produces: store field `exploreFocusSeq: number` + action `requestExploreFocus(): void` (bumps the seq; LeftRail focuses its prompt input on change).

- [ ] **Step 1: Store signal**

In `src/state/store.ts` add to the state interface: `exploreFocusSeq: number;` and `requestExploreFocus(): void;`, initial `exploreFocusSeq: 0`, action:

```ts
  requestExploreFocus() {
    set({ exploreFocusSeq: get().exploreFocusSeq + 1 });
  },
```

- [ ] **Step 2: Empty canvas state**

In `src/graph/GraphCanvas.tsx`, subscribe `const graphVersion = useStore((s) => s.graphVersion);` and after the `loadingGraph` block in the JSX add:

```tsx
      {!loadingGraph && graph.order === 0 && (
        <div className="cv-empty" data-graph-version={graphVersion}>
          <p className="cv-empty-title">this KB has no graph yet</p>
          <p className="cv-empty-line">
            run an explore to grow it from research, or place the first node by hand.
          </p>
          <div className="cv-empty-actions">
            <button
              className="btn btn--accent"
              onClick={() => useStore.getState().requestExploreFocus()}
            >
              launch an explore
            </button>
            <button className="btn" onClick={() => useStore.getState().setAddNodeOpen(true)}>
              add a node
            </button>
          </div>
        </div>
      )}
```

(`data-graph-version` ties the render to the subscription so the empty state clears the moment nodes land; verify `setAddNodeOpen` is the actual action name at store.ts:450 and adjust.)

Add to `src/styles/canvas.css`:

```css
.cv-empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--u2);
  text-align: center;
  z-index: 5;
}

.cv-empty-title {
  margin: 0;
  font-family: var(--font-display);
  font-size: 18px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}

.cv-empty-line {
  margin: 0;
  color: var(--text-faint);
  font-size: 12px;
}

.cv-empty-actions {
  display: flex;
  gap: var(--u2);
  margin-top: var(--u2);
}
```

- [ ] **Step 3: LeftRail focus + retry**

In `src/panels/LeftRail.tsx` explore section: create `const promptRef = useRef<HTMLInputElement>(null);` (import `useRef`), set `ref={promptRef}` on the explore prompt input, and add:

```tsx
  const exploreFocusSeq = useStore((s) => s.exploreFocusSeq);
  useEffect(() => {
    if (exploreFocusSeq > 0) promptRef.current?.focus();
  }, [exploreFocusSeq]);
```

The error row lives at `src/panels/LeftRail.tsx:439-444`. Replace it with:

```tsx
          {run.error && (
            <div className="lr-phase lr-phase--error dlpn-in-slide">
              <span className="lr-phase-tick">✕</span>
              {run.error}
              <button className="btn ml-auto" onClick={() => void start()}>
                retry
              </button>
            </div>
          )}
```

- [ ] **Step 4: Findings skeleton**

In `src/panels/FindingsView.tsx`, replace the loading branch (lines 32–37) body with:

```tsx
  if (loading) {
    return (
      <div className="fv">
        <div className="fv-skel">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="skel-row" style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>
      </div>
    );
  }
```

(keep the surrounding wrapper element the current branch uses — match its actual outer class via the file.)

Add to `src/styles/panels.css` (findings-view section):

```css
.fv-skel {
  display: grid;
  gap: var(--u2);
  padding: var(--u4);
}

.skel-row {
  height: 18px;
  border-radius: var(--r-1);
  background: linear-gradient(90deg, var(--bg2) 25%, var(--bg1) 50%, var(--bg2) 75%);
  background-size: 200% 100%;
  animation: dlpn-shimmer 1.2s ease-in-out infinite;
}
```

Add to `src/styles/motion.css` keyframes section:

```css
@keyframes dlpn-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
```

and inside the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .skel-row {
    animation: none;
  }
```

- [ ] **Step 5: Verify + commit**

`npm run build && npm run test` → green. Dev check: empty KB shows the empty state, "launch an explore" focuses the rail input, "add a node" opens the modal; findings tab shows shimmer rows while loading; kill the backend mid-explore to see the retry button.

```bash
git add src/graph/GraphCanvas.tsx src/state/store.ts src/panels/LeftRail.tsx src/panels/FindingsView.tsx src/styles/canvas.css src/styles/panels.css src/styles/motion.css
git commit -m "feat(states): first-run empty canvas, findings skeleton, explore retry"
```

---

### Task 9: Motion normalization — durations onto the token scale

**Files:**
- Modify: `src/styles/panels.css`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/canvas.css`, `src/styles/console.css`

- [ ] **Step 1: Swap durations**

Grep each file for `ms` and apply:

| Pattern (any file) | To |
|---|---|
| `transition: <props> 120ms` (all occurrences, incl. `.btn`, `.inp`) | `transition: <props> var(--t-micro)` |
| drawer-in animation `200ms` | `var(--t-enter)` |
| modal-in `140ms` / `160ms` | `var(--t-pop)` |
| toast-in `220ms` / `280ms` | `var(--t-enter)` |
| any exit/fade-out `≤200ms` | `var(--t-exit)` |

Leave: `animation-delay` staggers, `--t-*`-driven values, the 0.8s `.spin`, and sigma-side JS durations (camera 680/500/280/270ms — already spec-blessed).

- [ ] **Step 2: Graph↔findings crossfade (spec §5)**

In `src/App.tsx`, wrap the center-view switch (currently `{view === "graph" ? <GraphCanvas /> : <FindingsView />}`) so the incoming view fades in:

```tsx
          <div key={view} className="view-fade">
            {view === "graph" ? <GraphCanvas /> : <FindingsView />}
          </div>
```

The wrapper must fill its parent — add to `src/styles/layout.css`:

```css
.view-fade {
  position: relative;
  height: 100%;
  min-width: 0;
  animation: dlpn-fade var(--t-pop) var(--ease-out);
}
```

and add `.view-fade` to the `animation: none` list inside `motion.css`'s `@media (prefers-reduced-motion: reduce)` block. (The `key={view}` remount is what replays the fade; GraphCanvas already tears down/rebuilds sigma cleanly on unmount via its effect cleanup.)

- [ ] **Step 3: Verify + commit**

`npm run build` → clean. Dev check: drawer/modal/toast enter feel unchanged-to-slightly-smoother; nothing above 500ms.

```bash
git add src/styles/
git commit -m "refactor(motion): component durations resolve through the token scale"
```

---

### Task 10: enterMotion pure module (TDD)

**Files:**
- Create: `src/graph/enterMotion.ts`
- Test: `src/graph/enterMotion.test.ts`

**Interfaces:**
- Produces (consumed by Task 11):
  - `ENTER_MS = 500`, `ENTER_STAGGER_MS = 28`, `ENTER_BATCH_MAX = 40`
  - `planEnter(ids: string[]): { mode: "stagger" | "settle"; ids: string[] }`
  - `enterProgress(elapsed: number, index: number): number` — eased 0..1
  - `lerpPos(from: {x,y}, to: {x,y}, p: number): {x,y}`
  - `enterSize(target: number, p: number): number` — 0.15×→1× target
  - `enterDone(elapsed: number, count: number): boolean`

- [ ] **Step 1: Write the failing tests**

`src/graph/enterMotion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  ENTER_BATCH_MAX,
  ENTER_MS,
  ENTER_STAGGER_MS,
  enterDone,
  enterProgress,
  enterSize,
  lerpPos,
  planEnter,
} from "./enterMotion";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `n-${i}`);

describe("planEnter batch guard", () => {
  it("staggers small batches", () => {
    expect(planEnter(ids(1)).mode).toBe("stagger");
    expect(planEnter(ids(ENTER_BATCH_MAX)).mode).toBe("stagger");
  });

  it("falls back to a full settle above the cap", () => {
    expect(planEnter(ids(ENTER_BATCH_MAX + 1)).mode).toBe("settle");
  });

  it("passes ids through untouched", () => {
    expect(planEnter(["a", "b"]).ids).toEqual(["a", "b"]);
  });
});

describe("enterProgress", () => {
  it("starts at 0 and ends at 1", () => {
    expect(enterProgress(0, 0)).toBe(0);
    expect(enterProgress(ENTER_MS, 0)).toBe(1);
  });

  it("holds a staggered node at 0 until its slot", () => {
    expect(enterProgress(ENTER_STAGGER_MS - 1, 1)).toBe(0);
    expect(enterProgress(ENTER_STAGGER_MS + ENTER_MS, 1)).toBe(1);
  });

  it("is monotonic", () => {
    let prev = -1;
    for (let t = 0; t <= ENTER_MS; t += 50) {
      const p = enterProgress(t, 0);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});

describe("lerpPos / enterSize", () => {
  it("lerp hits both endpoints", () => {
    const from = { x: 0, y: 10 };
    const to = { x: 100, y: -10 };
    expect(lerpPos(from, to, 0)).toEqual(from);
    expect(lerpPos(from, to, 1)).toEqual(to);
    expect(lerpPos(from, to, 0.5)).toEqual({ x: 50, y: 0 });
  });

  it("size scales from the floor to the target", () => {
    expect(enterSize(8, 0)).toBeCloseTo(1.2); // 0.15 × target
    expect(enterSize(8, 1)).toBe(8);
  });
});

describe("enterDone", () => {
  it("accounts for the last node's stagger", () => {
    expect(enterDone(ENTER_MS - 1, 1)).toBe(false);
    expect(enterDone(ENTER_MS, 1)).toBe(true);
    expect(enterDone(ENTER_MS + 2 * ENTER_STAGGER_MS - 1, 3)).toBe(false);
    expect(enterDone(ENTER_MS + 2 * ENTER_STAGGER_MS, 3)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npx vitest run src/graph/enterMotion.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `src/graph/enterMotion.ts`**

```ts
/**
 * Pure math for the node-enter animation — planning, easing, staggering.
 * No DOM, no rAF, no graphology: the driver in ./motion.ts owns those.
 * Timings mirror motion.css: ENTER_MS = --t-rise, stagger matches settle.
 */

export const ENTER_MS = 500;
export const ENTER_STAGGER_MS = 28;
/** Above this many simultaneous enters, per-node staggers read as noise —
 *  the driver falls back to one full settle pass instead. */
export const ENTER_BATCH_MAX = 40;
const SIZE_FLOOR = 0.15;

export type EnterMode = "stagger" | "settle";

export interface EnterPlan {
  mode: EnterMode;
  ids: string[];
}

export function planEnter(ids: string[]): EnterPlan {
  return { mode: ids.length > ENTER_BATCH_MAX ? "settle" : "stagger", ids };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Eased 0..1 progress of the index-th entering node, `elapsed` ms in. */
export function enterProgress(elapsed: number, index: number): number {
  return easeOutCubic(clamp01((elapsed - index * ENTER_STAGGER_MS) / ENTER_MS));
}

export function lerpPos(
  from: { x: number; y: number },
  to: { x: number; y: number },
  p: number,
): { x: number; y: number } {
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p };
}

/** Node size during a sourceless (scale-in) enter. */
export function enterSize(target: number, p: number): number {
  return target * (SIZE_FLOOR + (1 - SIZE_FLOOR) * p);
}

export function enterDone(elapsed: number, count: number): boolean {
  return elapsed >= ENTER_MS + Math.max(0, count - 1) * ENTER_STAGGER_MS;
}
```

- [ ] **Step 4: Run tests → PASS, then commit**

```bash
npx vitest run src/graph/enterMotion.test.ts
git add src/graph/enterMotion.ts src/graph/enterMotion.test.ts
git commit -m "feat(motion): pure enter-animation math with batch guard"
```

---

### Task 11: enterNodes driver + overlay rings

**Files:**
- Modify: `src/graph/motion.ts`, `src/graph/GraphCanvas.tsx`

**Interfaces:**
- Consumes: Task 10 exports.
- Produces:
  - `enterNodes(ids: string[], opts?: { sourceId?: string | null }): void` — animates the listed (already-placed) nodes in; with `sourceId`, they fly from that node's position; without, they scale in at their position. Reduced motion → no-op. `> ENTER_BATCH_MAX` → one `initGraphMotion()` settle.
  - `enteringNodeIds(): string[]` — ids currently animating in (for overlay rings).
- **Position authority order: enter > drift.** A node in `enterMap` is skipped by drift until its enter completes; on completion its base is written into `motionMap` so drift takes over cleanly.

- [ ] **Step 1: Extend `src/graph/motion.ts`**

Add imports and state (top of file, after existing imports/state):

```ts
import { enterDone, enterProgress, enterSize, lerpPos, planEnter } from "./enterMotion";

interface EnterMotion {
  from: { x: number; y: number };
  to: { x: number; y: number };
  targetSize: number;
  index: number;
}

let enterMap = new Map<string, EnterMotion>();
let enterStart = 0;
```

Add the exports (after `stopGraphMotion`):

```ts
/**
 * Animate already-placed nodes in. With a source, each flies from the source's
 * position along its arc; without, it scales in where it stands. Enter owns a
 * node's position/size until done (drift skips it), then hands the base to the
 * drift map. Instant under reduced motion; large batches settle instead.
 */
export function enterNodes(ids: string[], opts: { sourceId?: string | null } = {}): void {
  const present = ids.filter((id) => graph.hasNode(id));
  if (present.length === 0 || reducedMotion()) return;
  if (planEnter(present).mode === "settle") {
    initGraphMotion();
    return;
  }
  const src =
    opts.sourceId && graph.hasNode(opts.sourceId)
      ? {
          x: graph.getNodeAttributes(opts.sourceId).x,
          y: graph.getNodeAttributes(opts.sourceId).y,
        }
      : null;
  present.forEach((id, i) => {
    const a = graph.getNodeAttributes(id);
    const to = { x: a.x, y: a.y };
    enterMap.set(id, { from: src ?? to, to, targetSize: a.size, index: i });
    // drift must not fight the enter: claim the base now
    motionMap.set(id, {
      base: to,
      index: motionMap.size,
      phase: (motionMap.size * 0.17 * Math.PI) % (Math.PI * 2),
      omega: (2 * Math.PI) / ((5 + (motionMap.size % 4)) * 1000),
      variant: motionMap.size % 3,
    });
  });
  enterStart = performance.now();
  ensureRunning();
}

/** Ids currently animating in — the canvas overlay draws arrival rings. */
export function enteringNodeIds(): string[] {
  return [...enterMap.keys()];
}
```

Update `applyFrame()` — insert enter handling before the drift return (the function's per-node callback becomes):

```ts
    (id, attr) => {
      const e = enterMap.get(id);
      if (e) {
        const p = enterProgress(clock - enterStart, e.index);
        const pos = lerpPos(e.from, e.to, p);
        const sameSpot = e.from.x === e.to.x && e.from.y === e.to.y;
        return {
          ...attr,
          x: pos.x,
          y: pos.y,
          size: sameSpot ? enterSize(e.targetSize, p) : e.targetSize,
        };
      }
      const m = motionMap.get(id);
      if (!m) return attr;
      // …existing settle + drift branches unchanged…
    },
```

and widen the attribute filter on that `updateEachNodeAttributes` call to `{ attributes: ["x", "y", "size"] }`.

Update `tick()` — after the settle-completion check, add:

```ts
  if (enterMap.size > 0 && enterDone(clock - enterStart, enterMap.size)) {
    // land enters exactly on target and hand position authority to drift
    graph.updateEachNodeAttributes(
      (id, attr) => {
        const e = enterMap.get(id);
        return e ? { ...attr, x: e.to.x, y: e.to.y, size: e.targetSize } : attr;
      },
      { attributes: ["x", "y", "size"] },
    );
    enterMap = new Map();
  }
```

and make the loop run full-rate while entering: change the paint condition to `if (!settleDone || enterMap.size > 0 || clock - lastPaint >= FRAME_MS)` and the continue condition to `const needMore = !settleDone || enterMap.size > 0 || (ambientDrift && !reducedMotion());`.

Also in `stopGraphMotion()`, clear `enterMap = new Map();`.

- [ ] **Step 2: Overlay rings in `src/graph/GraphCanvas.tsx`**

Import `enteringNodeIds` from `./motion`. In `CanvasOverlays`, add `<EnterPulses sigma={sigma} />` beside `<SelectionPulse …/>`, and define:

```tsx
// arrival rings on nodes currently animating in — same visual family as the
// selection pulse, so "new" and "selected" read as one language.
function EnterPulses({ sigma }: { sigma: AppSigma }) {
  const ids = enteringNodeIds().slice(0, 12); // cap the ring count, not the enters
  return (
    <>
      {ids.map((id) => {
        const pos = nodeViewport(sigma, id);
        if (!pos) return null;
        return (
          <span
            key={`enter-${id}`}
            className="dlpn-ring"
            style={{ left: pos.x, top: pos.y, width: 30, height: 30 }}
          />
        );
      })}
    </>
  );
}
```

(`CanvasOverlays` already re-renders every `afterRender`, so the rings track camera moves; each ring's CSS animation runs once per mount keyed by node id.)

- [ ] **Step 3: Verify + commit**

`npm run build && npm run test` → green. Live check is Task 12's (needs a producer).

```bash
git add src/graph/motion.ts src/graph/GraphCanvas.tsx
git commit -m "feat(motion): enterNodes driver with enter-over-drift authority and arrival rings"
```

---

### Task 12: Wire the consumers — addNode + explore delta merge

**Files:**
- Modify: `src/state/mutations.ts` (addNode), `src/state/store.ts` (mergeGraphDelta), `src/panels/LeftRail.tsx` (explore completion)

**Interfaces:**
- Consumes: `enterNodes` (Task 11), `placeNear(anchorId)` from `src/graph/layout.ts`, `api.getGraph`, `graphTouched`/`refreshNodeSizes` from `src/graph/graphStore.ts`, attr shapes from `src/graph/build.ts`.
- Produces: store action `mergeGraphDelta(): Promise<void>` — fetches the graph, adds only missing nodes/edges to graphology (existing attrs untouched, undo history preserved), then enters the new nodes.

- [ ] **Step 1: addNode enters from its anchor**

In `src/state/mutations.ts` `addNode`, after the `if (ok && id)` block's existing lines, add:

```ts
    enterNodes([id], { sourceId: anchor });
```

(import `{ enterNodes } from "../graph/motion"`.)

- [ ] **Step 2: mergeGraphDelta in the store**

Add to `src/state/store.ts` (interface + implementation, near `loadScope`). Note it deliberately does NOT `primeChannels` — re-priming mid-session reshuffles every node's hue; new types ride the remainder channel until the next full load:

```ts
  /** Merge new nodes/edges after an explore without rebuilding the graph —
   *  existing positions, selection, and undo history survive; only the new
   *  nodes animate in. */
  async mergeGraphDelta() {
    const { project, kb } = get();
    if (!project || !kb) return;
    try {
      const res = await api.getGraph(project, kb);
      const freshNodes = res.nodes.filter((n) => !graph.hasNode(n.id));
      const freshEdges = res.edges.filter((e) => !graph.hasEdge(e.id));
      if (freshNodes.length === 0 && freshEdges.length === 0) return;

      // a new node lands near its first already-present neighbour, else centroid
      const anchorOf = new Map<string, string>();
      for (const e of res.edges) {
        if (graph.hasNode(e.source) && !graph.hasNode(e.target) && !anchorOf.has(e.target))
          anchorOf.set(e.target, e.source);
        if (graph.hasNode(e.target) && !graph.hasNode(e.source) && !anchorOf.has(e.source))
          anchorOf.set(e.source, e.target);
      }
      for (const n of freshNodes) {
        const pos = placeNear(anchorOf.get(n.id) ?? null);
        graph.addNode(n.id, {
          label: n.label,
          nodeType: n.type,
          properties: n.properties ?? {},
          grounded_in: n.grounded_in ?? [],
          created_at: n.created_at,
          x: pos.x,
          y: pos.y,
          size: 4,
          color: typeColor(n.type),
        });
      }
      for (const e of freshEdges) {
        if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) continue;
        graph.addEdgeWithKey(e.id, e.source, e.target, {
          label: e.relation,
          relation: e.relation,
          properties: e.properties ?? {},
          grounded_in: e.grounded_in ?? [],
          created_at: e.created_at,
          size: 1.4,
          color: EDGE_COLOR,
        });
      }
      refreshNodeSizes();
      graphTouched();
      enterNodes(freshNodes.map((n) => n.id));
      set({ lastAction: `explore merged ${freshNodes.length} node(s), ${freshEdges.length} edge(s)` });
    } catch {
      /* delta merge is best-effort; the next full load reconciles */
    }
  },
```

Imports to add in `store.ts`: `{ placeNear } from "../graph/layout"`, `{ typeColor, EDGE_COLOR } from "../graph/colors"`, `{ refreshNodeSizes } from "../graph/graphStore"` (merge with the existing graphStore import), `{ enterNodes } from "../graph/motion"`. Add `mergeGraphDelta(): Promise<void>;` to the state interface.

- [ ] **Step 3: Call it on explore completion**

In `src/panels/LeftRail.tsx`, in the `event.phase === "completed"` branch (line ~386), after `refreshStats();` add:

```ts
          void useStore.getState().mergeGraphDelta();
```

- [ ] **Step 4: Verify live + commit**

`npm run build && npm run test` → green. Dev check (real browser tab — the preview pane throttles rAF and cannot show motion): (a) select a node, add a node → it flies out of the selected anchor with a ring; (b) run a small explore → new nodes scale in with rings, existing nodes don't re-settle, undo history still works; (c) OS reduced-motion on → nodes appear instantly, no rings.

```bash
git add src/state/mutations.ts src/state/store.ts src/panels/LeftRail.tsx
git commit -m "feat(graph): explore delta merge and add-node both arrive via enterNodes"
```

---

### Task 13: Literal-scan gate test

**Files:**
- Test: `src/styles/literals.test.ts` (create)

**Interfaces:**
- Consumes: the migrated CSS from Tasks 1–9. Born green; fails on any future raw color/z/radius literal in in-scope files.

- [ ] **Step 1: Write the test (should pass immediately — the gate lands after migration by design)**

```ts
/**
 * The literal-scan gate: in-scope stylesheets may not carry raw colour,
 * z-index, or px border-radius literals — those resolve through tokens.css.
 * tokens.css itself is the definition site and is exempt. tracking.css,
 * landing.css, and public/duet-app.html are out of the 2026-07-26 polish
 * scope and deliberately unscanned.
 */
import { describe, expect, it } from "vitest";
import authCss from "./auth.css?raw";
import baseCss from "./base.css?raw";
import canvasCss from "./canvas.css?raw";
import consoleCss from "./console.css?raw";
import layoutCss from "./layout.css?raw";
import motionCss from "./motion.css?raw";
import panelsCss from "./panels.css?raw";

const SHEETS: Record<string, string> = {
  "auth.css": authCss,
  "base.css": baseCss,
  "canvas.css": canvasCss,
  "console.css": consoleCss,
  "layout.css": layoutCss,
  "motion.css": motionCss,
  "panels.css": panelsCss,
};

/** Deliberate exceptions, one line each. Grow this list consciously. */
const ALLOW: RegExp[] = [
  /url\("data:image\/svg\+xml[^"]*"\)/g, // inline SVG chevrons carry their own fill
  /rgba\(31, 43, 58, 0\.16\)/g, // canvas vignette gradient stop (canvas.css:73)
  /rgba\(217, 119, 6, [\d.]+\)/g, // boot scan gradient — one-shot, chrome-family
  /border-radius: 50%/g, // circles are geometry, not scale
  /border-radius: 1px 1px 0 0/g, // histogram bar cap (panels.css)
];

function strip(css: string): string {
  let out = css;
  for (const rule of ALLOW) out = out.replace(rule, "");
  return out;
}

describe("in-scope stylesheets carry no raw literals", () => {
  for (const [name, css] of Object.entries(SHEETS)) {
    const body = strip(css);

    it(`${name}: no hex colours`, () => {
      const hits = body.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hits, `${name} has raw hex: ${hits.join(", ")}`).toEqual([]);
    });

    it(`${name}: no rgba() colours`, () => {
      const hits = body.match(/rgba?\([^)]*\)/g) ?? [];
      expect(hits, `${name} has raw rgba: ${hits.join(", ")}`).toEqual([]);
    });

    it(`${name}: no px border-radius`, () => {
      const hits = body.match(/border-radius:\s*[\d.]+px/g) ?? [];
      expect(hits, `${name} has raw radius: ${hits.join(", ")}`).toEqual([]);
    });

    if (name !== "canvas.css") {
      it(`${name}: no integer z-index`, () => {
        const hits = body.match(/z-index:\s*\d+/g) ?? [];
        expect(hits, `${name} has raw z-index: ${hits.join(", ")}`).toEqual([]);
      });
    }
  }
});
```

- [ ] **Step 2: Run it**

Run: `npx vitest run src/styles/literals.test.ts`
Expected: PASS. If any sheet fails, the migration missed a literal — fix the sheet (swap to a token) rather than widening ALLOW, unless it is genuinely a new deliberate exception (then add ONE allowlist line with a reason comment).

- [ ] **Step 3: Commit**

```bash
git add src/styles/literals.test.ts
git commit -m "test(styles): literal-scan gate — colors, z, radius resolve through tokens"
```

---

### Task 14: Final verification sweep

**Files:** none (verification only; fix regressions where found)

- [ ] **Step 1: Gates**

```bash
npm run build && npm run test
```

Expected: build clean; full suite green (encoding, tokens, enterMotion, literals, undo).

- [ ] **Step 2: Keyboard + focus walkthrough**

Dev server, `/kg`: Tab through top bar → rail → canvas hint → inspector. Every stop shows the 2px `--focus` ring. `/login`, `/signup`, console: same.

- [ ] **Step 3: State-combination QA** (the KB-switch lesson: exercise switches while *inside* states, not just entry paths)

- Switch KB while in findings view → findings refetch, no stale rows.
- Run an explore, open the finding drawer while it runs, let it complete → drawer stays, new nodes enter behind it.
- Enter travel mode, then select-esc rapidly → no stuck dim/vignette.
- Trigger the empty state (empty KB), launch explore from it → empty state clears when nodes land.
- Undo after an explore delta merge → command history intact (merge bypassed the undo stack by design; undoing earlier actions still works).

- [ ] **Step 4: Motion + reduced motion (real browser tab, NOT the preview pane — it throttles rAF to ~2fps)**

- Add node from a selected anchor → flies from anchor, ring plays, drift resumes after.
- Explore merge ≤40 nodes → staggered scale-ins; force >40 (large KB reload path) → single settle, no rings.
- OS reduced-motion ON → boot instant, no scan, no rings, nodes appear in place, skeleton static.

- [ ] **Step 5: Contrast spot-check**

New/changed pairs only: `.cv-empty-title` (`--text-dim` on `--bg0` ≈ 5:1 ✓), `.auth-err` (`--red` on `--bg1`), skeleton rows are non-text. Verify with a contrast picker ≥ 4.5:1 for text.

- [ ] **Step 6: Screenshots for the record**

Capture: boot, `/kg` graph view (selection + ring), findings skeleton + loaded, empty state, `/login` error state, console. Attach to the PR/summary.

- [ ] **Step 7: Commit any fixes; do not merge**

Stop here — merge/PR is a `truenorth:finishing-a-development-branch` decision with the human.
