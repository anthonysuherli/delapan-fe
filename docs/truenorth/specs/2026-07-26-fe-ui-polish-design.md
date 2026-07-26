# delapan-fe UI polish — instrument-grade foundation (spec 1 of 2)

**Date:** 2026-07-26
**Status:** ratified by user in brainstorming session (all four sections approved)
**Vision goals served:** "A graph you can watch grow live" (the node-enter primitive is the
rendering half of the live delta stream); "HITL decisions show their consequence first"
(a coherent, legible visual language is the substrate the consequence-preview surface
renders on); "Hosted public tier" (the console/auth journey is what beta users meet
first). Respects the non-goal "not a greenfield dashboard" — this evolves the existing
sigma.js control panel.

**Research base:** `frontend/design/ui-polish` KB (72 findings across three explores:
dashboard/control-panel craft, motion design, color systems — 2026-07-26), plus
`design/pixel8-branding` and `design/eg-guidelines-restyle`. Explore-tier findings
(confidence ~0.2–0.4) were used as directional input and cross-checked against the
codebase's existing conventions.

**Decisions from brainstorming:**

| Question | Decision |
|---|---|
| Primary goal | Design-system foundation first; features ride on it |
| Scope | Graph shell (`/kg`) + console + auth screens. Tracking, duet, landing untouched |
| Theming | Stay light-only; deepen the "daylight instrument panel" language. No dark theme |
| Motion | Refine existing system + build the node-enter primitive. No full immersive push |
| Structure | Two specs: this one (foundation/polish/motion), then spec 2 (⌘K palette, explore-on-canvas, findings↔graph cross-linking) |

---

## 1. Direction

The existing language — light-only, amber chrome, Okabe-Ito data ring, mechanical
easing — stays. This pass finishes it to instrument grade. Four governing principles:

1. **Chrome recedes, data leads.** Amber is never a data encoding (existing token
   contract rule); neutrals get quieter so the data ring and coverage bands are the
   only loud things.
2. **One glance, one verdict.** (5-second rule.) Rail top-left keeps primary stats;
   each surface answers "what's the state of this KB" before any interaction.
3. **Motion explains, never decorates.** Every animation encodes a state change.
   Ambient drift stays (it encodes "alive"); nothing new animates without a meaning.
4. **No raw values at call sites.** Colors, shadows, radii, z-indexes, durations all
   resolve through tokens — test-enforced.

## 2. Token architecture (completing `src/styles/tokens.css`)

Additions only; no restructure of the existing chrome/data/state contract.

- **Effects layer:** `--glow-1..3` — the amber `rgba(180,83,9,…)` alpha ladder,
  replacing 6 hand-copied rgba values in `canvas.css`. `--shadow-1..4` — elevation
  scale (control / raised / drawer / modal) consolidating the five ad-hoc shadows in
  `layout.css`, `panels.css`, `canvas.css`.
- **Radius scale:** `--r-1: 2px`, `--r-2: 4px`, `--r-3: 6px`, `--r-pill: 999px`.
  Retire bare `--radius` (alias during migration).
- **Z-index bands:** `--z-overlay`, `--z-search`, `--z-drawer`, `--z-modal`,
  `--z-toast`, `--z-boot` replacing 16 magic values (2→320) across 5 files.
- **Canvas colors into the contract:** `DIM_NODE`/`DIM_EDGE`/`EDGE_COLOR`
  (`src/graph/colors.ts`), `INK`/`INK_STRONG`/`CARD_FILL` (`src/graph/canvasDraw.ts`),
  and sigma `labelColor`/`edgeLabelColor` (`src/graph/GraphCanvas.tsx`) move into the
  TS mirror + `tokens.css`; the drift test extends to cover them.
- **Motion tokens:** add `--t-micro: 120ms` and a standard `--ease-out`; existing
  `--t-rise/settle/camera/ring/count/scan/step` scale and `--ease-mech` stay.
- **Identity:** one `<Wordmark>` component replacing the three divergent renderings
  (Big Shoulders `DELAPAN_8` vs lowercase Space Grotesk `delapan` in three near-identical
  CSS blocks). The auth card (`.tracking-login__panel`) is promoted out of
  `tracking.css` into the shared layer (signup/waitlist/sign-in depend on it).
- **Spacing rule:** structural spacing migrates to the `--uN` scale; deliberate 1–2px
  optical nudges may stay inline (allowlisted in the literal-scan test).
- **Interactive states** (hover/pressed/disabled) resolve through the token ladder
  (glow/shadow/intensity), not ad-hoc rgba.

## 3. Component polish (ordered by user-visible impact)

- **Inspector** (`src/panels/Inspector.tsx`): migrate the 15 inline `style={{}}` props
  to classes; give `.inp` size/emphasis variants so both `!important` escapes
  (`.ins-label-input`, `.lr-drift`) die; evidence confidence bars + bulk-ops toolbar on
  tokens. Keep the hotkey cheat-sheet empty state.
- **Left rail** (`src/panels/LeftRail.tsx`): uniform `.sect` rhythm on `--uN`; hover
  states on legend rows; drift-warning styling without `!important`.
- **Canvas chrome** (`src/styles/canvas.css`): viewfinder, reticle, hop-keys, relation
  popover, travel HUD onto glow/shadow/radius scales; one-off `edgeLabelColor` grey
  joins the contract.
- **Top bar** (`src/panels/TopBar.tsx`): `<Wordmark>` lands here first; search dropdown
  gets the drawer shadow token + keyboard-navigation affordances.
- **Console** (`src/console/ConsoleApp.tsx`): focus-visible rings, hover elevation
  (shadow-1→2) on tiles, tightened greeting hierarchy.
- **Auth screens** (`SignInForm`, `SignUpForm`, `PendingApp`, `AuthGate`): shared auth
  card, one wordmark, standardized field focus/error styling (error border + message at
  ~240ms; no shake).
- **Cross-cutting:** single `:focus-visible` treatment (amber, 2px, offset) everywhere;
  `.btn:active` press state; `panels.css` OKF block reformatted + tokenized.

## 4. States

- **First-run empty canvas:** explains why it's empty + offers the two real actions
  ("launch an explore" / "add your first node"). No stark placeholder.
- **Loading:** skeleton rows (findings table), skeleton tiles (console); canvas keeps
  boot-assembly stagger. Stale-data-with-"updating…" over blank panels on refetch.
- **Interstitials:** the three `.tracking-state` screens ("checking session…",
  "checking access…", "taking you home…") unify into one branded interstitial —
  wordmark + the existing `dlpn-scan` sweep.
- **Errors:** connection-lost banner driven by the existing live/mock status; inline
  per-field form errors; explore failure surfaced in the phase log with retry, not a
  dead-end toast.

## 5. Motion spec

**Normalization:** component durations (`drawer-in` 200ms, `modal-in` 140/160ms,
`toast-in` 220/280ms) map onto the token scale. Spec invariant: **enters slightly
longer than exits; nothing interactive above 500ms.** Micro pass: button press 90ms
scale-down, hover 120ms, focus ring instant-in/fade-out, field error 240ms. All
one-shot; all reduced-motion-aware.

**Node-enter primitive** — `enterNodes(graph, nodeIds, opts)` in `src/graph/motion.ts`:

- **With a known source** (created from a neighbor / grounded in an existing node):
  spawn at the source's position, fly the arc to final position along the connecting
  edge — `--t-rise`, `--ease-mech`, 28ms stagger (matching settle). Edge fades in
  behind it.
- **Without a source** (explore batch, manual add): scale-in at final position
  (size 0→target) with a one-shot amber reticle ring — same visual family as the
  selection pulse.
- **Batch guard:** above ~40 simultaneous enters, fall back to a single settle pass.
- **Exits:** 200ms fade-through-dim (undo toast covers safety).
- **Consumers in this spec:** add-node modal; explore completion (only *new* nodes
  animate instead of re-settling everything). The live delta stream later calls the
  same primitive — that is the point of building it now.
- Implementation constraint: sigma v3 reducers can't reposition nodes — position
  writes go through the existing rAF loop (`graph.updateEachNodeAttributes`), as
  `motion.ts` already does.

**View switching:** graph↔findings 160ms crossfade only. No morphing view transitions.

## 6. Enforcement & verification

- **Extended drift test:** `src/graph/encoding.test.ts` grows to prove the newly
  tokenized canvas colors mirror `tokens.css`.
- **Literal-scan test:** new Vitest check importing in-scope CSS via `?raw`, failing on
  raw hex/rgba/z-index/radius/duration literals outside `tokens.css`, with a small
  allowlist for optical nudges. Excluded: `tracking.css`, `landing.css`,
  `public/duet-app.html`.
- **Static polish:** browser screenshots per surface + keyboard-only walkthrough
  (visible focus ring on every interactive element).
- **Motion:** the preview pane throttles rAF to ~2fps — canvas motion is verified in a
  real browser tab (Playwright or manual) plus the reduced-motion path.
- **State combinations, not just entry paths:** exercise switch-while-inside flows
  (KB switch during findings view; explore completing while a drawer is open; travel
  mode + selection).
- **Accessibility gates:** WCAG AA contrast on every changed pair; reduced-motion
  parity for every new animation; focus-visible everywhere.

## 7. Acceptance criteria

1. Literal-scan + extended drift tests pass; zero raw values in in-scope files.
2. One `<Wordmark>`; one shared auth card; the three interstitials unified.
3. Empty/loading/error states implemented per §4 and screenshot-verified.
4. `enterNodes` works for add-node and explore-refresh (only new nodes animate),
   instant under reduced motion, batch fallback above ~40.
5. Existing test suite stays green.

## 8. Boundaries

- **Spec 2 (next brainstorm):** ⌘K command palette, explore-on-canvas materialization,
  findings↔graph cross-linking. Depends on this spec's tokens + enter primitive.
- **Non-goals:** dark theme; tracking/duet/landing surfaces; view-transition morphs;
  icon libraries (the unicode glyph set is deliberate identity and stays).
- **Open flag for planning:** auth screens live on the unmerged `feat/signup-path`
  branch — branch base (stack on it vs. wait for merge) is a writing-plans decision.

## Risks

- The literal-scan test could be noisy at first — mitigate with the allowlist and by
  landing it after the token migration, not before.
- `enterNodes` interacts with ambient drift and travel mode; the rAF loop must own a
  single position-authority order (enter > drift) to avoid fighting writes.
- Token renames (`--radius` → `--r-2`) touch many call sites; alias during migration
  and remove the alias as the final step.
