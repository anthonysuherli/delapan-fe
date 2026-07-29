# delapan.ai Public-Site Editorial Overhaul — Implementation Plan

> **STATUS: COMPLETE (2026-07-28).** All 9 tasks executed subagent-driven, plus 4
> controller fix rounds; merged to `main` as `96922ad` and live on delapan.ai.
> The unchecked boxes below are historical — implementers worked from per-task
> briefs extracted out of this file, so the checkboxes were never ticked in
> place. See the spec's "Outcome" section for what the plan got wrong (the
> `.site` cascade collision and the `mf-breathe` opacity contention).

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every delapan.ai public surface (landing, docs, legal, auth, site chrome) from the coral pixel-8 look to the approved "moss on parchment" editorial system, with a restrained immersive motion layer. Spec: `../specs/2026-07-28-site-editorial-overhaul-design.md`.

**Architecture:** All color/type decisions live in the `.site`-scoped token block in `src/styles/site.css`; surface stylesheets (`site-shell.css`, `landing.css`, `site-docs.css`, `auth.css`, a `.site` block in `motion.css`) consume tokens only (enforced by `literals.test.ts`). Components change minimally: one full-bleed band wrapper in `Resolution.tsx`, a scroll sentinel in `SiteShell.tsx`, a reveal hook in `LandingApp.tsx`. The app's own identity (`tokens.css`, canvas/console/panels) is untouched.

**Vision goals served:** *Hosted public tier with account isolation* (the beta's front door).

**Tech Stack:** React 18 + TS strict, Vite 6, plain CSS custom properties, Vitest (node env), no CSS framework.

## Global Constraints

- Repo: `frontend/` (delapan-fe). Base branch `main`; work in an isolated worktree on branch `feat/site-editorial-overhaul` (current checkout has unrelated WIP on `feat/engine-unreachable-trust`).
- `npm run build` (strict tsc; unused imports FAIL the build) and `npm run test` must be green at every commit.
- No raw color/z-index/px-radius literals outside `site.css`/`tokens.css` — `literals.test.ts` enforces; any deliberate exception needs an ALLOW entry with a one-line reason.
- Do not edit `src/panels/Logomark.tsx`, `src/panels/Wordmark.tsx`, `src/styles/tokens.css`, or any app surface. Do not change landing/docs copy.
- Accent discipline: moss appears only as links/underlines/badges/small marks; primary CTAs are ink-filled pills; accent is never a status color and never a background wash.
- All motion behind `prefers-reduced-motion: no-preference`.
- Match existing file style (comment density, naming — `lp-*`, `ss-*`, `sd-*`, `--p8-*`).

## Palette reference (single source: spec §Token layer)

ink `#1B1E18` · bone/parchment `#FAF8F1` · accent (moss) `#4C6640` · accent-deep `#3B5233` · accent-d (on-ink moss) `#A9BF97` · ink-2 `#252A22` · panel `#FFFFFF` · panel-2 `#F1EEE3` · muted `#5C5F52` · muted-2 `#8F927F` · line `rgba(27,30,24,0.12)` · line-2 `rgba(27,30,24,0.06)` · line-d `rgba(250,248,241,0.14)` · line-d2 `rgba(250,248,241,0.07)` · muted-d `#9AA08E` · status quartet unchanged.

---

### Task 1: Token layer rebrand (`site.css` + `site.test.ts` + `index.html`)

**Files:**
- Modify: `src/styles/site.css` (token block + scope base, lines 8–127)
- Modify: `src/styles/site.test.ts`
- Modify: `index.html` (Google Fonts href, line ~21)
- Modify (rename only): `src/styles/site-shell.css`, `src/styles/landing.css`, `src/styles/site-docs.css`, `src/styles/auth.css` (15 `--p8-coral*` references total)

**Interfaces:**
- Produces: tokens `--p8-accent`, `--p8-accent-deep`, `--p8-accent-d`, `--p8-space-section`, `--p8-font-serif`; `.site`-scoped overrides `--brand-ink/--brand-bone/--brand-coral`. All later tasks consume these names.

- [ ] **Step 1: Update the brand test to the new system (failing first)**

In `src/styles/site.test.ts` replace the `BRAND` map and add two assertions:

```ts
const BRAND: Record<string, string> = {
  "--p8-ink": "#1B1E18",
  "--p8-bone": "#FAF8F1",
  "--p8-accent": "#4C6640",
  "--p8-accent-deep": "#3B5233",
  "--p8-accent-d": "#A9BF97",
  "--p8-positive": "#1F9D6B",
  "--p8-warning": "#D98A2B",
  "--p8-critical": "#C2453B",
  "--p8-info": "#3D7BFF",
};
```

Add inside the describe block:

```ts
it("declares the serif accent register", () => {
  expect(siteCss).toContain('"Lora"');
});

it("carries no coral tokens after the moss rebrand", () => {
  expect(siteCss).not.toMatch(/--p8-coral/);
});
```

Update the file-header comment: `site.css` is now the public-site brand source of truth (the deprecated `delapan-ai-site` branding docs described the retired coral system). Rename the describe to "site.css defines the moss-on-parchment brand".

- [ ] **Step 2: Run to verify it fails** — `npm run test -- src/styles/site.test.ts` → FAIL (old hexes still present).

- [ ] **Step 3: Rebrand `site.css`**

In the `.site` token block: apply every value from the Palette reference above; rename `--p8-coral`→`--p8-accent`, `--p8-coral-deep`→`--p8-accent-deep`; add `--p8-accent-d: #A9BF97;`. Update `--p8-ink-2` to `#252A22`, `--p8-panel-2` to `#F1EEE3`, `--p8-muted` to `#5C5F52`, `--p8-muted-2` to `#8F927F`, `--p8-line`/`--p8-line-2` and the `-d` variants and `--p8-muted-d` per the reference. Update stale comments (e.g. "THE accent — the 8's intersection" → moss). Add:

```css
  --p8-font-serif: "Lora", Georgia, serif; /* italic statement register — never body */
  --p8-space-section: clamp(64px, 12vw, 160px); /* landing section rhythm */

  /* Shared mark components (panels/Logomark, Wordmark) resolve their fills
     through the app's --brand-* custom properties; remapping them here
     recolors the mark on public surfaces without touching the component. */
  --brand-ink: var(--p8-ink);
  --brand-bone: var(--p8-bone);
  --brand-coral: var(--p8-accent);
```

In the scope base: `.site a { text-decoration-color: var(--p8-accent); }`, `.site a:hover { color: var(--p8-accent-deep); }`.

- [ ] **Step 4: Rename the 11 consumer references** — in `site-shell.css` (2), `landing.css` (2), `site-docs.css` (1), `auth.css` (6): `var(--p8-coral)`→`var(--p8-accent)`, `var(--p8-coral-deep)`→`var(--p8-accent-deep)`. No other edits in this task.

- [ ] **Step 5: Add Lora to the font link** — in `index.html` append `&family=Lora:ital,wght@1,500;1,600` inside the existing `css2?` href (before `&display=swap`).

- [ ] **Step 6: Verify** — `npm run test` → all pass (site, literals, tokens suites). `npm run build` → clean.

- [ ] **Step 7: Commit** — `git add -A && git commit -m "feat(site): moss-on-parchment token layer, coral retired from public surfaces"`

### Task 2: Site chrome — nav + ink footer (`SiteShell.tsx` + `site-shell.css`)

**Files:**
- Modify: `src/site/SiteShell.tsx`
- Modify: `src/styles/site-shell.css`

**Interfaces:**
- Consumes: Task 1 tokens.
- Produces: `.ss-nav.is-scrolled` state class; `.ss-cta` as the ink pill (also used by `CtaRow` on landing).

- [ ] **Step 1: Scroll sentinel in `SiteShell.tsx`** — convert the component to use a nav ref + effect (keep all existing markup):

```tsx
import { useEffect, useRef, type ReactNode } from "react";
// inside SiteShell():
const navRef = useRef<HTMLElement | null>(null);
useEffect(() => {
  const nav = navRef.current;
  const sentinel = document.getElementById("ss-top-sentinel");
  if (!nav || !sentinel) return;
  const io = new IntersectionObserver(([entry]) => {
    nav.classList.toggle("is-scrolled", !entry.isIntersecting);
  });
  io.observe(sentinel);
  return () => io.disconnect();
}, []);
```

Render `<div id="ss-top-sentinel" aria-hidden="true" />` as the first child inside the `.site` div (before the skip link), and `ref={navRef}` on the `<nav className="ss-nav">`.

- [ ] **Step 2: Restyle chrome in `site-shell.css`**
  - `.ss-nav`: sticky top-0 on parchment (`background: var(--p8-bone)`), transparent bottom border by default; `.ss-nav.is-scrolled { border-bottom: 1px solid var(--p8-line-2); }` (adapt to whatever border/shadow it has today — shadows go).
  - `.ss-cta`: ink pill — `background: var(--p8-ink); color: var(--p8-bone); border-radius: var(--p8-radius-pill);` hover `background: var(--p8-ink-2)`. Remove any accent fill.
  - `.ss-signin`: plain link, moss underline on hover.
  - Footer block (whatever `.ss-footer*` rules exist): `background: var(--p8-ink); color: var(--p8-muted-d);` links `color: var(--p8-bone)` with `text-decoration-color: var(--p8-accent-d)`; column-heading/hairline rules use `var(--p8-line-d2)`; keep the dense multi-column layout (this dark, dense footer is the page's deliberate contrast).
  - `#ss-top-sentinel { height: 1px; }`

- [ ] **Step 3: Verify** — `npm run build && npm run test` green; `npm run dev`, load `/docs`: nav hairline appears only after scrolling; footer is ink; CTA is an ink pill.

- [ ] **Step 4: Commit** — `git commit -am "feat(site): parchment nav with scroll hairline, ink footer, ink-pill CTA"`

### Task 3: Landing editorial pass (`landing.css`)

**Files:**
- Modify: `src/styles/landing.css`

**Interfaces:**
- Consumes: `--p8-font-serif`, `--p8-space-section`, Task 1 palette.
- Produces: `.lp-kicker`/`.lp-section` rhythm used by Tasks 4–5.

- [ ] **Step 1: Restyle in `landing.css`** (adapt existing selectors; keep structure):

```css
.lp-hero h1 {
  font-family: var(--p8-font-serif);
  font-style: italic;
  font-weight: 500;
  font-size: clamp(2.5rem, 6vw, 3.9rem);
  letter-spacing: -0.015em;
  line-height: 1.12;
}
.lp-section { margin-top: var(--p8-space-section); }
.lp-kicker {
  font-family: var(--p8-font-display);
  font-size: var(--p8-text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--p8-muted);
}
```

- `.lp-lede`: measure ~34–60ch, `color: var(--p8-muted)`.
- `.lp-pillar` / `.lp-target` / WhatItIsnt contrast items: remove card backgrounds/borders/shadows; flat on parchment with `border-top: 1px solid var(--p8-line)` + generous padding-top (keep any existing `.lp-pillar-rule` element consistent with this).
- `.lp-close h2`: serif-italic statement (same treatment as hero h1 at ~`--p8-text-3xl`), surrounded by large whitespace (`padding: var(--p8-space-section) 0`).
- MarkField colors: `.mf-ink { fill: var(--p8-ink) }`-adjacent rules keep their current opacity story; `.mf-coral { fill: var(--p8-accent) }` (rename of var only, done in Task 1 — verify visually here).
- Remove/zero any remaining `box-shadow` usage in this sheet.

- [ ] **Step 2: Verify** — build + test green; dev server `/`: serif hero, tracked kickers, flat sections, big rhythm.

- [ ] **Step 3: Commit** — `git commit -am "feat(landing): serif statement register and whitespace-driven editorial rhythm"`

### Task 4: Resolution inverted band (`Resolution.tsx` + `landing.css`)

**Files:**
- Modify: `src/landing/Resolution.tsx` (outer element only)
- Modify: `src/styles/landing.css`

**Interfaces:**
- Consumes: Task 3 `.lp-section` rhythm.
- Produces: `.lp-band` full-bleed pattern.

- [ ] **Step 1: Band wrapper** — in `Resolution.tsx` change the outer element from `<section className="lp-inner lp-section">` to:

```tsx
<section className="lp-band lp-section">
  <div className="lp-inner">
    {/* existing children unchanged */}
  </div>
</section>
```

- [ ] **Step 2: Band styles** in `landing.css`:

```css
.lp-band {
  background: var(--p8-ink);
  color: var(--p8-bone);
  padding: var(--p8-space-9) 0;
}
.lp-band h2 { color: var(--p8-bone); }
.lp-band .lp-kicker { color: var(--p8-muted-d); }
.lp-band .lp-body { color: var(--p8-muted-d); }
.lp-band .lp-code { color: var(--p8-accent-d); }
.lp-band .lp-demo { background: var(--p8-ink-2); border: 1px solid var(--p8-line-d2); }
```

(Adapt `.lp-demo` to its existing rule shape; the video frame sits on `--p8-ink-2`.)

- [ ] **Step 3: Verify** — build + test green; dev `/`: exactly one dark band (Resolution), readable text, moss-tinted code tokens; band is full-bleed while its content stays in the `.lp-inner` column.

- [ ] **Step 4: Commit** — `git commit -am "feat(landing): resolution section as the page's inverted ink band"`

### Task 5: Motion layer — living MarkField + scroll reveal (`LandingApp.tsx`, new `useReveal.ts`, `landing.css`, `motion.css`)

**Files:**
- Create: `src/site/useReveal.ts`
- Modify: `src/landing/LandingApp.tsx`
- Modify: `src/styles/landing.css` (MarkField ambient)
- Modify: `src/styles/motion.css` (`.site` reveal block + reduced-motion)

**Interfaces:**
- Produces: `useReveal(selector: string): void` (safe to reuse on other pages later).

- [ ] **Step 1: Write `src/site/useReveal.ts`**

```tsx
/**
 * One-shot scroll reveal: tags matches with `.rv`, swaps in `.rv-in` the
 * first time each enters the viewport. No-op under prefers-reduced-motion —
 * the elements are then never hidden in the first place.
 */
import { useEffect } from "react";

export function useReveal(selector: string): void {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll(selector));
    els.forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}
```

- [ ] **Step 2: Wire into `LandingApp.tsx`** — `useReveal(".lp-section, .lp-close");` (hero excluded on purpose: nothing above the fold is ever hidden).

- [ ] **Step 3: Reveal CSS in `motion.css`** (append a `.site` section; tokens only):

```css
/* ---- public site: one-shot section reveal ---- */
.site .rv {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 500ms var(--p8-ease), transform 500ms var(--p8-ease);
}
.site .rv-in {
  opacity: 1;
  transform: none;
}
```

And inside the existing `@media (prefers-reduced-motion: reduce)` block: `.site .rv { opacity: 1; transform: none; transition: none; }`.

- [ ] **Step 4: MarkField ambient in `landing.css`** — extend `.mf-cell` with a slow breathing loop layered on the existing entrance animation (reuse each cell's `animation-delay`), e.g. add keyframes:

```css
@keyframes mf-breathe {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}
```

and on `.mf-cell` append `, mf-breathe 9s var(--p8-ease) infinite` to the existing `animation` shorthand (keep the entrance keyframes first; per-cell `animation-delay` staggers both). Confirm the existing reduced-motion rule at `landing.css:359` still zeroes all `.mf-cell` animation.

- [ ] **Step 5: Verify** — build + test green. Dev `/`: sections fade-rise once on scroll; MarkField shimmers slowly; with macOS Reduce Motion on (or DevTools emulation), page is fully static and nothing is hidden.

- [ ] **Step 6: Commit** — `git commit -am "feat(landing): ambient mark field and one-shot scroll reveal, reduced-motion safe"`

### Task 6: Docs + legal/info pages (`site-docs.css`)

**Files:**
- Modify: `src/styles/site-docs.css` (serves DocsPage, About, Changelog, Terms, Privacy, NotFound)

- [ ] **Step 1: Editorial reading treatment** — adapt existing `sd-*`/docs selectors:
  - Prose column `max-width: 70ch`.
  - Eyebrow/section labels: same tracked-out uppercase recipe as `.lp-kicker` (12px, `letter-spacing: 0.12em`, `--p8-muted`).
  - Code blocks: `pre { background: var(--p8-ink); color: var(--p8-bone); border-radius: var(--p8-radius); }` with inline-code accents `color: var(--p8-accent-d)` where the sheet colors tokens today; inline `code` on light stays ink on `--p8-panel-2`.
  - TOC: active item gets a moss indicator — `border-left: 2px solid var(--p8-accent); color: var(--p8-ink)`; inactive items `--p8-muted`. Keep/ensure `position: sticky`.
  - Tables/rules: `var(--p8-line)` hairlines; kill shadows; cards (if any) flatten to `--p8-panel` with hairline.

- [ ] **Step 2: Verify** — build + test green; dev pass over `/docs`, `/docs/findings`, `/about`, `/changelog`, `/terms`, `/privacy`, and a bogus path (404): consistent parchment/ink/moss, ink code blocks, sticky TOC with moss indicator.

- [ ] **Step 3: Commit** — `git commit -am "feat(docs): editorial reading column, ink code surfaces, moss toc indicator"`

### Task 7: Auth screens (`auth.css`)

**Files:**
- Modify: `src/styles/auth.css` (visual layer only — no logic/`betaAccess` changes)

- [ ] **Step 1: Restyle** — centered white panel (`background: var(--p8-panel); border: 1px solid var(--p8-line); border-radius: var(--p8-radius-lg)`, shadow none) on parchment; submit button = ink pill (same recipe as `.ss-cta`); links moss; error/pending/engine-down states keep the status quartet (`--p8-critical` etc. — the Task 1 rename already moved any coral usage to `--p8-accent`; where that rename left an accent *fill* on a button, convert it to the ink pill per accent discipline).

- [ ] **Step 2: Verify** — build + test green; dev `/login`, `/signup`: panels, pills, moss links; simulate engine-down if cheap (offline mock) else confirm styles via the EngineDown class names.

- [ ] **Step 3: Commit** — `git commit -am "feat(auth): parchment auth surfaces on the moss system"`

### Task 8: Favicon moss variant (`public/favicon.svg`)

**Files:**
- Modify: `public/favicon.svg`

- [ ] **Step 1:** Read the SVG; replace the coral intersection fill (`#FF6B4A`) with `#4C6640`. Figure/ground colors update to `#1B1E18`/`#FAF8F1` only if the current file uses the old ink/bone hexes.
- [ ] **Step 2:** Note (do not do): `favicon-16/32.png`, `apple-touch-icon-180.png`, `icon-512.png` still carry coral — flag as a follow-up in the final report, since PNG regeneration needs raster tooling.
- [ ] **Step 3: Commit** — `git commit -am "chore(brand): moss favicon"`

### Task 9: Full verification + evidence

**Files:** none (verification only)

- [ ] **Step 1:** `npm run build && npm run test` — both fully green.
- [ ] **Step 2:** `grep -rn "p8-coral\|FF6B4A\|E8431F" src/ index.html` → zero hits.
- [ ] **Step 3:** Dev-server visual pass with screenshots: `/`, `/docs`, `/docs/quickstart`, `/about`, `/changelog`, `/terms`, `/privacy`, `/login`, `/signup`, `/nope` (404) at desktop 1280 and mobile 375; accent audit per screen (moss = links/badges/marks only, CTAs ink pills, serif only in statement lines); reduced-motion pass on `/`.
- [ ] **Step 4:** Confirm the app is untouched: `git diff main --stat` shows changes only in the files this plan names.
- [ ] **Step 5:** Report: summary + screenshots + the PNG-favicon follow-up flag. Integration (merge/PR) via truenorth:finishing-a-development-branch with the user.
