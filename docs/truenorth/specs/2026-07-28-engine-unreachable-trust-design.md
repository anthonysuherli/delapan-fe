# Trust when the engine is down — honest failure states, no fabricated data

**Date:** 2026-07-28
**Status:** ratified in brainstorming (four design sections approved)
**Vision goals served:** "Hosted public tier with account isolation" — specifically
*"an authenticated engine API giving the dashboard **real (non-mock) data**"* — and
its acceptance criterion *"Stranger round-trip … first-run empty state → first
populated graph, with no operator intervention."* Also serves the hardening
minimum *"error tracking on backend + frontend"*, which is currently absent from
the frontend while the sign-up link is already public. Non-goals respected: not a
greenfield dashboard (this is a surgical change to the client seam), no billing,
no multi-member orgs.

**Constraining invariants:** *"The local open-core tier stays auth-less"* — the
zero-config local dev loop must keep working, so the fix cannot simply hard-fail
on a missing `VITE_API_BASE`. And *"all new toggles are config, never hardcoded."*

**Research base:** the 2026-07-28 frontend code review (15 findings; this spec
discharges #2, #4, #6, #10, #13 and creates the seam for #5 and #7), plus repo
and production facts verified in that session — listed in §7.

> **This is not a new decision — it is an unbuilt ratified one.**
> `backend/docs/truenorth/specs/2026-07-20-public-release-design.md` §G already
> requires: *"`/app` renders explicit error and empty states — **no silent mock,
> no silent empty**."* That was ratified 2026-07-20 and never implemented; the
> silent-mock path is still live in production today. This spec is the design for
> honouring it, not a proposal to change direction.

**Decisions from brainstorming:**

| Question | Decision |
|---|---|
| Does the mock have a job in production? | **No.** Dev-only. It must not exist in the production bundle, and delapan.ai must never render it under any circumstance. |
| Outage at boot vs mid-session | Different screens. Boot → blocking `EngineDown`. Mid-session → non-blocking banner + read-only, **graph stays on screen**. |
| Global vs inline errors | Global state (engine down) → one global surface. Per-action failure (one probe, one explore) → inline where the action was. |
| Beta gate probe | Split into two: `/health` answers "is the engine up", `getProjects()` answers "is this user allowed in". |
| Error tracking vendor | **PostHog**, not Sentry — deviates from ratified spec §E; see §6. |

---

## Problem

`call()` in `src/api/client.ts` treats any network-level failure as a cue to
switch the whole session to a built-in fixture and carry on. The fixture is not a
skeleton: it is 29 findings with invented confidence scores and provenance URLs
pointing at repositories that do not exist, ~50 nodes, ~80 edges, and two
synthetic KBs.

Three things follow, and all three are live in production today:

1. **A backend outage presents fabricated knowledge as the user's own KB.** The
   only signals are one 5-second toast and a small badge in the `/kg` status bar.
   The console shows nothing at all. Mock mode accepts writes, so edits appear to
   succeed and undo/redo works against data that will never be persisted.
2. **The beta gate is satisfied by the fallback.** `useBetaAccess` probes through
   the same client, so an unreachable engine resolves the probe successfully and
   classifies a waitlisted user as `approved` — the exact outcome the module
   docstring says the probe exists to prevent.
3. **The fixture ships to every visitor.** Verified in the live bundle served
   from delapan.ai.

The engine cannot tell the user it is down, because the client refuses to admit
it. That is the whole problem.

## Non-goals

- **Not** deleting the mock from the codebase. The zero-backend frontend dev loop
  is worth keeping; `VITE_USE_MOCK=1` remains supported in development.
- **Not** building a public "try it without an account" demo surface. If that is
  wanted later it is a deliberate, separately-routed, clearly-labelled page — not
  a failure fallback. This spec builds the seam that would make it possible and
  stops there.
- **Not** bundle splitting or introducing a client-side router (review findings
  #12 and #14). Separate scope; the PostHog chunk here is lazily loaded and does
  not touch the main bundle.
- **Not** fixing the unrelated correctness findings (undo busy-lock, `ids[0]`
  guard, add-node default type, `/duet`, a11y). Those go to `writing-plans` as
  ordinary fixes; only #5 and #7 are touched here, and only because the state
  model this spec introduces is what makes them expressible.

---

## 1. The client seam

**Remove the auto-fallback.** `call()` no longer catches `TypeError` and swaps in
the mock. Mock is reachable by exactly one path: `VITE_USE_MOCK === "1"`.

**Make the mock a dynamic import.** `import { mockApi } from "./mock"` at module
scope is what pulls the fixture into the production bundle. It becomes
`await import("./mock")`, resolved once and memoised, inside the
`VITE_USE_MOCK` branch only. Rollup then tree-shakes the fixture out of any
build where that branch is unreachable. The two test files that import `./mock`
directly (`findings-contract.test.ts`, `concept-doc.test.ts`) are unaffected —
they bypass the client.

**Classify failures instead of swallowing them.** A pure function, testable
without a DOM:

```ts
type EngineFailureKind =
  | "unreachable"    // fetch threw — DNS, refused, CORS, offline
  | "unauthorized"   // 401 — token missing/expired
  | "forbidden"      // 403 — valid session, not in beta_members
  | "server"         // 5xx — engine up, engine broken
  | "parse";         // 2xx with a body we cannot read

classify(err: unknown, status?: number): EngineFailureKind
```

`http()` throws a typed `EngineFailure { kind, status?, detail }` — `status` is
optional because `unreachable` has none — rather than a bare `ApiError`.
`ApiError` stays: `betaAccess.ts` and `LeftRail`'s 503 branch both narrow on it,
and `authHeaders.test.ts` asserts `instanceof ApiError` for the 500 and 401
paths. `EngineFailure` extends it, so every existing `instanceof` check and
those tests keep working unchanged.

**`unreachable` is confirmed, never assumed.** One request throwing `TypeError`
triggers a `/health` probe; it does not by itself put the app into read-only. A
single flaky request must not degrade the whole session.

**`engineStatus`** — a small module owning liveness:

- state: `"unknown" | "reachable" | "unreachable"`, plus `since` and `attempts`
- probes `GET /health` (unauthenticated, unmetered, returns `{status, backend}`)
- re-probes on backoff while unreachable — 2s, 4s, 8s, capped at 30s
- probes immediately on `visibilitychange → visible` and on `window online`
- on `unreachable → reachable`, clears the banner and calls `loadScope()` — an
  in-app refetch, **not** a document reload, so selection and camera survive

The backoff plus the two event triggers are what turn a Fly cold start — the
outage you will actually hit most often — into roughly ten seconds of degraded
state rather than a dead-end retry button.

**`VITE_API_BASE`.** The `?? "http://127.0.0.1:8001"` default stays, because it
*is* the local open-core tier's convenience and the invariant protects it. What
changes is that it may not survive into a production build: `vite.config.ts`
throws during `build` when `mode === "production"` and `VITE_API_BASE` is unset,
or when `VITE_USE_MOCK === "1"`. Dev is untouched; a misconfigured deploy fails
loudly at build time instead of silently shipping a bundle that points at the
visitor's own machine.

## 2. Failure taxonomy

Two rules:

**Rule 1 — global state gets a global surface; per-action failure stays inline.**
An unreachable engine is one problem, not four, so it does not get four error
strings. A single coverage probe returning 503, or one explore run failing, is
scoped to that action and stays where the action was.

**Rule 2 — never discard real data to report a failure.** At boot there is
nothing on screen worth keeping, so unreachable is a blocking screen.
Mid-session, the graph already rendered is the user's genuine data, truthfully
loaded; destroying it to show an error would take away more than it explains.

| State | Detected by | Surface | Renders | Remedy |
|---|---|---|---|---|
| `checking` | session `undefined`, or probe in flight | any | `Interstitial` *(exists)* | none — auto |
| `unreachable` **at boot** | `classify` → `unreachable`, confirmed by `/health` | console, panel | new `EngineDown` | auto re-probe + manual retry |
| `unreachable` **mid-session** | same | panel | banner + read-only; **graph stays** | auto re-probe |
| `unauthorized` | 401 | any | sign-in *(exists, via `on401SignOut`)* | sign in |
| `forbidden` | 403 | console, panel | `PendingApp` *(exists)* | none — waitlist |
| `server` | 5xx | inline at the action | error + detail + retry | retry |
| `empty` | 200, zero rows | canvas | `cv-empty` *(exists)* | explore / add node |

**Read-only mode** (mid-session `unreachable`) disables the mutation
affordances: `TopBar`'s `+ node` / `connect` / `layout`, the `Inspector` edit
paths, `AddNodeModal`, the relation popover, and undo/redo. This is not only
honesty — under the optimistic-mutation architecture an edit during an outage
currently applies to graphology, fails the API call, and rolls back, so the user
watches their own edit undo itself. Disabling the control is quieter and more
truthful than letting that happen.

**Scoped failure — the KB switch.** A KB switch whose graph fetch fails is a
per-action failure under Rule 1, so it must not leave the previous KB's graph
rendered under the new scope's label. `loadScope`'s catch clears the graph, resets
`stats` / `schema` / `synopsis` / findings, and renders a scoped error with retry
in the canvas region. This discharges review finding #6 and implements
`backend/docs/truenorth/specs/2026-07-20-public-release-design.md` §D — *"KB/org
switch while inside any view resets that view's state; tested for the new
surfaces, not just entry paths"* — which was ratified but never applied to the
failure path.

## 3. The beta gate

`useBetaAccess` currently asks one question and tries to answer two. Split them:

| Probe | Endpoint | Answers |
|---|---|---|
| liveness | `GET /health` *(unauthenticated)* | is the engine up |
| authorization | `getProjects()` *(authenticated)* | 200 → approved · 403 → pending · 401 → sign-in |

`BetaAccess` gains one arm, `unreachable`. The existing fall-through — *"'error'
deliberately falls through to the console rather than accusing an approved user
of being waitlisted because a request failed"* — is correct and stays for `server`
and timeout. But "engine unreachable" is a different fact and gets a truthful
answer instead of borrowing that lenience. `classifyProbe` is a pure, 7-test
function; it takes one new arm, not a rewrite.

**Remove the duplicate probe.** On `/kg`, `Root` runs `useBetaAccess`
(→ `getProjects`) *and* `App.boot()` calls `getProjects()` — two identical
authenticated requests per page load, plus a window in which `PANEL` mounts and
boots before the probe resolves. The panel already makes the call the gate needs,
so **the panel derives access from `boot()`'s outcome; only the console runs a
separate probe** (it has no other engine call). One request each, and the
render-then-swap window closes.

## 4. Screens

**`EngineDown`** — new, `.site`-scoped, matching `Interstitial` / `PendingApp`.
States what happened ("the delapan engine isn't responding"), that it is not the
user's fault and their data is safe, the auto-retry countdown, a manual retry,
and sign-out. It does **not** show a raw error string; `detail` goes to PostHog,
not to the reader.

**Outage banner** — mid-session, full-width, persistent (not a toast), above
`TopBar`. Says edits are paused and the engine is being re-probed. Uses
`--state-*` tokens; adds no raw literals, so `styles/literals.test.ts` stays
green.

**Removed:** the `MOCK DATA` badge and the `sb-dot--mock` state in `StatusBar`,
and the `api.onApiModeChange` toast in `store.ts`. With the fallback gone there is
no mock mode in production to report. `store.mode` and `ApiMode` are deleted;
`engineStatus` replaces them.

## 5. Deleted-finding staleness

Review finding #5: `FindingDrawer.remove()` deletes a finding server-side, evicts
it from `findingCache`, and never updates `store.findings` — so the row stays in
the table, stays counted in the header total, stays in its histogram bin, and
re-opening it 404s on a finding the user was just told was deleted.

Included here because it is the same class of defect this spec exists to remove:
the UI asserting something the engine did not confirm. The fix is to splice the
id out of `findings` and decrement `findingsTotal` in the success branch, guarded
by the same `get().project !== project || get().kb !== kb` scope check
`loadFindings` already uses. Review finding #7 (the post-explore `getSynopsis`
writing into a switched scope) takes the identical guard.

## 6. Observability

Port `delapan-ai-site/frontend/lib/posthog-lazy.ts` (108 lines) rather than
writing one. It keeps the proxy typed off `Parameters<PostHog[method]>`, queues
`capture` / `identify` / `reset` / `captureException` calls made before load,
schedules `import("posthog-js")` inside `requestIdleCallback` with a 2s
`setTimeout` fallback for Safari, and no-ops without a key. Its 6 tests
(`posthog-lazy.test.ts`) come with it. The only real adaptation is Vite:
`VITE_POSTHOG_KEY`, not `NEXT_PUBLIC_POSTHOG_KEY`. `posthog.init` goes in
`main.tsx` behind the key check.

**Two legal constraints, both load-bearing — and both the opposite of what a
straight port would give you.**

*Persistence must be `'memory'`.* Spec §E ratifies cookieless, but
`delapan-ai-site`'s live `instrumentation-client.ts` initialises with
`persistence: "localStorage+cookie"` — it drifted from its own spec. Porting that
line would falsify a claim already shipped on delapan.ai: `PrivacyPage.tsx` §cookies
states *"no tracking or advertising cookies."* Cookieless is not a preference
here; it is what keeps a live legal statement true. **Do not port the config
block — only the loader.**

*The privacy policy must be updated.* `PrivacyPage.tsx` §processors names
Supabase, Vercel, LLM providers via the AI gateway, and Tavily. It does **not**
name PostHog. Backend spec §D anticipated listing it, but the page as shipped
omits it — so adding PostHog creates real legal work, not zero. Adding a sentence
to §processors is in scope for this spec and gates the analytics rollout: the key
is not set in production until the page ships.

Three signal types, deliberately separated:

- **Exceptions** → `captureException`: unhandled errors, unhandled rejections,
  and `EngineFailure` of kind `server` or `parse`. Explicitly **not**
  `unreachable`, `unauthorized`, or `forbidden` — those are expected states with
  defined screens, and filing them as exceptions would bury real bugs.
- **Ops** → an `engine_unreachable` event carrying `backend` tier and outage
  duration. You want outage frequency; you do not want it in your error inbox.
- **Product** → the two ratified events, `signed_up` and
  `first_explore_completed`.

The ~185KB / ~60KB-gz `posthog-js` chunk loads lazily and idle-deferred: it never
enters the main bundle or the critical path. Worth stating explicitly given the
same review measured that bundle at 704KB / 191KB-gz.

> **⚠️ Deviation from a ratified spec.**
> `backend/docs/truenorth/specs/2026-07-20-public-release-design.md` §E names
> **Sentry** for error tracking (`@sentry/react` on the SPA) and **PostHog**
> separately for analytics. This spec adopts PostHog for *both*: one vendor rather
> than two, a working lazy-loader to port rather than a new integration to write,
> and the two ratified analytics events land in the same change. The vision names
> no vendor, so this is recorded here rather than raised as a vision amendment.
> Note the same §E's *cookieless* requirement is **not** waived — see above; it is
> tightened, because a live privacy claim depends on it.

## 7. Verification

The suite runs vitest in a `node` environment with **no DOM**, so component
rendering is not testable without adding jsdom. Rather than add it, follow the
convention the repo already uses — `routes.ts` exists as a pure function
precisely so *"the routing decision is testable without a DOM; Root.tsx is then a
thin map from surface to element."* Section 2's taxonomy becomes the same shape:

```ts
resolveAppState({ session, access, engine, scopeLoad }): AppScreen
```

`Root` and `App` stay thin maps from state to element, and the taxonomy stops
being prose the suite cannot check.

| What | How |
|---|---|
| `classify(err, status)` | table-driven, pure |
| `classifyProbe` + `unreachable` arm | extends the existing 7 tests |
| `resolveAppState` | exhaustive state cross-product |
| `engineStatus` transitions + backoff | fake `fetch`, fake timers |
| deleted-finding splice + scope guard | pure reducer over store state |
| `posthog-lazy` | the 6 tests port with it |
| no mock in the production build | build-time assertion, below |

**The build assertion is structural, not a test.** A test you can forget to run
is discipline again:

```
"build": "tsc --noEmit && vite build && node scripts/assert-no-mock.mjs"
```

`scripts/assert-no-mock.mjs` greps `dist/` for a known fixture string
(`"Findings are the atomic unit of delapan knowledge"`) and exits non-zero if
present. You cannot produce a passing production build containing the mock —
the same "by construction, not by discipline" standard the vision applies to
`Store` parity and RLS.

### Acceptance criteria

1. Production build contains no fixture string — enforced by the build itself
2. `VITE_USE_MOCK=1 npm run dev` still boots the demo KB unchanged
3. `npm run dev`, no engine, no flag → `EngineDown`, never a graph
4. Kill the engine mid-session → banner + read-only, **graph stays on screen**
5. Restart it → recovers with no manual reload
6. Waitlisted account, engine up → `PendingApp`
7. Waitlisted account, engine **down** → `EngineDown`, not a populated console
   *(today: `approved`)*
8. KB switch with a failing graph fetch → cleared canvas + scoped error, not the
   previous KB's graph
9. Delete a finding → it leaves the table and the total immediately
10. A thrown error reaches PostHog; an `unreachable` does not — it arrives as an
    event
11. `npm run build` fails when `VITE_API_BASE` is unset in production mode
12. All 173 existing tests still pass
13. `PrivacyPage.tsx` §processors names PostHog **before** `VITE_POSTHOG_KEY` is
    set in production, and §cookies' "no tracking or advertising cookies" stays
    true — verified by reading the initialised `persistence` value

### Rollout

**PostHog first, then the seam change.** Removing the fallback makes latent
failures user-visible for the first time; install the instrument before removing
the thing that was hiding the readings. Otherwise this is a straight replacement
— no flag, no migration, nothing persisted to unwind.

### Repo and production facts verified for this design (2026-07-28 — code over docs)

- `dist/assets/*.js` served from delapan.ai contains `delapan/rag-ecosystem` and
  the literal fixture text — the mock ships to production
- production `VITE_API_BASE` is `https://delapan-api.fly.dev` (correctly set
  today; the localhost default is a latent trap, not a live break)
- `GET https://delapan-api.fly.dev/health` → `200 {"status":"ok","backend":"cloud"}`,
  unauthenticated and outside the rate-limit dependency
  (`api/main.py:59` mounts it without `_API_DEP`)
- CORS preflight from `https://delapan.ai` is correctly configured
- the frontend has **no** error tracking of any kind — no Sentry, no PostHog
- `store.mode` / `ApiMode` have exactly two consumers: the `StatusBar` badge and
  one toast in `store.ts` — the blast radius of removing them is small
- **no existing test depends on the mock fallback.** Only two test files import
  the client: `findingsView.test.ts` mocks the module wholesale, and
  `authHeaders.test.ts` stubs `fetch` to *resolve* with 500/401 and asserts
  `ApiError` — neither exercises the `TypeError` → mock path. Criterion 12 is
  therefore achievable, not aspirational.
- `delapan-ai-site/frontend/lib/posthog-lazy.ts` exists, 108 lines, with 6 tests
  in `posthog-lazy.test.ts` — the port premise is verified, not assumed
- `PrivacyPage.tsx` §processors omits PostHog; §cookies claims "no tracking or
  advertising cookies" — both drive §6's legal constraints
- `delapan-ai-site`'s live PostHog init uses `persistence: "localStorage+cookie"`,
  contradicting its own spec §E — the drift this spec must not inherit
- suite baseline: 173 tests across 20 files, all passing; `tsc --noEmit` clean

## Risks

- **Outages become visible.** That is the point, but it does mean a Fly cold
  start that used to look like a working app now looks like an error. The
  backoff plus `visibilitychange` / `online` re-probes are the mitigation; if
  cold starts prove frequent enough to be annoying, the answer is a warm
  instance, not a fixture.
- **Read-only mode is new surface area.** Every mutation entry point must be
  gated, and one missed path reintroduces the apply-then-rollback flicker. The
  `resolveAppState` tests cover the decision; the wiring needs review.
- **Removing `store.mode` touches the boot path**, where `set({ mode: … })`
  currently happens in three places. Small, but it is the code path every session
  runs through.
- **PostHog is a new third-party dependency on the auth surfaces.** Lazy and
  idle-deferred, cookieless, no-ops without a key — but it is one more thing that
  can fail on a page whose job is to let people in. It must never block render.

## Out of scope

Bundle splitting and the client-side router (#12, #14); `/duet`'s fate (#11);
undo busy-lock (#1), `ids[0]` guard (#3), add-node default type (#9), modal
accessibility (#14), `placeNear` determinism (#15). All go to `writing-plans` as
ordinary fixes on their own footing.
