# Design: session-aware root + console hub (delapan-fe)

**Date:** 2026-07-25
**Branch:** `feat/console-hub`, cut from `design/pixel8-branding`
**Repo:** `delapan-fe` — `8star/delapan-ai/frontend`

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public
landing page at `/` and an account-gated dashboard."* This is Phase 1 of that: the gated half.
Respects the Non-Goal **"Not a greenfield dashboard — we evolve the existing sigma.js control
panel"** — the panel changes route and nothing else.

> **Supersedes** `delapan-ai-site/docs/truenorth/specs/2026-07-25-console-hub-design.md`. That
> spec targeted the Next.js monorepo, which the user has since declared **deprecated**. Nothing
> ported: no App Router, no route groups, no server components, no `resolveWorkspace()`. The
> earlier branch (`feat/console-hub` in `delapan-ai-site`) stays committed and unmerged.

**Branch note.** Cut from `design/pixel8-branding`, which is 2 commits ahead of `main` (the
pixel-8 rebrand + the palette-allocation fix) and not yet merged. The console uses that brand, so
the two merge together.

---

## Problem

Signing in drops you straight into the sigma graph panel. That panel is the product's centrepiece,
but it is one surface among several — `TrackingApp`, `DuetApp`, and dua.delapan.ai all exist and
are reachable only by typing a URL. There is no home: nowhere that says what this account can do,
nowhere to see who you are signed in as, and no way to move between surfaces.

## Non-goals — Phase 1

- **Not the landing page.** Logged-out `/` keeps today's `SignInForm`. Phase 2 replaces it.
- **Not an account page.** `session.user.email` and sign-out are the only account data available
  without new API surface; a page holding two facts is an empty room. They render as a block on
  the console.
- **Not a router.** No `react-router`, no new dependency. The existing `pathname` switch grows.
- **Not touching the graph panel.** `App` and everything under `src/graph/`, `src/panels/`,
  `src/state/` are untouched. Only the route that renders `App` changes.

---

## 1. Routing

`src/main.tsx` currently switches on `window.location.pathname` three ways. It grows to four, and
`/` becomes session-aware:

| Path | Renders | Change |
|---|---|---|
| `/` | `session ? <Console/> : <SignInForm/>` | **new** — session-aware root |
| `/kg` | `<AuthGate><App/></AuthGate>` | **moved** — was `/` |
| `/tracking` | `<TrackingApp/>` | unchanged |
| `/duet` | `<DuetApp/>` | unchanged |
| anything else | `<AuthGate><App/></AuthGate>` | unchanged fallback, so old links still reach the panel |

`vercel.json`'s catch-all rewrite (`/(.*)` → `/index.html`) already serves any path, so **no deploy
config changes**. Its existing redirects — `/dua/*` and `/d/*` → `dua.delapan.ai` — are untouched
and are what make the console's dua tile an external link rather than a local route.

Keeping the catch-all pointed at the panel is deliberate: a stale bookmark to `/anything` still
lands somewhere useful instead of a blank screen, and `/` is the only path whose meaning changes.

## 2. `useSession()` — one session read, two consumers

`AuthGate` currently owns the session: `useState<Session | null | undefined>`, an
`onAuthStateChange` subscription, and a `getSession()` call, with `undefined` meaning "still
checking" (`src/auth/AuthGate.tsx:12-30`). The root now needs the same answer *before* deciding
what to render, so that logic is extracted verbatim into `src/auth/useSession.ts`:

```ts
useSession(): Session | null | undefined   // undefined = still resolving
```

`AuthGate` then consumes the hook instead of duplicating the effect. Its three-way branch
(`undefined` → "checking session…", `null` → `SignInForm`, session → children) is unchanged, so
`/kg` behaves exactly as `/` does today.

This is the one piece of shared plumbing between Phase 1 and Phase 2 — Phase 2's landing page
branches on the same hook.

## 3. The console

`src/console/ConsoleApp.tsx`, plus small focused components beside it. It renders only for a
signed-in session, so it needs no auth branch of its own.

| Region | Content |
|---|---|
| header | pixel-8 mark, wordmark, `signed in as {session.user.email}` |
| resume | one card → `/kg`, the graph panel |
| tiles | the four destinations below |
| account | email + sign out, as a block not a page |

**Tiles — only destinations that actually exist.** This is the specific failure the deprecated
repo's review caught, where four of eight tiles pointed at "coming next" stubs:

| Tile | Target | Exists? |
|---|---|---|
| knowledge graph | `/kg` | yes — `App` |
| findings | `/kg` (findings view) | yes — a view inside `App`, not a route |
| tracking | `/tracking` | yes — `TrackingApp` |
| dua | `https://dua.delapan.ai` | yes — separate deployment |

No tile ships without a working destination. If a future surface is added before it is built, it
gets a `soon` marker rather than confident prose.

**Findings deep-link.** `App` holds its graph/findings toggle in Zustand (`view` in
`src/state/store.ts`). The tile links to `/kg?view=findings`; `App` reads that param once on boot
and sets the initial view. This is the only change to existing app code, and it is additive — no
existing behaviour depends on the param being absent.

## 4. Visual language

The console is not a new design system. It uses what the branch already established:

- `.type-mark`-style glyph + hue pairing is **not** needed here — these are navigation tiles, not
  categorical data, so they carry icons and labels only. Hue encodes nothing.
- Brand: the pixel-8 `Logomark` and `--brand-*` tokens from `design/pixel8-branding`.
- Chrome: `--chrome-accent` amber for the primary action; `--u` grid scale for spacing; hairline
  borders, no shadows on surfaces — the same Bauhaus rules the EG restyle applied.
- Type: Space Grotesk (`--font-brand`) for the wordmark, Big Shoulders (`--font-display`) for
  headings, IBM Plex Mono for the technical furniture.

## 5. Verification

`vitest` runs in a node environment with no DOM, so the testable seam is routing logic, not markup.

1. **Route resolution is unit-tested.** Extract the path→surface decision into a pure
   `resolveRoute(pathname, hasSession)` in `src/routes.ts` and test every branch, including that
   an unknown path falls back to the panel and that `/` differs by session.
2. **Tile targets are unit-tested.** Every tile's `href` is non-empty, and no tile points at a
   path `resolveRoute` sends to the panel fallback — that would be a tile that silently goes
   nowhere useful.
3. **`npm run build`** passes (`tsc --noEmit && vite build`, strict).
4. **Browser pass, now possible without a session for half of it:** logged-out `/` shows the
   sign-in form; `/kg` shows the graph panel; the console requires a session and is checked by the
   user.

## Risks

- **`/kg` breaks muscle memory and bookmarks** for anyone using `/` as the graph app. Mitigated by
  the catch-all fallback: every path *except* `/` still renders the panel, so only the exact root
  changes meaning.
- **`useSession()` extraction touches the auth path.** It is a verbatim move of working code, and
  `AuthGate`'s branches are unchanged, but auth is the one thing in this app that must not
  regress. `src/api/authHeaders.test.ts` already covers token attachment and must stay green.
- **The findings deep-link reaches into `App`'s boot.** Kept to a single additive read of a query
  param, defaulting to today's behaviour when absent.
