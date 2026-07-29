# delapan.ai public-site editorial overhaul — design

**Date:** 2026-07-28 · **Repo:** delapan-fe · **Status:** shipped — merged to `main`
as `96922ad` and live on delapan.ai (2026-07-28)

**Vision goals served:** *Hosted public tier with account isolation* — the public
landing/docs/auth surfaces are the front door of the invite-gated beta; this
overhaul raises their polish to release quality. No other End Goal is touched;
no Invariant is affected (all-frontend, no engine or store changes).

## Decisions ratified in-session

1. **Evolve pixel-8, don't clone Anthropic.** Keep the brand *grammar* moves
   from anthropic.com — warm paper ground, warm near-black ink, ONE sparingly
   used accent, serif-as-accent-register, whitespace-over-borders — but on our
   own palette.
2. **Depth: editorial + immersive.** Full token/type/spacing rework plus a
   restrained motion layer (living MarkField, scroll-reveal, hover polish).
3. **Palette: moss on parchment** (chosen over terracotta/oat, cobalt/paper,
   oxblood/bone). Coral retires from the public site.

## Scope

Everything inside the `.site` brand scope and its stylesheets:

- **Landing** — `src/landing/` (Hero, Problem, Pillars, Resolution, Coverage,
  WhereItPlugsIn, WhatItIsnt, ClosingCta) + `src/site/CtaRow.tsx`,
  `src/site/MarkField.tsx`.
- **Site chrome** — `src/site/SiteShell.tsx` (nav, footer, skip link).
- **Docs** — `src/site/DocsPage.tsx` + `src/site/docs/*` + `site-docs.css`.
- **Legal/info** — About, Changelog, Terms, Privacy, NotFound.
- **Auth** — `src/auth/` screens (SignUpForm, Interstitial, PendingApp,
  EngineDown) + `auth.css`, *visual layer only*; `betaAccess`/state logic
  untouched.
- **Stylesheets** — `site.css` (token layer), `site-shell.css`, `landing.css`,
  `site-docs.css`, `auth.css`, plus a small `.site`-scoped addition to
  `motion.css`. `index.html` (Google Fonts link).

**Explicitly out of scope:** the app (tokens.css, canvas/console/panels/
layout/tracking css, graph surfaces), `public/duet-app.html`, copy rewrites
(all landing/docs prose stays as-is), routing, state, API code, dark mode
(the public site stays single-look light, as today).

## Token layer (`site.css` — the only definition site)

Token renames make the accent semantic so the next rebrand is a value edit,
not a find/replace: `--p8-coral` → `--p8-accent`, `--p8-coral-deep` →
`--p8-accent-deep`. All other names keep, values change where listed.

| Token | New value | Notes |
|---|---|---|
| `--p8-bone` | `#FAF8F1` | parchment page ground (was `#F7F6F2`) |
| `--p8-ink` | `#1B1E18` | warm green-black ink (was `#0B0F14`); contrast on bone ≈ 15:1 |
| `--p8-accent` | `#4C6640` | moss — links, badges, small marks ONLY; ≈ 5.5:1 on bone (AA text) |
| `--p8-accent-deep` | `#3B5233` | hover/pressed moss |
| `--p8-accent-d` | `#A9BF97` | lightened moss for text/links on the ink band (AA on `#1B1E18`) |
| `--p8-ink-2` | `#252A22` | raised dark panel on the ink band |
| `--p8-panel` | `#FFFFFF` | card on parchment (unchanged) |
| `--p8-panel-2` | `#F1EEE3` | recessed panel, warmed |
| `--p8-muted` | `#5C5F52` | secondary text, warm sage-gray; ≈ 6:1 on bone |
| `--p8-muted-2` | `#8F927F` | tertiary/disabled |
| `--p8-line` | `rgba(27,30,24,0.12)` | hairline on light |
| `--p8-line-2` | `rgba(27,30,24,0.06)` | faint rule / mark grid |
| `--p8-line-d` / `-d2` | `rgba(250,248,241,0.14)` / `0.07` | hairlines on ink |
| `--p8-muted-d` | `#9AA08E` | secondary text on ink |
| status quartet | unchanged (`#1F9D6B/#D98A2B/#C2453B/#3D7BFF`) | never the accent's job; accent is never a status |

Accent discipline (the Anthropic rule): per viewport-screen, moss appears as
links/underlines, one badge, or one small mark — never a background wash,
never a filled primary CTA. **Primary CTA = ink-filled pill** (`--p8-ink` fill,
`--p8-bone` text, `border-radius: 999px`). Secondary = hairline-outline pill or
plain moss link.

New geometry/spacing tokens: `--p8-r-1..4` = 4/8/16/24px + `--p8-r-pill: 999px`;
`--p8-space-section: clamp(64px, 12vw, 160px)` for landing section rhythm.
Shadows effectively retired on the site (`--p8-shadow: none` or near-invisible);
separation comes from surface value (parchment → white/recessed → ink band).

## Type system

| Register | Face | Use |
|---|---|---|
| `--p8-font-display` | Space Grotesk (kept — closest free Styrene analog) | h2+, nav, buttons, kickers |
| `--p8-font-serif` **(new)** | `"Lora", Georgia, serif` — *italic, 500* | hero h1, one statement line per page, pull quotes. Never body text. |
| `--p8-font-body` | Inter (kept) | body, UI |
| `--p8-font-mono` | JetBrains Mono (kept) | code, `lp-code`, ids |

`index.html` font link adds `Lora:ital,wght@1,500;1,600` (italic subsets only).
Big Shoulders Display stays loaded for the app.

Scale/feel: keep the 1.25 major-third scale; weights top out at 600 (no
heavier); kickers (`.lp-kicker` and doc eyebrows) become tracked-out uppercase
(`letter-spacing: 0.12em`, 12–13px, `--p8-muted`), keeping their `01 —` index.

## Per-surface treatment

**SiteShell nav** — parchment, no border at top; a hairline (`--p8-line-2`)
appears only after scroll (`.is-scrolled`, one IntersectionObserver sentinel).
Sign-in stays a text link; "create account" is the single ink pill.

**Hero** — serif-italic h1 (Lora, ~clamp(2.4rem, 6vw, 4rem)); lede in Inter at
comfortable measure (~34ch–60ch); CtaRow = ink pill + mono beta note. MarkField
sits beside/behind at low contrast (cells in `--p8-line-2`/`--p8-panel-2`, moss
for the live intersection cell).

**Landing sections** — separated by `--p8-space-section` whitespace, no rules
or boxes. Pillars/targets/contrast cards lose card chrome: flat on parchment
with a thin top rule (`--p8-line`) and generous gaps.

**Resolution section → the inverted band.** Full-bleed `--p8-ink` background,
`--p8-bone` text, video framed on `--p8-ink-2`; `lp-code` tokens in moss-on-ink
(use a lightened moss `#A9BF97` for AA on ink — exposed as `--p8-accent-d`).
This is the page's one dark moment, per the Anthropic surface-value pattern.

**Coverage** — verdict glyphs keep the status quartet (dual-encoded, as today).

**ClosingCta** — serif-italic statement line + ink pill, huge whitespace.

**Footer** — moves onto the ink surface (dense multi-column on `--p8-ink`,
text `--p8-muted-d`, hairlines `--p8-line-d2`) — the deliberate dense/dark
contrast to the airy page above.

**Docs** — reading column ~70ch; sticky TOC with moss active indicator; code
blocks on `--p8-ink` with bone text; eyebrow labels tracked-out; tables/hairlines
via `--p8-line`. Same treatment inherits to About/Changelog/Terms/Privacy/404.

**Auth** — centered white panel (`--p8-r-3`) on parchment, ink-pill submit,
moss links; EngineDown/Pending keep their status colors. Visual restyle only.

**Mark recolor** — Logomark/Wordmark live in `src/panels/` (shared with the
app) — do NOT edit them. Their accent must resolve through a CSS custom
property so `.site` can remap it to moss; if the SVG hardcodes coral fill, add
a `var(--mark-accent, #FF6B4A)` default in the component (app unaffected) and
set `--mark-accent: var(--p8-accent)` inside `.site`. `public/favicon.svg`
gets a matching moss variant.

## Motion layer (all gated on `prefers-reduced-motion: no-preference`)

- **MarkField ambient** — slow cell-activity cycle (existing
  `markFieldCells.ts` stays pure; a rAF driver at ≤2 steps/sec — an interval,
  not per-frame work). Pausable via the reduced-motion gate; logic unit-tested.
- **Scroll-reveal** — one IntersectionObserver adds `.is-inview` to landing
  sections; CSS transitions opacity 0→1 / translateY 12px→0, 500ms ease-out,
  fire-once. No parallax, no scroll-jacking.
- **Hover** — 150ms color/underline transitions on links, pills, nav.
- Motion CSS lives in a `.site`-scoped block appended to `motion.css` (in the
  literal-scan; tokens only).

## Tests & verification

1. **`site.test.ts`** — BRAND map updated to the new hexes + renamed accent
   tokens; add an assertion that `"Lora"` is declared; keep the `.site`-scoping
   and ink-body-color assertions. (This test pinning old coral values failing
   first is expected — it's the loud-rebrand tripwire working.)
2. **`literals.test.ts`** — rules unchanged; all new colors enter via
   `site.css` tokens so the scan stays green. Any new deliberate literal gets
   an ALLOW entry with a one-line reason.
3. **`markFieldCells.test.ts`** — extended for any ambient-cycle logic.
4. **Gates:** `npm run build` (strict tsc) + `npm run test` green.
5. **Visual:** dev-server pass over `/`, `/docs`, `/docs/*`, `/about`,
   `/changelog`, `/terms`, `/privacy`, `/login`, `/signup`, `/404`, at desktop
   and 375px mobile, plus a reduced-motion check; screenshots shared as proof.

## Acceptance criteria

- Every public route renders the moss/parchment system; no coral remains
  anywhere under `.site`; the app is pixel-identical to before.
- Accent audit: on any single screenful, moss appears only as links/underline/
  badge/mark — CTAs are ink pills.
- Serif appears only in hero h1, statement lines, and pull quotes.
- Landing reads as whitespace-separated editorial sections with exactly one
  inverted ink band (Resolution) + ink footer.
- Reduced-motion users get a fully static page; others see ambient MarkField +
  one-shot section reveals.
- Both test gates green; literal-scan green; fonts limited to one added family.

## Risks / notes

- Moss (#4C6640) vs `--p8-positive` (#1F9D6B) are distinguishable (dark sage
  vs bright green) and never co-occur in the same role; status stays
  glyph+label dual-encoded, so no hue-only meaning exists.
- `delapan-ai-site/docs/branding/tokens.css` (the deprecated repo) remains the
  *old* brand's source of truth; after this ships, `site.css` becomes the
  public-site source of truth — the site.test.ts header comment gets updated
  to say so.
- Written first into the unversioned `8star/delapan-ai/docs/` working folder,
  which tracks nothing; relocated here on 2026-07-28 alongside the other
  delapan-fe specs. New frontend specs/plans belong in this repo's
  `docs/truenorth/` from the start.

## Outcome (added 2026-07-28, post-ship)

Delivered on branch `feat/site-editorial-overhaul` (13 commits), merged to `main`
as `96922ad`, auto-deployed to delapan.ai by Vercel. Gates at merge: 255/255
vitest, clean `tsc` + `vite build`, `assert-no-mock` ok.

Two things the plan did not anticipate, both now encoded in tests:

- **A CSS cascade-collision class hit six times on one branch, invisible to
  every test.** `.site`-scoped base element rules (`.site h1`, `.site a`;
  specificity 0,1,1; imported last) silently beat single-class surface rules —
  producing an invisible primary CTA sitewide and a serif register that never
  applied. Fixed by wrapping the `.site` base rules in `:where()` (zero
  specificity); that inversion then broke `.auth-card h1` the other way.
  Guarded now by a `:where()` invariant assertion in `site.test.ts`.
- **`--p8-accent-d` exists because moss-on-ink fails WCAG.** `src/styles/
  contrast.test.ts` now asserts the ratios directly, including
  `accent`-on-`ink` < 3, so the reason for the second accent token is
  executable rather than folklore.

Deferred, not done: the raster icon set (`favicon-16/32.png`,
`apple-touch-icon-180.png`, `icon-512.png`) is still coral, and `icon-512.png`
is the `og:image` — social previews show the retired brand until regenerated.
