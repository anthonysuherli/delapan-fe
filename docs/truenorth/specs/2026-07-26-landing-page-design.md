# Design: public landing page (Phase 2)

**Date:** 2026-07-26
**Branch:** `feat/landing-page`, cut from `main`
**Repo:** `delapan-fe` — `8star/delapan-ai/frontend`

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public
landing page at `/`."* Phase 1 (session-aware root + console) shipped 2026-07-25; this is the
public half. No Invariant or Non-Goal conflict: it adds no billing, no multi-member org surface,
and does not touch the `Store` seam or the engine.

**Not a port.** The deprecated site's landing (`delapan-ai-site/frontend/public/landing.html`,
51KB static) sold a different thesis — "model reasoning once, reuse it everywhere" — built around
a token-cost comparison and a YC quote. None of its copy carries over. This page is written from
the ratified vision instead.

---

## Positioning

**Agent memory you can audit.**

The through-line across the vision's End Goals is not speed, it is trust: corrections *retire*
facts rather than deleting them, archiving is always reversible, every finding/node/edge keeps its
`grounded_in` provenance, and coverage is scored before any computation runs. Nothing delapan
learns is silently lost or unexplained.

This positioning was chosen over two alternatives:
- *"The knowledge base that corrects itself"* — accurate and distinctive, but a mechanism; it
  lands with engineers and slides past the person deciding.
- *"Watch your knowledge graph grow live"* — the best demo asset, but live streaming is an
  **unshipped Planned Detour**. A page arguing for honesty cannot lead with a claim the product
  cannot keep.

## The claims constraint

Every load-bearing claim maps to a row in `backend/README.md`'s "What's inside" table, which is the
authoritative source for what ships. Verified 2026-07-26:

| Claim on the page | Status | Module |
|---|---|---|
| Coverage banding (`rich`/`sparse`/`gap`) before computation | **shipped** | `core/agent/` |
| Gap-fill exploration (plan → search → crawl → extract → merge) | **shipped** | `core/exploration/` |
| Write-time resolution ADD/UPDATE/NOOP/SUPERSEDE | **shipped** | `core/memory/` |
| Nothing deleted, only retired (bi-temporal `valid_from`/`invalidated_at`/`superseded_by`) | **shipped** | `core/memory/` |
| Knowledge graph over findings | **shipped** | `core/knowledge_graph/` |
| Two-tier storage behind one `Store` protocol (SQLite + Supabase/pgvector) | **shipped** | `store/` |
| MCP server, 6 tools | **shipped** | `mcp/` |
| Credential-free local tier | **shipped** | README "Quickstart — local, no credentials" |
| Live-streaming graph into the dashboard | **planned** | vision Planned Detour |
| HITL consequence preview | **planned** | vision Planned Detour |
| Elasticsearch retrieval backend | **planned** | vision Planned Detour |

Planned items appear on the page with a quiet `planned` marker — the same treatment the console
gives unbuilt destinations. **No metric is invented.** There is no verified benchmark for delapan,
so the proof offered is mechanism, not numbers.

---

## 1. Routing

Phase 1 left `resolveRoute(pathname, hasSession)` as the single routing decision. It gains one
surface and one path:

| Path | Signed out | Signed in |
|---|---|---|
| `/` | **`landing`** (was `signin`) | `console` (unchanged) |
| `/login` | **`signin`** (new path) | **redirect to `/`** |
| `/kg`, `/tracking`, `/duet`, unknown | unchanged | unchanged |

The signed-in `/login` redirect matters: without it, a bookmarked `/login` shows a sign-in form to
someone already signed in, with no way forward. It is a `window.location.replace("/")` in `Root`,
not a router redirect — this app has no router.

`vercel.json`'s catch-all already serves any path, so no deploy config changes.

## 2. Page structure

`src/landing/LandingApp.tsx` composes one component per section, each in its own file under
`src/landing/`. No section file should exceed a screenful of markup.

| Section | Content |
|---|---|
| `Hero` | headline, subhead, one primary CTA to `/login`, "free · invite-gated beta" |
| `Problem` | agent memory is append-only: re-ingest yields duplicates; a correction either loses history or leaves the contradiction standing; nothing says where a claim came from |
| `Grounded` | every finding, node and edge carries `grounded_in` |
| `SelfCorrecting` | candidates resolve ADD / UPDATE / NOOP / SUPERSEDE *before* being written |
| `NothingLost` | SUPERSEDE retires rather than deletes; bi-temporal columns; archives round-trip |
| `Coverage` | every tap returns `rich` / `sparse` / `gap` before computation, dual-encoded ■ ▲ ● |
| `WhereItPlugsIn` | Claude Code over MCP (6 tools); your product over `/api`; local tier credential-free on SQLite, cloud the same engine behind the same protocol |
| `WhatItIsnt` | not a memory layer storing facts the agent still reasons over; not a vector database; not a RAG framework — **plus** the three `planned` items, named |
| `ClosingCta` | repeat of the primary action |
| `Footer` | wordmark and a copyright line — **no legal links** (see below) |

### No legal links, and why that is a launch blocker rather than an omission

`delapan-fe` has **no terms or privacy route** — verified by grep, 2026-07-26. The deprecated site
had them; this repo does not. So the footer ships with no legal links, because linking at a page
that does not exist is the exact defect the console review caught when tiles pointed at unbuilt
routes.

That is not a cosmetic gap. The vision's Acceptance Criteria list a **hardening minimum live before
the sign-up link is public**: "ToS + privacy policy, custom SMTP for auth email, rate limiting on
public endpoints, error tracking on backend + frontend, backups verified." Publishing a landing
page with a sign-up CTA and no ToS moves *toward* that gate without satisfying it.

Out of scope for this spec, and flagged so it is a decision rather than an oversight: the CTA
points at `/login`, which is invite-gated, not open self-serve sign-up — so this page does not by
itself trip the vision's public-sign-up condition. Opening sign-up does.

### Hero copy

> **where did your agent learn that?**
>
> delapan researches a domain once, keeps every fact with the source it came from, and corrects
> itself when the facts move — without ever losing what it knew before.

Problem-first, and the promise is one the shipped code keeps. Shortened from a longer
two-clause question after seeing it rendered: at the hero size it ran to five lines and
swallowed the viewport. The self-correcting half of the thesis moves to the lede.

## 3. The page demonstrates its own argument

This is the point of the design, not decoration:

- **Coverage verdicts render with the real glyphs** (■ ▲ ●) and the real `--state-*` tokens, so the
  marketing and the product agree rather than merely resembling each other.
- **Planned features are labelled**, exactly as the console labels unbuilt tiles.
- **No autoplay, no hero animation, no countdown** — calm technology governs marketing too.
- **Amended 2026-07-26** — one exception, scoped: a single user-initiated demo video below the
  fold (`Resolution`, see `2026-07-26-landing-demo-video-design.md`). No autoplay, no ambient
  motion, hero unchanged, nothing moves until clicked. The constraint's purpose — the page does
  not perform at you — is preserved; what changed is that a visitor may ask for the mechanism to
  be demonstrated.
- **Hairlines over shadows, 4px grid, tabular numerals, flush-left type, pixel-8 mark** — the same
  Bauhaus rules the restyle applied to the app.

A page selling auditability that overclaimed, animated, or invented numbers would fail its own
test. That constraint is the design.

## 4. Visual language

Reuses what already exists — no new design system, no new dependency:

- `Logomark` (pixel-8) and the `--brand-*` tokens.
- `--chrome-accent` for the primary CTA only; `--state-rich`/`--state-sparse`/`--state-gap` for the
  coverage verdicts, which is their real meaning rather than decoration.
- `--u` grid scale, `--font-brand` (Space Grotesk) for the wordmark, `--font-display` for headings,
  `--font-mono` for technical furniture.
- **No `--data-*` token appears on this page.** Those encode categorical graph channels; nothing on
  a landing page is a categorical data channel.

`src/styles/landing.css`, following the `console.css` pattern — including `height: 100%; overflow:
auto`, since `base.css` sets `body { overflow: hidden }` for the graph app and a full-page surface
that omits this cannot scroll. That defect shipped once already in the console and was caught in
review; it is written down here so it does not recur.

## 5. Verification

1. **`resolveRoute`'s new branches are unit-tested** — `/` signed-out is `landing` not `signin`,
   `/login` is `signin`, and the existing invariant still holds that `/` is the only path whose
   meaning changes with session.
2. **`npm run build`** passes (strict).
3. **Full browser pass, no session required** — this is the first surface in the app that is
   entirely public, so every check is available: rendering, the CTA reaching `/login`, responsive
   behaviour at 375px, and scrolling.
4. **Performance budget** — the research in the `frontend/design/pixel8-branding` KB puts LCP under
   2.5s as the bar. This page is heavier than anything else in the app, so LCP is measured, not
   assumed.
5. **Signed-in `/login` redirect** — the one check still needing a session.

## Risks

- **Ten new components is the largest build of the session.** Mitigated by one file per section
  with no shared state: any section can be built, reviewed, and dropped independently.
- **Copy is unreviewed marketing.** Every factual claim traces to the README table above, but tone
  and emphasis are judgement calls the user should read before it goes public.
- **`/` changes meaning for logged-out visitors** — currently a bare sign-in form. Anyone who
  bookmarked `/` expecting to sign in now lands on marketing; `/login` is the replacement and the
  hero CTA points at it.
