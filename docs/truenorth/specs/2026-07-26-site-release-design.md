# delapan.ai site release — pixel-8 brand bridge + public site shell

**Date:** 2026-07-26
**Status:** ratified in brainstorming (both design rounds approved)
**Vision goals served:** "Hosted public tier with account isolation" (the public
landing/site is its front door) and its **hardening minimum** — "ToS + privacy
policy … live before the sign-up link is public." The sign-up CTA deployed
2026-07-26 ahead of those pages; this spec clears that debt. Non-goals
respected: no billing pages, no dashboard rebuild.

**Research base:** `frontend/design/site-release` KB (3 explores: dev-tool site
IA/content, docs design, brand-palette translation), plus the shipped brand
system at `delapan-ai-site/docs/branding/` (source of truth) and the
2026-07-26 landing/branding codebase map (in `.truenorth/sdd/` history).

**Decisions from brainstorming:**

| Question | Decision |
|---|---|
| Brand split | Marketing surfaces (landing, docs, legal, changelog, about, 404, auth) adopt pixel-8 ink/bone/coral; the /kg instrument panel and console keep the amber daylight language |
| Pages at release | Docs (quickstart + concepts), ToS + Privacy, Changelog, About — plus a branded 404 |
| Approach | A: port the existing p8 token system into the SPA; `src/site/` shell; no separate docs toolchain |

---

## 1. Brand foundation

- **`src/styles/site.css`** — marketing token layer transcribed from
  `delapan-ai-site/docs/branding/tokens.css`, keeping the `--p8-*` names so the
  upstream file stays the source of truth. Carries: ink `#0B0F14`, bone
  `#F7F6F2`, coral `#FF6B4A`, coral-deep `#E8431F`, the bone/ink neutral ramps,
  functional status colors, radii 8/12/18/pill, spacing to 96px, the 1.25 type
  scale (12→61px), motion `cubic-bezier(0.22, 1, 0.36, 1)` at 120/220ms.
- **Fonts:** marketing trio Space Grotesk (display) / Inter (body) / JetBrains
  Mono (code, labels) added to the Google Fonts call. Big Shoulders Display +
  IBM Plex remain app-only. No font is removed from the app surfaces.
- **Scope class:** marketing pages render under a `.site` root; site tokens and
  rules are scoped there so the two identities cannot bleed. Auth screens
  (`SignInForm`, `SignUpForm`, `PendingApp`, `Interstitial`) join `.site`.
- **Brand drift test:** `src/styles/site.test.ts` asserts `site.css?raw`
  carries the exact brand hexes/fonts — a rebrand upstream fails loud.
- **Literal-scan:** `site.css` joins the scanned set as a definition site
  (exempt like `tokens.css`); any new site-scoped sheet is scanned.

## 2. Site architecture

- **`src/site/`**: `SiteShell.tsx` (nav: Logomark + wordmark; links docs /
  changelog / about; sign in + create account CTAs. Footer: product / docs /
  legal / contact columns + copyright), `DocsPage.tsx` (+ per-topic sections),
  `TermsPage.tsx`, `PrivacyPage.tsx`, `ChangelogPage.tsx`, `AboutPage.tsx`,
  `NotFound.tsx`, shared `CtaRow.tsx`.
- **Routing** (`resolveRoute` stays pure): new surfaces `/docs`,
  `/docs/<slug>`, `/terms`, `/privacy`, `/changelog`, `/about`; panel keeps
  `/kg`; **the anything-else catch-all becomes the branded 404** (links: home,
  docs, sign in). `/tracking` and `/duet` remain routable but unadvertised and
  `noindex`.
- **Docs shell:** left rail (quickstart; findings & grounding; resolution &
  history; coverage & preamble; knowledge graph; deploy surfaces), content as
  typed TSX sections. No markdown pipeline at v1 (YAGNI at ~6 pages).
- **Head hygiene:** real `<title>` per page (`usePageTitle` hook), meta
  description, OG/Twitter tags, favicon set wired from
  `delapan-ai-site/docs/branding/assets/` (favicon.svg, -16/-32 png,
  apple-touch-icon, icon-512) copied into `public/`.

## 3. Landing redesign + hero

- **Copy spine survives** (headlines verbatim: "where did your agent learn
  that?", "agent memory is append-only", …). The stage rebuilds: bone
  surfaces, ink text, **coral as the only accent** (amber leaves marketing
  entirely), Space Grotesk headings on the 1.25 scale (hero `clamp()`ed),
  Inter body ≥16px, JetBrains Mono kickers, section rhythm on the brand scale
  (64–96px), 12px radii.
- **Hero visual — mark as furniture:** a generative pixel-8 cell field (ref:
  branding `mark.js`; the brand doc blesses "as furniture" + "play with the
  8") rendered ink-on-bone with coral intersection bars as the only color.
  Static by default; a subtle cell shimmer gated by `prefers-reduced-motion:
  no-preference`. Implemented as an inline SVG component (CSS-animatable, no canvas redraw loop)
  (`src/site/MarkField.tsx`), deterministic seed (no `Math.random` — hash a
  fixed string; layout determinism is a repo invariant).
- **Responsive:** breakpoints 480/768/1024; nav collapses to mark + menu
  button (a simple disclosure, not a drawer); grids stack; measure ≤70ch;
  no horizontal scroll at 375px.
- **Componentization:** one `CtaRow` (kills the Hero/ClosingCta duplication +
  the duplicated beta string); section kickers auto-number from composition
  order (kills the hardcoded 01…05 desync).
- **Auth screens:** `.auth-card` re-skinned under `.site` — bone card, 12px
  radius, brand shadow, coral primary CTA, ink text. Same components.

## 4. Content

- **Docs quickstart:** open-core engine — clone, `uv sync`, `.env` keys
  (LLM gateway + Tavily), first explore, tap from Claude Code via MCP.
  Grounded in the engine README/code; cross-checked against KB findings.
  Code blocks in JetBrains Mono with copy buttons.
- **Docs concepts (5):** findings & `grounded_in`; resolution &
  bi-temporal history (`valid_from`/`invalidated_at`/`superseded_by`);
  coverage verdicts & preamble; knowledge graph & schema intent; deploy
  surfaces (MCP tools, `/v1` API).
- **Changelog:** seeded from real shipped milestones (write-path dedup,
  unique-names migration, signup path, UI foundation, …), grouped by month,
  honest beta framing. Maintained as a TSX data array.
- **About:** the grounded-memory thesis, brand voice (lowercase, precise, no
  performance, no exclamation marks, no emoji).
- **ToS + Privacy:** standard beta-SaaS templates — accounts, acceptable use,
  data handling (naming Supabase and Vercel as processors), beta caveats,
  termination, liability limits, contact email. **Template-grade, not legal
  advice; the user reviews before deploy.** Footer + signup link to both.
  **Open item for the user:** the contact address the legal pages name (no
  address is invented; a placeholder `[contact email]` ships in the draft and
  the review gate fills it).

## 5. Guardrails & verification

- Suite stays green (142 + new: site drift test, route tests for the six new
  surfaces + 404 flip).
- A11y: AA contrast on all ink/bone pairs; **coral never carries body text**
  (accent + CTA fill with ink/bone text only — encoded as a spec rule);
  focus-visible on all site links/controls; reduced-motion on the hero field;
  heading hierarchy sequential; skip-to-content link in SiteShell.
- SEO/meta verified with real fetches post-deploy; 375px sweep; keyboard walk.
- **Non-goals:** dashboard/console/tracking/duet restyle, blog, pricing,
  docs search, markdown pipeline, i18n, dark mode for the site.
- Deploy only on the user's explicit word after checklist + their legal-page
  review.

## Risks

- Two design languages in one bundle: the `.site` scope must actually contain
  the brand (no leaking `--p8-*` into panel styles; literal-scan + review).
- The 404 flip changes catch-all behavior: any bookmarked odd path that used
  to reach the panel via auth-gate now 404s — `/kg` remains the panel door;
  acceptance tests cover both.
- Font payload grows (3 new families): load only needed weights, keep
  `display=swap`.
- Legal templates carry real-world weight: gated on explicit user review; the
  spec's language stays plainly labeled as template-grade.
