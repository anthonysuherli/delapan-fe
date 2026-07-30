# Landing page polish — animated supersede hero + concision pass

**Date:** 2026-07-29
**Status:** Approved (brainstorm session 2026-07-29)
**Vision goals served:** "Hosted public tier with account isolation" — the public
landing page at `/` is the front door of the hosted tier; this makes its core
argument (self-correcting, grounded memory) visible in the first viewport
instead of buried in prose and a below-the-fold video.

## Context

The landing page (`src/landing/`) is eight sections of well-written but dense
prose. Its only visuals are the decorative `MarkField` pixel scatter behind the
hero, a click-to-play 30s video in section 03 (Resolution), and the three
coverage glyphs. A KB research run (24 findings → `frontend/main`, exploration
`4a2baec05b1e41119904444ffb8e22a2`) on how popular developer tools design
landing pages produced the guardrails used here:

- Two hero poles: Linear (pure text, explicit anti-pattern on animated hero
  illustrations) vs Vercel/Loom (motion, embedded self-demo). Resend sits
  between: the hero visual is a code block; the page reads like documentation.
- Stripe copy rule: specific over abstract; if a sentence could appear in any
  SaaS company's copy, rewrite it until it can't.
- Hierarchy norm: headline → product visual → proof → features.
- CTAs: primary uses a specific verb; secondary is visually lighter and points
  at docs/GitHub.

Decisions ratified in the brainstorm: hero gets a real product visual (the
supersede chain), the Resolution video section is retired as redundant, and the
remaining copy gets a trim-and-restructure pass.

## 1. Hero — `SupersedeChain` animation

New component `src/landing/SupersedeChain.tsx`, rendered by `Hero.tsx` in place
of `MarkField`. The hero is `MarkField`'s only call site, so the swap orphans
it: delete `src/site/MarkField.tsx`, `src/site/markFieldCells.ts`, and
`src/site/markFieldCells.test.ts` (`panels/Logomark` stays — it has its own
consumers). Pure SVG animated by CSS keyframes in `landing.css`; no JS timers,
no new dependencies.

**The loop** (~10s, then holds on the final frame before restarting):

1. A finding card appears, connected by a hairline `grounded_in` rule to a
   small source glyph.
2. A contradicting candidate card slides in from the right.
3. A resolver row ticks through `add / update / noop / supersede` in mono type
   and lands on `supersede`.
4. The original fact stays in place but dims — stamped `invalidated_at`, with a
   `superseded_by` arrow pointing at the new fact. Nothing leaves the frame:
   the visual argument is the product argument (retired, never deleted).

**Layout:** two-column hero on desktop (copy left, animation right), stacked
with the animation below the copy on mobile.

**Constraints:**

- SVG is `aria-hidden`; the h1 + lede remain the text alternative.
- `prefers-reduced-motion: reduce` shows the final (post-supersede) frame
  statically — the story is legible without motion.
- All fills/opacities resolve through classes in `landing.css` so the
  literal-scan tests govern the colors; inline styles limited to animation
  delays (the `MarkField` precedent). Palette stays within existing brand
  tokens — instrument-panel quiet, per the Linear guardrail.
- No LCP regression: inline SVG ships in the HTML/JS already loaded; no media
  bytes.

## 2. Retire Resolution (section 03)

- Remove `Resolution` from the `SECTIONS` array in `LandingApp.tsx`; delete
  `src/landing/Resolution.tsx`.
- Remove `public/demo-resolution.mp4` and `public/demo-resolution-poster.png`.
- Kicker numbering derives from array position, so remaining sections renumber
  automatically. The page goes from 6 numbered sections to 5.

## 3. Copy trims

Stripe rule applied throughout; keep every `lp-code` token (`grounded_in`,
`superseded_by`, …) — they are the specificity.

| Section | Change |
|---|---|
| Problem | Two paragraphs merge into one, ~2 sentences: duplicate facts on re-ingest, contradictions retrieved at random, no provenance on answers. |
| Pillars | Each of the three cards cut to ~2 lines. |
| Coverage | Body paragraph cut to one sentence; verdict rows unchanged. |
| WhereItPlugsIn | Each of the three cards cut to ~2 lines. |
| WhatItIsnt | Contrast bodies halved; the "what isn't built yet" planned list unchanged — it earns the trust the page claims. |
| ClosingCta | Unchanged. |

## 4. CTA

`CtaRow` keeps `create an account` as primary and gains a lighter secondary
link — `view the engine on GitHub` → the public `delapan` repository —
styled as the quiet/outlined counterpart per the research pattern. The beta
note string stays single-sourced in `CtaRow`.

## 5. Verification

- `npm run build` — strict type-check; catches orphaned imports from the
  Resolution removal.
- `npm run test` — literal-scan/cascade tests govern the new CSS.
- Dev-server eyeball: animation loop, `prefers-reduced-motion` static frame,
  mobile stacking, no horizontal scroll.

## Out of scope

Nav/footer (`SiteShell`), docs pages, auth pages, any backend change.
