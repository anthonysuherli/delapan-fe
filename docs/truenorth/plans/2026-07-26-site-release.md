# delapan.ai Site Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the pixel-8 brand system onto the marketing surfaces and ship the public site: redesigned landing, docs (quickstart + 5 concepts), terms, privacy, changelog, about, and a branded 404.

**Architecture:** A `.site`-scoped brand token layer (`src/styles/site.css`, transcribed from the source of truth at `delapan-ai-site/docs/branding/tokens.css`, drift-tested), a `src/site/` module (SiteShell + pages), landing restaged onto brand tokens with a deterministic generative mark-field hero, and a routing flip that replaces the auth-gate catch-all with a 404. Pages are built first; routing wires them last so no task ships stubs.

**Vision goals served:** "Hosted public tier" front door; clears the hardening-minimum ToS+privacy debt.

**Tech Stack:** Existing Vite + React 18 + TS strict + plain CSS. **No new dependencies.**

**Spec:** `docs/truenorth/specs/2026-07-26-site-release-design.md`.

## Global Constraints

- Branch: create `feat/site-release` off `main`. Work in-place (repo SDD convention); verify `git branch --show-current` in every dispatch.
- Baseline: 142 tests, `npm run build` clean.
- Brand rules (from `delapan-ai-site/docs/branding/CLAUDE.md`): coral is THE accent and never carries body text; never recolor the mark's figure; never drop the coral intersection; no shadows/effects on the mark; voice is lowercase, precise, no exclamation marks, no emoji.
- Marketing surfaces render under a `.site` root class; `--p8-*` tokens are used ONLY under `.site`-scoped rules. The panel/console/tracking/duet keep the app language untouched.
- Copy discipline: no invented metrics, no invented customers/logos, no marketing superlatives. Beta is framed honestly ("free · invite-gated beta" survives).
- Legal pages are template-grade with a literal `[contact email]` placeholder; the user fills it at review. NEVER submit auth forms during verification.
- `npm run build` strict (noUnusedLocals); tests in node env (no DOM).
- The existing literal-scan test must stay green: `site.css` is a definition site (add it to the exempt list alongside `tokens.css`); any other new site-scoped stylesheet joins the SCANNED set.
- Determinism: no `Math.random()` anywhere (hero field uses a hashed seed).

---

### Task 1: Brand bridge — site.css + fonts + drift test

**Files:**
- Create: `src/styles/site.css`, `src/styles/site.test.ts`
- Modify: `index.html` (fonts line), `src/main.tsx` (import), `src/styles/literals.test.ts` (exempt note only if it scans by explicit list — check; site.css must NOT be added to its SHEETS map)

**Interfaces:**
- Produces: every `--p8-*` custom property from the source of truth, declared on `.site` (NOT `:root` — scope is the point). Class `.site` also sets `background: var(--p8-bone); color: var(--p8-ink); font-family: var(--p8-font-body); font-size: var(--p8-text-base); line-height: 1.6;`.

- [ ] **Step 1: Branch** — `git checkout main && git checkout -b feat/site-release`.
- [ ] **Step 2: Failing drift test.** Create `src/styles/site.test.ts`:

```ts
/**
 * The marketing token layer mirrors the brand source of truth
 * (delapan-ai-site/docs/branding/tokens.css). A rebrand upstream must fail
 * here loudly, not drift silently.
 */
import { describe, expect, it } from "vitest";
import siteCss from "./site.css?raw";

const BRAND: Record<string, string> = {
  "--p8-ink": "#0B0F14",
  "--p8-bone": "#F7F6F2",
  "--p8-coral": "#FF6B4A",
  "--p8-coral-deep": "#E8431F",
  "--p8-positive": "#1F9D6B",
  "--p8-warning": "#D98A2B",
  "--p8-critical": "#C2453B",
  "--p8-info": "#3D7BFF",
};

describe("site.css mirrors the pixel-8 brand", () => {
  it("declares every core brand hex verbatim", () => {
    for (const [token, hex] of Object.entries(BRAND)) {
      const re = new RegExp(`${token}:\\s*${hex};`, "i");
      expect(re.test(siteCss), `${token} should be ${hex}`).toBe(true);
    }
  });

  it("scopes the tokens to .site, not :root", () => {
    expect(/\.site\s*\{/.test(siteCss)).toBe(true);
    expect(/:root\s*\{/.test(siteCss)).toBe(false);
  });

  it("declares the brand type trio", () => {
    expect(siteCss).toContain('"Space Grotesk"');
    expect(siteCss).toContain('"Inter"');
    expect(siteCss).toContain('"JetBrains Mono"');
  });

  it("keeps coral out of body text color declarations", () => {
    // coral may fill CTAs/accents; `.site` base color must be ink
    expect(/\.site\s*\{[^}]*color:\s*var\(--p8-ink\)/s.test(siteCss)).toBe(true);
  });
});
```

- [ ] **Step 3: Run to fail** — `npx vitest run src/styles/site.test.ts` → module not found.
- [ ] **Step 4: Create `src/styles/site.css`.** Transcribe the ENTIRE token block from `/Users/anthonysuherli/Repositories/8star/delapan-ai-site/docs/branding/tokens.css` lines 9–79 **verbatim** (all `--p8-*` declarations, keeping the section comments), but declared on `.site { … }` instead of `:root { … }`. Prepend a header comment naming the source of truth. Append the scope base rules:

```css
/* ---- scope base -------------------------------------------------------- */

.site {
  background: var(--p8-bone);
  color: var(--p8-ink);
  font-family: var(--p8-font-body);
  font-size: var(--p8-text-base);
  line-height: 1.6;
  min-height: 100%;
  overflow-y: auto;
  -webkit-font-smoothing: antialiased;
}

.site h1,
.site h2,
.site h3 {
  font-family: var(--p8-font-display);
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--p8-ink);
}

.site a {
  color: var(--p8-ink);
  text-decoration-color: var(--p8-coral);
  text-underline-offset: 3px;
  transition: color var(--p8-dur-fast) var(--p8-ease);
}

.site a:hover {
  color: var(--p8-coral-deep);
}

.site code,
.site pre {
  font-family: var(--p8-font-mono);
  font-size: var(--p8-text-sm);
}

.site :focus-visible {
  outline: 2px solid var(--p8-info);
  outline-offset: 2px;
}
```

- [ ] **Step 5: Fonts.** In `index.html`, extend the Google Fonts href with `&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500` (keep the existing families — the app still uses them).
- [ ] **Step 6: Import.** In `src/main.tsx`, add `import "./styles/site.css";` after `auth.css` (before `motion.css`).
- [ ] **Step 7: Verify** — drift test PASS; `npm run test` (142 + 4) and `npm run build` clean. Confirm `literals.test.ts` does not scan site.css (its SHEETS map is explicit — no change needed; note this in the report).
- [ ] **Step 8: Commit** — `feat(site): pixel-8 brand token bridge, scoped and drift-tested`.

---

### Task 2: Head hygiene — meta, OG, favicons, usePageTitle

**Files:**
- Modify: `index.html`
- Create: `src/site/usePageTitle.ts`
- Copy assets: from `/Users/anthonysuherli/Repositories/8star/delapan-ai-site/docs/branding/assets/` into `frontend/public/`: `favicon.svg`, `favicon-32.png`, `favicon-16.png`, `apple-touch-icon-180.png`, `icon-512.png`.

**Interfaces:**
- Produces: `usePageTitle(title: string): void` — sets `document.title` on mount, restores nothing on unmount (SPA; last-write-wins is fine and stated in the comment).

- [ ] **Step 1: Copy the five asset files** (exact `cp` commands, verify with `ls -la public/`). Also create `public/robots.txt`:

```
User-agent: *
Disallow: /tracking
Disallow: /duet
Disallow: /kg
Allow: /
```
- [ ] **Step 2: Rewrite the `<head>`** in `index.html`: title `delapan — agent memory you can audit`; `<meta name="description" content="delapan researches a domain once, keeps every fact with the source it came from, and corrects itself when the facts move — without losing what it knew." />`; OG tags (og:title, og:description same values, og:type website, og:url https://delapan.ai/, og:image https://delapan.ai/icon-512.png); twitter:card summary; favicon links (svg + 32/16 png + apple-touch-icon). Change the inline FOUC guard background from `#f5f7fa` to `#f7f6f2` with a comment `/* --p8-bone; landing is the first paint */`.
- [ ] **Step 3: Create `usePageTitle.ts`:**

```ts
import { useEffect } from "react";

/** Sets document.title for a site page. SPA last-write-wins; no restore. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
```

- [ ] **Step 4: Verify** — build + tests green; `npm run dev`, curl `/` and confirm the head tags render.
- [ ] **Step 5: Commit** — `feat(site): real head — title, meta, OG, favicons`.

---

### Task 3: SiteShell + CtaRow + NotFound

**Files:**
- Create: `src/site/SiteShell.tsx`, `src/site/CtaRow.tsx`, `src/site/NotFound.tsx`, `src/styles/site-shell.css`
- Modify: `src/main.tsx` (import site-shell.css after site.css), `src/styles/literals.test.ts` (ADD site-shell.css to the SHEETS map — it is a consumer sheet, scanned)

**Interfaces:**
- Produces:
  - `SiteShell({ children, active }: { children: ReactNode; active?: "docs" | "changelog" | "about" })` — renders `.site` root > skip-link > nav (Logomark 32 + `<Wordmark form="lower">` linking `/`; links `/docs`, `/changelog`, `/about` with `aria-current` on active; `sign in` link + `create account` coral CTA) > `<main id="main">{children}</main>` > footer (columns: product → `/`, `/changelog`, `/about`; docs → `/docs`, quickstart/concepts anchors; legal → `/terms`, `/privacy`; contact → `github.com/anthonysuherli/delapan-be` link; bottom line `© 2026 delapan · agent memory you can audit`).
  - `CtaRow()` — `create an account` coral button → `/signup` + note `free · invite-gated beta` (single source of that string).
  - `NotFound()` — `usePageTitle("delapan — page not found")`, mark at 48, `this page doesn't exist`, links home / docs / sign in, wrapped in SiteShell.
- Consumes: `Logomark` (`../panels/Logomark`), `Wordmark` (`../panels/Wordmark`), `usePageTitle` (Task 2).

Build to the interface contract above (this task is contract-specified, not code-transcribed; the reviewer verifies against the contract). Nav collapses below 768px to mark + a `<details>` disclosure menu — no drawer, no JS state. `site-shell.css` styles: `.ss-nav` (sticky, bone with `--p8-line` hairline), `.ss-cta` (coral fill, bone text — the ONE place coral fills; `:hover` coral-deep), `.ss-footer` (4-col grid → stacks at 640px, `--p8-muted` text, `--p8-space-9` top margin), `.ss-skip` (visually hidden until focus). All values `--p8-*` tokens; zero raw literals (the scan enforces).

- [ ] Steps: write CSS + components (full code in-plan), verify build + literal-scan green, commit `feat(site): shell — nav, footer, cta, 404`.

---

### Task 4: Landing restage onto the brand

**Files:**
- Modify: `src/styles/landing.css` (rewrite), `src/landing/LandingApp.tsx`, `src/landing/Hero.tsx` (nav removed — SiteShell owns it), `src/landing/ClosingCta.tsx` + `src/landing/Hero.tsx` (both adopt `<CtaRow/>`), `src/landing/Footer.tsx` (DELETED — SiteShell's footer replaces it), `src/landing/*.tsx` (kicker auto-numbering)
- Modify: `src/styles/literals.test.ts` (landing.css is ALREADY scanned? — it was excluded in the UI-polish scope; ADD it now: it becomes a `.site` consumer sheet)

**Interfaces:**
- Consumes: SiteShell, CtaRow (Task 3); `--p8-*` tokens (Task 1).
- Produces: `LandingApp` renders `<SiteShell><Hero/>…</SiteShell>`; section components accept `index: number` and render `String(index).padStart(2, "0")` kickers — `LandingApp` composes `[Problem, Pillars, Coverage, WhereItPlugsIn, WhatItIsnt].map((S, i) => <S key={i} index={i + 1} />)`.

Design rules for the rewrite (all copy VERBATIM from the current components — no copy edits):
- `.lp` sections: `padding: var(--p8-space-9) 0` desktop, `--p8-space-7` below 768px; measure `max-width: 72ch` for prose, `1080px` for grids; hairline separators `--p8-line`.
- Hero: h1 `clamp(var(--p8-text-3xl), 6vw, var(--p8-text-5xl))` Space Grotesk; lede `--p8-text-lg` `--p8-muted`; kickers JetBrains Mono `--p8-text-xs` uppercase `--p8-muted`.
- Coral usage: CTA fill + pillar rules + verdict glyph accents only. Coverage verdict colors move from inline `style` tokens to classes `.lp-verdict--rich/--sparse/--gap` mapping to `--p8-positive/--p8-warning/--p8-critical` (brand functional set — NOT the app's `--state-*`).
- Breakpoints: 480/768/1024. No horizontal scroll at 375px (acceptance).
- `.lp-code` chips: JetBrains Mono on `--p8-panel-2`, radius `--p8-radius-sm`.

- [ ] Steps: rewrite CSS, restructure components, delete Footer.tsx, build + tests + literal-scan green (landing.css now scanned), visual smoke at 1280/375 via dev server, commit `feat(landing): restage on the pixel-8 brand`.

---

### Task 5: MarkField hero visual

**Files:**
- Create: `src/site/MarkField.tsx`, `src/site/markField.ts` (pure), `src/site/markField.test.ts`
- Modify: `src/panels/Logomark.tsx` (export `P8_CELLS`, `COLS`, `ROWS` — additive), `src/landing/Hero.tsx` (mount), `src/styles/landing.css` (field styles + reduced-motion)

**Interfaces:**
- Produces (pure, TDD): `fieldCells(cols: number, rows: number, seed: string): { x: number; y: number; kind: "ink" | "coral" | "faint" }[]` — deterministic via FNV-1a hash of `${seed}:${x}:${y}`; density ~12% ink, ~2% coral (only on rows where the mark's intersection band falls), rest empty; plus full `P8_CELLS` mark instances placed at hashed offsets. Tests: same seed → identical output; different seeds differ; coral fraction bounded; no cell outside grid.
- `MarkField({ seed = "delapan" })` — inline `<svg aria-hidden="true">` rendering the cells as rounded rects (`rx` per Logomark's 0.16 ratio), ink cells `--p8-ink` at 0.06 opacity, coral cells `--p8-coral` at 0.5; a CSS `dlpn-cellfade` keyframe staggers cell opacity on load, killed under `prefers-reduced-motion`.
- Hero mounts it absolutely behind the h1 (right half, fades out under 768px).

- [ ] Steps: TDD the pure module, build the component, mount, verify (dev-server screenshot; reduced-motion check by code), commit `feat(landing): generative pixel-8 mark field hero`.

---

### Task 6: Auth screens join the brand

**Files:**
- Modify: `src/styles/auth.css` (a `.site .auth-card` override block), `src/Root.tsx` + `src/auth/AuthGate.tsx` (wrap the auth surfaces in `.site` — a `<div className="site">` wrapper around SignInForm/SignUpForm/PendingApp/Interstitial render sites on marketing routes ONLY; AuthGate's in-panel sign-in form stays app-styled)

**Interfaces:**
- Produces: on `/login`, `/signup`, waitlist, and Root-level interstitials: bone page, white `--p8-panel` card, radius `--p8-radius`, `--p8-shadow`, coral primary button (bone text), Inter labels, ink text. The `.auth-wm` wordmark keeps its size, `_8` turns coral via existing `.wm-8` (verify cascade under `.site`).

- [ ] Steps: override block in auth.css (all `--p8-*`), wrappers, build + tests, dev-server screenshots of /login + /signup, commit `feat(auth): brand skin on the marketing side`.

---

### Task 7: DocsPage shell + quickstart

**Files:**
- Create: `src/site/DocsPage.tsx`, `src/site/docs/Quickstart.tsx`, `src/site/docs/toc.ts`, `src/styles/site-docs.css` (+ add to literal-scan SHEETS)

**Interfaces:**
- Produces: `DOCS_TOC: { slug: string; title: string; element: ReactNode }[]` in `toc.ts` (order: quickstart, findings, resolution, coverage, graph, deploy); `DocsPage({ slug }: { slug?: string })` — SiteShell-wrapped two-column layout (left rail lists TOC with `aria-current`; missing slug → quickstart; unknown slug → NotFound content inline); `CodeBlock({ children, lang? })` helper with a copy button (clipboard API, "copied" state 2s).
- Quickstart content (grounded in the engine README — these are the REAL commands):
  - install: `pip install "delapan[local]"`
  - MCP server for Claude Code / any MCP client: `python -m delapan.mcp.server`
  - loopback HTTP API: `python -m delapan.api.main`
  - MCP tools table: `delapan_resume`, `delapan_search`, `delapan_explore` (needs LLM + Tavily keys), `delapan_backlog`, `delapan_projects`, plus the KG seam (`delapan_propose_kg_schema` → `delapan_set_kg_schema`, `delapan_build_graph`, `delapan_get_kg_schema`)
  - explore prerequisites: an LLM key (Anthropic / OpenAI / a gateway) + `TAVILY_API_KEY` in the environment
  - close with: local tier is auth-less and SQLite-backed; the cloud beta is invite-gated → CtaRow.
  - Voice: lowercase headings, no exclamation marks, second person, no superlatives.

- [ ] Steps: CSS + shell + quickstart, build + literal-scan green, dev-server check, commit `feat(docs): shell and quickstart`.

---

### Task 8: Docs concepts (5 sections)

**Files:**
- Create: `src/site/docs/Findings.tsx`, `Resolution.tsx`, `Coverage.tsx`, `Graph.tsx`, `Deploy.tsx`; register in `toc.ts`.

Content per section (each 300–500 words + one code/JSON illustration; grounded in the shipped system — the implementer may consult `frontend/design/site-release` KB via the `mcp__delapan__delapan_search` tool if available, else write from the outline):
- **findings & grounding**: the finding as the atomic unit; embedded + deduplicated; `grounded_in` provenance on every finding, node, and edge; nothing is asserted without a source.
- **resolution & history**: write-time ADD/UPDATE/NOOP/SUPERSEDE against top-k similar; bi-temporal `valid_from` / `invalidated_at` / `superseded_by`; retired, never deleted; re-ingesting overlap produces UPDATE/NOOP not duplicates.
- **coverage & preamble**: every resume answers rich / sparse / gap before you trust it; the preamble = synopsis spine + query-relevant findings; gap feeds a curation backlog that explore consumes.
- **knowledge graph & schema**: LLM-extracted entities/relations from findings; intent schema vs emergent ontology; propose → approve seam (HITL); frontier model for extraction because the graph is the trust artifact.
- **deploy surfaces**: MCP tools in your editor; `/api/*` loopback; the cloud `/v1` context API for products; one `Store` protocol under all of it (SQLite local / Supabase cloud).

- [ ] Steps: write sections, register, build green, dev-server spot-read for voice discipline, commit `feat(docs): five concept pages`.

---

### Task 9: Changelog + About

**Files:**
- Create: `src/site/ChangelogPage.tsx`, `src/site/AboutPage.tsx`

**Interfaces:**
- Changelog: `ENTRIES: { month: string; items: { date: string; title: string; note: string }[] }[]` seeded with REAL milestones (verify each against git/ledger before writing — no invention): 2026-07: instrument-grade UI foundation + enterNodes live growth; sign-up path + invite-gated beta; public landing. 2026-07 (engine): write-path dedup resolver live; unique-names migration. 2026-06: findings/synopsis/coverage core; KG schema seam. Frame: `beta — changes land continuously; this page records the ones that matter.`
- About: 3 short sections in brand voice — why (agents that can show their work), what it is (a memory engine, not a vector database), who (solo-built, open-core engine + invite-gated cloud). ~250 words total, lowercase headings, zero superlatives.

- [ ] Steps: write both, build green, commit `feat(site): changelog and about`.

---

### Task 10: Terms + Privacy (template-grade)

**Files:**
- Create: `src/site/TermsPage.tsx`, `src/site/PrivacyPage.tsx`

Structure (each page: dated header `last updated 2026-07-26`, then sections; plain language; template-grade banner at top: `these terms are a plain-language template for the invite-gated beta; they are not legal advice`):
- Terms: acceptance; the service (beta, invite-gated, provided as-is); accounts (accurate info, one org per user, you own your content); acceptable use (no unlawful content, no abuse of the research pipeline, no attempts to access other tenants); availability & changes (beta may change or pause; export on request); termination; liability cap (fees paid — currently zero); governing law `[jurisdiction]`; contact `[contact email]`.
- Privacy: what we store (account email via Supabase Auth, findings/graphs you create, operational logs); processors (Supabase — database & auth; Vercel — hosting; LLM providers process content you explicitly send through explore); what we don't do (no selling data, no ads, no training on your content); retention & deletion (delete account → org data removal on request); cookies (session only); contact `[contact email]`.
- Both linked from SiteShell footer (already wired in Task 3) AND a small line on the signup form: `by creating an account you agree to the terms and privacy policy` (links) — modify `src/auth/SignUpForm.tsx`.

- [ ] Steps: write both + signup line, build green, commit `feat(site): terms and privacy templates for the beta gate`.

---

### Task 11: Routing flip + Root wiring + tests

**Files:**
- Modify: `src/routes.ts`, `src/routes.test.ts`, `src/Root.tsx`

**Interfaces:**
- `Surface` union gains `"docs" | "terms" | "privacy" | "changelog" | "about" | "not-found"`; `resolveRoute` additionally returns a `docSlug` — change signature to `resolveRoute(pathname, hasSession): { surface: Surface; docSlug?: string }`? NO — keep it simple and pure: add `export function docSlug(pathname: string): string | undefined` (strips `/docs/`), and `resolveRoute` maps `/docs` and `/docs/*` → `"docs"`, `/terms` → `"terms"`, `/privacy` → `"privacy"`, `/changelog` → `"changelog"`, `/about` → `"about"`, `/kg` → `"panel"` (already), **anything else → `"not-found"`**.
- `routes.test.ts`: REWRITE the fallback test — `resolveRoute("/whatever", …)` now expects `"not-found"`; add cases for the six new paths + `/docs/coverage` slug + `/kg` still panel. Update the file's doc comment (the "unknown-path fallback is the panel" rationale is retired — say why).
- `Root.tsx`: map the new surfaces to `<DocsPage slug={docSlug(...)}/>`, `<TermsPage/>`, `<PrivacyPage/>`, `<ChangelogPage/>`, `<AboutPage/>`, `<NotFound/>`. Panel now ONLY on `/kg`.

- [ ] Steps: TDD (rewrite tests first, watch fail), implement, `npm run build && npm run test` (all green), commit `feat(routing): public site surfaces and a real 404`.

---

### Task 12: Final verification sweep + whole-branch review (controller)

- Gates: build + full suite.
- Dev-server pass (mock, auth bypass NOT needed — all new surfaces are public): `/`, `/docs`, `/docs/coverage`, `/terms`, `/privacy`, `/changelog`, `/about`, `/nonsense` (404), `/login`, `/signup` at 1280 and 375 wide; keyboard walk (skip link, nav, focus rings); reduced-motion code check; head tags + favicon render; `/kg` still reaches the panel; `/tracking` + `/duet` still work (unadvertised).
- Copy pass: no exclamation marks, no emoji, no invented facts; coral never on body text; `[contact email]` + `[jurisdiction]` placeholders present for user review.
- ui-ux-pro-max checklist pass on the landing (contrast, touch targets, heading hierarchy).
- Final whole-branch review (most capable model) + one fix wave.
- STOP: user reviews legal pages + fills placeholders; merge/deploy on their word.

## Self-Review Notes

- Task ordering avoids stubs: pages (3–10) before routing (11).
- landing.css joins the literal-scan set in Task 4; site.css is exempt (definition site); site-shell.css and site-docs.css scanned from birth.
- The `.site` wrapper for auth (Task 6) must not wrap AuthGate's in-panel usage — only Root-level marketing routes; Task 6 names the exact render sites.
- routes signature stays `(pathname, hasSession) => Surface` + separate `docSlug()` helper — no breaking change for existing tests beyond the rewritten fallback.
