# Design: apply the EG design philosophy to the delapan control panel

**Date:** 2026-07-25
**Branch:** `design/eg-guidelines-restyle`
**Repo:** `delapan-fe` (`delapan-ai/frontend`)
**Vision goals served:** *"A graph you can watch grow live"* and *"HITL decisions show their
consequence first"* — both are dashboard-legibility goals, and this work makes the surface they
render on honest and readable. Violates no Invariant (nothing here touches the `Store` seam,
`grounded_in` provenance, or config). Respects the Non-Goal **"Not a greenfield dashboard"** — this
is an evolution of the existing sigma.js panel, not a rebuild.

**Grounding:** `frontend/design/eg-guidelines-restyle` KB (36 findings, coverage `rich`) —
Tufte data-ink, the two erasing principles, the lie factor, Albers 1+1=3, preattentive encoding.
Source philosophy: `eg-design-guidelines.md` §1–§9 and §11. Domain-specific sections (NER, swap
capacity, the non-additive Total Swap invariant, the finance component library) are **out of
scope** by explicit instruction — only the philosophy transfers.

---

## Problem

The control panel is already close to the philosophy in spirit — cool paper, hairline rules, tight
radii, near-total design-token discipline (only 7 hard-coded hexes across 6 CSS files). Where it
diverges, it diverges on the parts that matter most: the **data-encoding layer**.

Three concrete violations, all found in the live code:

1. **Brand color is on a data surface.** `--accent` is amber `#b45309`; `--accent-bright` is
   `#d97706`; and `BASE_COLORS.technology` in `src/graph/colors.ts` is `#d97706`. The brand hue and
   a data hue are the same color. "Red = chrome" — here, "amber = chrome" — is unambiguous only if
   nothing in the data channel uses it.
2. **Color carries type alone.** Node type is communicated by hue and nothing else. There is no
   glyph, no shape, no label affix. This fails the ~8% of men with a color-vision deficiency
   outright, and the palette is 5 fixed hues plus a 6-hue fallback ring — 11 arbitrary,
   non-CVD-safe channels with no cap and no remainder reporting.
3. **Alarm-style ambient motion.** `.blink` (1.8s infinite), `.sb-dot` / `.sb-dot--mock` (2.4s
   infinite), `pulse-glow` and `avatar-ring` (1.6s infinite) are perpetual attention magnets.
   `prefers-reduced-motion` is correctly honored in `motion.css` — but calm technology says *never
   blinking, badging*, which applies to users who have set no preference at all.
4. **Brand amber encodes a data threshold.** `panels.css:893` —
   `.fv-bar--verified i { background: var(--accent); }` colors the findings confidence histogram's
   verified bars with the brand hue. This is violation 1 again on a second surface, and it is
   also color-alone: the `VERIFIED_MIN` threshold is legible only if you can distinguish amber
   from `--line-bright` grey. *(Found during planning, 2026-07-25 — the spec originally
   mis-described this file as carrying type references, which it does not.)*

## Non-goals

- No new dependency. No WebGL node programs, no `@sigma/node-square`, no CSS framework.
- No change to `src/api/`, `src/state/`, `src/graph/graphStore.ts`, or any mutation/undo path.
  This is a presentation change; the Command/undo architecture is untouched.
- `src/styles/tracking.css` and `src/duet/` are out of scope — separate surfaces with their own
  visual language.
- No rewrite of `panels.css`. It is 971 working lines; it gets edited, not replaced.

---

## Approach

**Token re-layer + surgical component pass, plus one shared encoding module.**

The token layering does the structural work: a variable named `--chrome-accent` used on a data
surface is visibly wrong at the call site, without needing a linter. The shared module exists for
one reason — the same type glyph must appear on the canvas, in the legend, in inspector chips, and
in the findings view, and a map copy-pasted into four files is a map that drifts.

Rejected: a new `system.css` + component kit (rewrites working CSS for no encoding gain, and
conflicts with the "not a greenfield dashboard" Non-Goal).

---

## 1. Token architecture

`src/styles/tokens.css` is restructured into three explicitly prefixed layers. The existing
`--bg*` / `--line*` / `--text*` surface and ink ramps are unchanged — they already hold WCAG
contrast and are documented as doing so.

| Layer | Tokens | Rule |
|---|---|---|
| **Chrome** | `--chrome-accent`, `--chrome-accent-bright`, `--chrome-accent-dim` | Top bar, active rail marker, selection ring, links, hover. **Never on a data-encoding surface.** |
| **Data** | `--data-1` … `--data-6`, `--data-rest` | Categorical node-type channels. Capped at 7 (6 + remainder), under the guideline's 8. |
| **State** | `--state-rich`, `--state-sparse`, `--state-gap` | Coverage banding only. Never decoration. |

The old `--accent` / `--accent-bright` / `--accent-dim` names are **kept as aliases** pointing at
the `--chrome-*` values, so the ~40 existing call sites keep working and the diff stays reviewable.
New code uses the prefixed names.

Bauhaus grid unit, new:

```css
--u: 4px;          /* base unit — all spacing is a multiple */
--u2: 8px;  --u3: 12px;  --u4: 16px;  --u6: 24px;  --u8: 32px;
```

`--radius` stays `4px` (already a tight radius; already compliant).

### Palette

Amber leaves the data channel entirely. The replacement ring is CVD-safe, drawn from Okabe-Ito
where it is usable on a light `#f5f7fa` ground — Okabe-Ito's orange `#E69F00` and vermillion
`#D55E00` are **excluded because they collide with delapan's amber chrome**, and its yellow
`#F0E442` is excluded as illegible on light paper. That leaves 4 usable Okabe-Ito hues, extended
with two further hues chosen for lightness separation:

| Token | Hex | Assigned type | Glyph |
|---|---|---|---|
| `--data-1` | `#0072B2` | `concept` | ■ |
| `--data-2` | `#009E73` | `technology` *(was amber `#d97706`)* | ▲ |
| `--data-3` | `#CC79A7` | `person` | ● |
| `--data-4` | `#762A83` | `company` | ◆ |
| `--data-5` | `#0E7490` | `project` | ▬ |
| `--data-6` | `#56B4E9` | first unknown type | ◇ |
| `--data-rest` | `#8595A9` | all remaining types | ○ |

Six distinct channels rather than a padded eight: two hues that collide are worse than one fewer
channel, and the glyph carries type identity anyway. Any type past `--data-6` renders in
`--data-rest` and the legend prints *"N further types share the remainder channel"* — capped,
never silently truncated.

Amber survives on the canvas in exactly one place: the **selection ring**. The guideline permits
this explicitly ("selection uses accent stroke/outline, never a data hue") — it is chrome
indicating *what the user picked*, not an encoding of what the node *is*.

**The findings histogram (violation 4) is fixed the same way.** `.fv-bar--verified` moves off
`var(--accent)` onto `--state-rich`, and the `VERIFIED_MIN` boundary gains a 1px dashed threshold
rule plus a mono axis tick — the guideline's "reference lines only where they encode a threshold."
The verified region then reads from *position* as well as hue, so it survives hue collapse.

`--focus` gains a proper token at `#2283E2` for the 2px focus ring, distinct from both chrome amber
and `--data-1` blue.

---

## 2. `src/graph/encoding.ts` — the single encoding source

New module. `src/graph/colors.ts` keeps `lighten`, `DIM_NODE`, `DIM_EDGE`, `EDGE_COLOR`,
`VISITED_MIX` and re-exports `typeColor` from here so existing imports do not break.

```ts
export interface TypeChannel { type: string; color: string; glyph: string; }

export function typeColor(type: string): string;   // hue channel
export function typeGlyph(type: string): string;   // shape channel — the CVD fallback
export function typeChannels(): TypeChannel[];     // legend + remainder reporting
export function remainderCount(): number;          // how many types share --data-rest
```

Assignment stays session-stable via the existing `Map` mechanism, so a type keeps its channel for
the life of the session. Determinism of the *layout* PRNG is untouched.

Consumers, all rendering the same `(color, glyph)` pair:

- `src/graph/canvasDraw.ts` — `drawNodeLabel` prefixes the glyph before the node label;
  `drawNodeHover` does the same in the hover card. We already own both functions, so this costs
  no new dependency and no shader work.
- `src/panels/LeftRail.tsx` — legend rows gain the glyph beside the swatch, plus the remainder line.
- `src/panels/Inspector.tsx` — type chips gain the glyph.
- `src/panels/FindingsView.tsx` — **no type references here**; see violation 4 below.

---

## 3. Calm technology

| Element | Now | After |
|---|---|---|
| `.blink` | 1.8s infinite | static; state carried by color + text |
| `.sb-dot`, `.sb-dot--mock` | 2.4s infinite | static dot + existing text label |
| `pulse-glow`, `avatar-ring` | 1.6s infinite | static ring |
| `body::after` film grain | slow infinite drift | **removed** — decorative ink, Tufte's first erasing principle |
| boot scan sweep, `dlpn-rise`, `dlpn-slidein` | one-shot | **kept** — motion that teaches where something came from |
| `prefers-reduced-motion` block | correct | kept, minus the rules for removed animations |

The keyframes themselves (`blink`, `pulse-glow`, `avatar-ring`, `dlpn-grain`) are deleted along
with their last usage, per the repo convention of cleaning up orphans your own change creates.

---

## 4. Honesty of materials

The guideline's `emitted | derived | projected` ladder maps onto delapan's real materials:

| Material | Tag | Why |
|---|---|---|
| Finding with `grounded_in` | **emitted** | extracted from a real source |
| Finding without `grounded_in` | **unattributed** | the source is gone; the UI already shows citations as unavailable, and this names it |
| Synopsis entry | **derived** | computed from findings, not itself a source |
| Coverage band (`rich`/`sparse`/`gap`) | **projected** | an embedding-similarity estimate, not a model output |

Rendered as a small mono uppercase tag (`0.6rem`, `--text-faint`, tabular where numeric). No API
change — every input is already on the wire.

This also fixes the coverage band's dual-encoding: `rich`/`sparse`/`gap` currently reads
green/amber/red, the textbook red-green CVD failure. It already carries a text label
(`LeftRail.tsx:322-329`); it gains a glyph (● ▲ ■) so the band is legible from shape alone.

---

## 5. Deference and Bauhaus pass

- **Chrome recedes.** The left rail keeps its width but drops to `--bg0` with a hairline right rule
  instead of a filled panel, so the canvas reads as the hero rather than one of three equal columns.
- **Hairlines only.** Any remaining `box-shadow` on a surface becomes a 1px `--line` border.
  Shadows survive only on genuinely floating layers (modal, toast, hover card), where they encode
  elevation rather than decorate.
- **Grid snap.** Padding, gaps, and gutters in `panels.css` / `layout.css` / `canvas.css` snap to
  the `--u` scale.
- **Tabular numerals.** `font-variant-numeric: tabular-nums` on every numeric display — stat
  counts, legend counts, findings counts, status bar figures.
- **Flush left.** Any `text-align: center` outside a chart/axis title is removed.
- **Hard-coded hexes.** The 7 remaining literals (`#8595a9` ×3, `#b45309` ×2, `#92400e` ×2,
  `#fbbf6e`) plus `canvasDraw.ts`'s `"#465a70"` and `"#b45309"` fallbacks move to tokens.

---

## 6. Enforcement

The source guideline backs its invariants with a runtime guard (`assertNonAdditive`). The
equivalent here is a test — `src/graph/encoding.test.ts`, running in the existing Vitest `node`
environment:

1. **Chrome ∩ data is empty.** No chrome token value appears in the data ring. A future
   contributor reintroducing amber-as-data fails the build.
2. **The ring is capped.** `typeChannels()` never exceeds 7 entries; overflow lands in
   `--data-rest` and `remainderCount()` reports it.
3. **Every color has a glyph.** No type can be color-only.
4. **Glyphs are distinct.** No two channels share a glyph — a duplicate would silently collapse
   the second channel.

---

## Files

| File | Change |
|---|---|
| `src/styles/tokens.css` | rewrite into chrome/data/state layers + grid scale (aliases kept) |
| `src/graph/encoding.ts` | **new** — color + glyph channels, cap, remainder |
| `src/graph/encoding.test.ts` | **new** — the four invariants above |
| `src/graph/colors.ts` | drop `BASE_COLORS`/`FALLBACK_RING`, re-export from `encoding.ts` |
| `src/graph/canvasDraw.ts` | glyph prefix in label + hover; tokenize the two hex fallbacks |
| `src/panels/LeftRail.tsx` | legend glyphs, remainder line, coverage-band glyph, provenance tags |
| `src/panels/Inspector.tsx` | type chips gain glyphs; provenance tag on `grounded_in` |
| `src/panels/FindingsView.tsx` | verified threshold rule + axis tick (violation 4) |
| `src/panels/StatusBar.tsx` | static dot, tabular numerals |
| `src/styles/panels.css` | grid snap, hairlines, tabular-nums, glyph/tag styles |
| `src/styles/layout.css` | rail deference, grid snap, blink removal |
| `src/styles/canvas.css` | grid snap, static ring, hairlines |
| `src/styles/base.css` | focus ring, tabular numerals, hairlines |
| `src/styles/motion.css` | delete ambient loops + grain; trim the reduced-motion block |
| `CLAUDE.md` | update the "visual language" convention paragraph — it currently says *dark* instrument panel, which is already stale (the theme is light) |

---

## Verification

Success criteria, each with its check:

1. **Type-check passes** → `npm run build` (strict: `noUnusedLocals` catches orphaned imports).
2. **Encoding invariants hold** → `npm run test`, including the 4 new assertions.
3. **No amber in the data channel** → `grep -rn "b45309\|d97706" src/graph/` returns only the
   selection-ring constant.
4. **No infinite ambient animation** → `grep -rn "infinite" src/styles/` returns only `.spin`
   (a loading spinner is a progress indicator, not ambient decoration).
5. **Visually correct** → dev server, screenshots of graph view, findings view, coverage probe,
   and inspector; confirm glyphs render on canvas labels and legend, and the rail recedes.
6. **CVD check** → screenshot passed through a deuteranopia simulation; every node type must
   remain distinguishable by glyph when hue collapses.

## Risks

- **Glyph legibility at small canvas label sizes.** Mitigation: the glyph renders at the label font
  size with a 1-space gap; if it reads as noise at default zoom, fall back to a bracketed letter
  code (`[c]`, `[t]`). Decide from the screenshot in check 5.
- **Removing the film grain changes the product's identity**, not just its compliance. Approved in
  brainstorming (2026-07-25) on Tufte's first erasing principle. Reversible in one commit.
- **`technology` changing from amber to green** will look wrong to anyone who has used the panel.
  This is the intended correction, not a regression.
