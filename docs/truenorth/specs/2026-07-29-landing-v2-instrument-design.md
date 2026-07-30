# Landing v2 — instrument-panel rebuild from the design handoff

**Date:** 2026-07-29
**Status:** Approved (session 2026-07-29; supersedes the same-day
`2026-07-29-landing-hero-animation-concision-design.md` — that branch
(`feat/landing-hero-supersede`) stays parked, unmerged, as a fallback)
**Vision goals served:** "Hosted public tier with account isolation" — the
public landing page at `/`. The page's conversion strategy is docs-first (see
Ratified decisions); the hosted-tier signup stays reachable via `/login`,
`/signup`, and the FAQ's hosted-beta answer, but no longer owns the landing CTA.

## Canonical design

`docs/handoff/landing-v2/Landing Page v2.dc.html` (vendored from the user's
design bundle) is the pixel-accurate target; `docs/handoff/landing-v2/README.md`
is the written spec for every value, behavior, a11y gap, and responsive note.
**Where this document and the handoff disagree, the handoff wins, except for
the Deviations listed below.** The other two HTML files are context (wireframes;
superseded v1) — do not build them.

## Ratified decisions (brainstorm 2026-07-29)

1. **Adopt v2 verbatim** — the app's "daylight instrument panel" design system
   (cool paper `--bg0 #f5f7fa`, hairlines, Big Shoulders Display / IBM Plex
   Mono / IBM Plex Sans, single amber annunciator accent), not the site's
   moss-on-parchment. The landing page carries its own v2 header + footer;
   docs/about/auth pages keep the current SiteShell until a follow-up pass.
2. **Docs-first CTA, as designed** — one CTA (`read the docs` → `/docs`)
   in nav + hero + closing; install line as plain text, never a second button.
   No account CTA on the landing page.
3. **Fresh branch off main** (`feat/landing-v2-instrument`);
   `feat/landing-hero-supersede` is superseded but kept.

## Page structure (one screen, from the handoff)

Sticky header (60px, blurred paper, logo lockup + `how it works`/`faq`/CTA) →
hero (eyebrow `grounding engine`; Big Shoulders 700 `clamp(60px,7.8vw,108px)`
uppercase headline "design an agent memory you can audit", max-width 17ch;
53ch subhead; CTA row) → **interactive graph proof** (520px canvas, 22 nodes /
31 edges inlined, drag + select, evidence panel showing the selected node's
`grounded_in` findings with TypeChip, ConfidenceBar, provenance link) →
`#how` "three moves, in order" (01 ground / 02 grow / 03 answer) + VerdictBand
preamble sample ("what an answer looks like") → three use-case rows (for
agents / for research / for audit) → `#faq` accordion (5 items, first open) →
closing CTA ("ground it once") → footer (`delapan · mit`, docs/github/mcp/
changelog). Section rhythm: `padding-top: 132px` everywhere (graph: 64px —
it belongs to the hero).

## Implementation shape

- **Route:** `LandingApp` no longer wraps in `SiteShell`; it renders the v2
  frame itself. All other routes untouched.
- **New files** under `src/landing/` (one component per section) plus
  `src/landing/graphData.ts` (the `N`/`E`/`F` literals + type-color map,
  copied exactly from the prototype's script block) and
  `src/landing/KbGraph.tsx` (the interactive island — pointer drag, selection,
  hover, evidence panel; state and derivations per README "State Management").
- **Ported DS primitives** (from `_ds/_ds_bundle.js` sources, rendered
  appearance matched exactly): `Logomark` (brilliant-cut faceted 8 — replaces
  nothing; the existing `src/panels/Logomark.tsx` pixel-grid mark stays for the
  app), `Button`, `TypeChip`, `ConfidenceBar`, `VerdictBand` → `src/landing/ds/`.
- **Tokens:** new definition file `src/styles/landing-v2-tokens.css` carrying
  the handoff's color/typography/geometry/semantic custom properties (this file
  is a definition site, exempt from the literal scan like `site.css`/`tokens.css`).
  `src/styles/landing.css` is rewritten for v2 and **stays in the literal-scan**
  — every value resolves through the new tokens.
- **Fonts:** all three v2 families already load in `index.html` — no font work.
- **State:** all local to the graph island and FAQ; no store, no API. Data is
  inlined; if it ever goes live it needs loading/error/empty states (flagged
  by the handoff — out of scope here).

## Deviations from the handoff (each deliberate, user-visible)

1. **Install line:** `npx delapan init` does not exist (npm 404; the engine is
   Python/uv). Replace both occurrences with
   `git clone https://github.com/anthonysuherli/delapan` and change the closing
   section's support line to "one clone puts a knowledge base on your machine.
   nothing to provision." A page arguing for auditability cannot ship a dead
   command.
2. **Real hrefs:** CTA → `/docs`; footer docs → `/docs`, github →
   `https://github.com/anthonysuherli/delapan` (NOT delapan-be — private since
   the 07-28 rename), mcp → `/docs/quickstart` (the MCP section), changelog →
   `/changelog`. Evidence-panel provenance links (`github.com ↗` etc.) render
   as non-interactive text — the prototype pointed them at `#top`, and a fake
   link is worse than none.
3. **A11y closes** (handoff's own punch list): FAQ triggers are real `<button>`
   elements with `aria-expanded`/`aria-controls`; graph nodes are keyboard
   focusable (Enter/Space selects; the evidence panel is `aria-live="polite"`);
   `prefers-reduced-motion` disables the 420ms node transitions and smooth
   scroll; the Logomark gets an accessible name in the header and `aria-hidden`
   in the footer; `scroll-margin-top: 76px` on `#how` and `#faq`.
4. **Responsive minimum** (the handoff leaves narrow widths undesigned):
   below 720px the use-case rows stack (the 220px label column moves above),
   the graph canvas drops to 380px height with `graphDensity="core"` (14
   flagged nodes) and tap-to-select only (no drag); header nav keeps only the
   CTA below 480px. These are the smallest honest choices, not a full mobile
   design pass.
5. **Selection/`::selection` tint, link colors, `text-wrap: pretty`** move into
   `landing.css` scoped under `.lpv2` (the v2 root class) rather than global
   element selectors — the rest of the site must not inherit v2 styles.

## What this replaces

All current `src/landing/*` section components and the landing-specific rules
in `src/styles/landing.css`. `MarkField`/`markFieldCells` (used only by the old
hero) are deleted on this branch too. `SiteShell`, docs pages, auth, tracking,
console: untouched.

## Verification

- `npm run build` + `npm run test` (literal-scan on the rewritten landing.css;
  existing suite; new tests for graph derivations — degree/neighbor/lit-set —
  and FAQ toggle state).
- Browser: side-by-side against the prototype at `http://localhost:8765`
  (handoff server) for pixel fidelity; drag + select + evidence panel; FAQ
  keyboard operation; reduced-motion; 375px and 768px passes; zero console
  errors.
- Copy: every domain noun matches the handoff verbatim (finding, grounded_in,
  preamble, coverage rich/sparse/gap, explore, schema drift, synopsis).
