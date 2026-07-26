# Console Hub (delapan-fe) — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/` a session-aware root that shows a console hub to signed-in users, and move the sigma graph panel to `/kg`.

**Architecture:** The session read moves out of `AuthGate` into a `useSession()` hook so the root can branch on it before rendering. Path→surface resolution becomes a pure `resolveRoute(pathname, hasSession)` that is unit-testable in the DOM-free vitest environment, and `main.tsx` becomes a thin map from surface to element. The console itself is presentational and reads only `session.user.email`.

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public landing page at `/` and an account-gated dashboard."* Phase 1 delivers the gated half.

**Tech Stack:** React 18, TypeScript (strict), Vite 6, Zustand, Supabase JS, Vitest (node environment, no DOM). **No router library.**

**Spec:** `docs/truenorth/specs/2026-07-25-console-hub-fe-design.md`

## Global Constraints

- **Working directory is `frontend/`** (`8star/delapan-ai/frontend`) for every command.
- **Branch is `feat/console-hub`**, cut from `design/pixel8-branding`. Confirm with `git branch --show-current` before committing.
- **No new dependency.** No `react-router`. The `pathname` switch grows instead.
- **`npm run build`** (`tsc --noEmit && vite build`) is the gate and is strict: `noUnusedLocals` and `noUnusedParameters` mean an orphaned import or binding **fails the build**.
- **`npm run test`** (Vitest) must stay green. Baseline before Task 1: **66 tests**. Tests run in a **node environment with no DOM** — do not write tests needing `document`, `window`, or React rendering.
- **Do not touch** `src/graph/`, `src/panels/`, `src/state/` (except the one additive line in Task 4), `src/api/`, or `src/tracking/SignInForm.tsx`.
- **`src/api/authHeaders.test.ts` must stay green** — it covers Supabase token attachment, and Task 1 edits the auth path.
- **Never hard-code a hex.** Colors come from `src/styles/tokens.css`: `--brand-ink`, `--brand-coral`, `--chrome-accent`, `--text`, `--text-dim`, `--text-faint`, `--line`, `--bg0..3`, the `--u`/`--u2`/`--u3`/`--u4`/`--u6`/`--u8` grid scale, `--font-brand`, `--font-display`, `--font-mono`.
- **Every tile must have a real destination.** No tile ships pointing at an unbuilt surface.

---

### Task 1: Extract `useSession()`

`AuthGate` owns the session today. The root needs the same answer before deciding what to render, so the logic moves to a hook. This is a verbatim behaviour-preserving move on the auth path — the riskiest file in the app.

**Files:**
- Create: `src/auth/useSession.ts`
- Modify: `src/auth/AuthGate.tsx` (delete the local session state/effect, consume the hook)

**Interfaces:**
- Consumes: nothing.
- Produces, relied on by Task 3: `useSession(supabase: SupabaseClient): Session | null | undefined` — `undefined` means "still resolving", `null` means "resolved, signed out".

- [ ] **Step 1: Create the hook**

There is no unit test for this task: the hook needs React and a live Supabase client, and vitest here runs without a DOM. Its correctness is established by being a verbatim move plus the existing `authHeaders` tests staying green, and by the browser check in Task 5.

Create `src/auth/useSession.ts`:

```ts
/**
 * The app's single session read. Extracted from AuthGate so the root route can
 * branch on the session *before* deciding what to render — AuthGate gates one
 * subtree, but "/" has to choose between the console and the sign-in form.
 *
 * `undefined` means "still resolving" and is deliberately distinct from `null`
 * ("resolved, signed out"): rendering the signed-out branch during the initial
 * check would flash the sign-in form at every already-signed-in visitor.
 */
import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export function useSession(supabase: SupabaseClient): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return session;
}
```

- [ ] **Step 2: Rewire `AuthGate`**

In `src/auth/AuthGate.tsx`, inside `ConfiguredAuthGate`, delete the `useState` declaration and the entire `useEffect` block (currently lines 12–30) and replace them with:

```ts
  const session = useSession(supabase);
```

Add the import beside the existing ones:

```ts
import { useSession } from "./useSession";
```

Then remove now-unused imports from the top of the file: `useEffect` and `useState` from `"react"`, and `Session` from the `@supabase/supabase-js` type import. **Keep** `SupabaseClient` — it is still used by `ConfiguredAuthGateProps`. Verify with:

```bash
grep -n "useEffect\|useState\|Session\b\|SupabaseClient" src/auth/AuthGate.tsx
```

Leave everything below untouched: the three-way branch (`session === undefined` → "checking session…", `!session` → `SignInForm`, otherwise → `children`), the `AuthGate` wrapper, and its try/catch around `getSupabaseClient()`.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, 66 tests PASS. A "declared but never read" error means step 2 removed too few imports; a "cannot find name" means it removed too many.

- [ ] **Step 4: Commit**

```bash
git add src/auth/useSession.ts src/auth/AuthGate.tsx
git commit -m "refactor(auth): extract useSession so the root can branch on it"
```

---

### Task 2: The console UI

Built before the routing change so the tree never references a component that does not exist.

**Files:**
- Create: `src/console/tiles.ts`
- Create: `src/console/tiles.test.ts`
- Create: `src/console/ConsoleApp.tsx`
- Create: `src/styles/console.css`
- Modify: `src/main.tsx` (import the stylesheet only — no routing change yet)

**Interfaces:**
- Consumes: nothing.
- Produces, relied on by Task 3: `<ConsoleApp session={Session} />` from `src/console/ConsoleApp.tsx`.
- Produces, relied on by Task 5: `TILES: Tile[]` and `type Tile = { href: string; label: string; description: string; external?: boolean }` from `src/console/tiles.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/console/tiles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { TILES } from "./tiles";

describe("console tiles", () => {
  it("offers the four destinations that exist today", () => {
    expect(TILES.map((t) => t.label)).toEqual([
      "knowledge graph", "findings", "tracking", "dua",
    ]);
  });

  it("gives every tile a non-empty href and description", () => {
    for (const t of TILES) {
      expect(t.href.length, `${t.label} needs an href`).toBeGreaterThan(0);
      expect(t.description.length, `${t.label} needs a description`).toBeGreaterThan(0);
    }
  });

  it("marks only the off-site destination external", () => {
    const external = TILES.filter((t) => t.external);
    expect(external.map((t) => t.label)).toEqual(["dua"]);
    for (const t of external) expect(t.href).toMatch(/^https:\/\//);
  });

  it("keeps every in-app tile on a path this app serves", () => {
    for (const t of TILES.filter((t) => !t.external)) {
      expect(t.href.startsWith("/"), `${t.label} must be a root-relative path`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test -- src/console/tiles.test.ts
```

Expected: FAIL — `Failed to resolve import "./tiles"`.

- [ ] **Step 3: Write the tile list**

Create `src/console/tiles.ts`:

```ts
/**
 * Console destinations. Every entry points at a surface that EXISTS — a tile
 * promising an unbuilt page is worse than no tile, because the console is the
 * first screen after signing in and sets the expectation for everything else.
 *
 * dua is a separate deployment (see vercel.json's /dua/* redirect), so it is
 * an absolute URL rather than a route this app resolves.
 */
export interface Tile {
  href: string;
  label: string;
  description: string;
  external?: boolean;
}

export const TILES: Tile[] = [
  {
    href: "/kg",
    label: "knowledge graph",
    description: "explore and edit the graph",
  },
  {
    href: "/kg?view=findings",
    label: "findings",
    description: "the atomic units of what you know",
  },
  {
    href: "/tracking",
    label: "tracking",
    description: "project tracker",
  },
  {
    href: "https://dua.delapan.ai",
    label: "dua",
    description: "the couples interview companion",
    external: true,
  },
];
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- src/console/tiles.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Write the console component**

Create `src/console/ConsoleApp.tsx`:

```tsx
/**
 * The console — the first screen after signing in. Greeting, one obvious
 * resume action into the graph panel, the destinations this account can reach,
 * and an account block (email + sign out) rather than an account page: those
 * two facts are all the account data available without new API surface.
 */
import type { Session } from "@supabase/supabase-js";
import { Logomark } from "../panels/Logomark";
import { getSupabaseClient } from "../tracking/supabaseClient";
import { TILES } from "./tiles";

export function ConsoleApp({ session }: { session: Session }) {
  const email = session.user.email ?? null;
  const handle = email?.split("@")[0] ?? "there";

  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <div className="cons">
      <header className="cons-head">
        <Logomark size={40} />
        <div className="cons-brand-text">
          <span className="cons-wordmark">delapan</span>
          {email && <span className="cons-sub">signed in as {email}</span>}
        </div>
      </header>

      <main className="cons-body">
        <h1 className="cons-greet">welcome back, {handle}</h1>

        <a className="cons-resume" href="/kg">
          <span className="cons-resume-kicker">jump back in</span>
          <span className="cons-resume-title">knowledge graph control</span>
        </a>

        <h2 className="cons-section">everything else</h2>
        <div className="cons-grid">
          {TILES.map((tile) => (
            <a
              key={tile.href}
              className="cons-tile"
              href={tile.href}
              {...(tile.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <span className="cons-tile-label">
                {tile.label}
                {tile.external && <span className="cons-tile-ext"> ↗</span>}
              </span>
              <span className="cons-tile-desc">{tile.description}</span>
            </a>
          ))}
        </div>

        <section className="cons-account">
          <h2 className="cons-section">account</h2>
          {email && <p className="cons-account-email">{email}</p>}
          <button className="btn" onClick={signOut}>
            sign out
          </button>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 6: Write the stylesheet**

Create `src/styles/console.css`. Every value comes from a token — no literal hexes, and spacing snaps to the `--u` scale:

```css
/* the console — post-login home. Hairlines, no shadows, 4px grid, flush left. */

.cons {
  min-height: 100vh;
  background: var(--bg0);
  color: var(--text);
}

.cons-head {
  display: flex;
  align-items: center;
  gap: var(--u3);
  padding: var(--u4) var(--u6);
  border-bottom: 1px solid var(--line);
}

.cons-brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.1;
}

.cons-wordmark {
  font-family: var(--font-brand);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  text-transform: lowercase;
  color: var(--brand-ink);
}

.cons-sub {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

.cons-body {
  max-width: 880px;
  margin: 0 auto;
  padding: var(--u8) var(--u6);
}

.cons-greet {
  margin: 0 0 var(--u6);
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: lowercase;
}

.cons-resume {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  padding: var(--u4) var(--u6);
  margin-bottom: var(--u8);
  background: var(--bg1);
  border: 1px solid var(--line);
  border-left: 3px solid var(--chrome-accent);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
  transition: border-color 120ms, background 120ms;
}

.cons-resume:hover {
  background: var(--bg2);
}

.cons-resume-kicker {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.cons-resume-title {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 600;
  text-transform: lowercase;
}

.cons-section {
  margin: 0 0 var(--u3);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-weight: 400;
  color: var(--text-faint);
}

.cons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--u4);
  margin-bottom: var(--u8);
}

.cons-tile {
  display: flex;
  flex-direction: column;
  gap: var(--u);
  padding: var(--u4);
  background: var(--bg1);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  text-decoration: none;
  color: inherit;
  transition: border-color 120ms, background 120ms;
}

.cons-tile:hover {
  background: var(--bg2);
  border-color: var(--line-bright);
}

.cons-tile-label {
  font-size: 14px;
  font-weight: 500;
}

.cons-tile-ext {
  color: var(--text-faint);
}

.cons-tile-desc {
  font-size: 12px;
  color: var(--text-dim);
}

.cons-account {
  padding-top: var(--u6);
  border-top: 1px solid var(--line);
}

.cons-account-email {
  margin: 0 0 var(--u3);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-dim);
}
```

- [ ] **Step 7: Register the stylesheet**

In `src/main.tsx`, add one import line beside the other stylesheet imports (after `"./styles/panels.css"`), and change nothing else in the file yet:

```ts
import "./styles/console.css";
```

- [ ] **Step 8: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, 70 tests PASS (66 + 4).

- [ ] **Step 9: Commit**

```bash
git add src/console src/styles/console.css src/main.tsx
git commit -m "feat(console): hub component, tiles, and styles"
```

---

### Task 3: Route resolution and the session-aware root

**Files:**
- Create: `src/routes.ts`
- Create: `src/routes.test.ts`
- Create: `src/Root.tsx`
- Modify: `src/main.tsx` (replace the inline ternary with `<Root/>`)

**Interfaces:**
- Consumes: `useSession()` (Task 1), `<ConsoleApp session={...}/>` (Task 2).
- Produces: `resolveRoute(pathname: string, hasSession: boolean): Surface` and `type Surface = "console" | "signin" | "panel" | "tracking" | "duet"`.

- [ ] **Step 1: Write the failing test**

Create `src/routes.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveRoute } from "./routes";

describe("resolveRoute", () => {
  it("sends a signed-in visitor at the root to the console", () => {
    expect(resolveRoute("/", true)).toBe("console");
  });

  it("sends a signed-out visitor at the root to sign-in", () => {
    expect(resolveRoute("/", false)).toBe("signin");
  });

  it("routes /kg to the graph panel regardless of session", () => {
    expect(resolveRoute("/kg", true)).toBe("panel");
    expect(resolveRoute("/kg", false)).toBe("panel");
  });

  it("keeps tracking and duet on their own surfaces", () => {
    expect(resolveRoute("/tracking", true)).toBe("tracking");
    expect(resolveRoute("/duet", true)).toBe("duet");
  });

  it("normalises a trailing slash", () => {
    expect(resolveRoute("/kg/", true)).toBe("panel");
    expect(resolveRoute("/tracking/", true)).toBe("tracking");
    expect(resolveRoute("", true)).toBe("console");
  });

  it("falls back to the panel for unknown paths, so old links still land somewhere", () => {
    expect(resolveRoute("/whatever", true)).toBe("panel");
    expect(resolveRoute("/some/deep/path", true)).toBe("panel");
  });

  it("changes meaning for the root ONLY — every other path ignores the session", () => {
    for (const p of ["/kg", "/tracking", "/duet", "/unknown"]) {
      expect(resolveRoute(p, true)).toBe(resolveRoute(p, false));
    }
    expect(resolveRoute("/", true)).not.toBe(resolveRoute("/", false));
  });
});
```

- [ ] **Step 2: Run it to make sure it fails**

```bash
npm run test -- src/routes.test.ts
```

Expected: FAIL — `Failed to resolve import "./routes"`.

- [ ] **Step 3: Write the resolver**

Create `src/routes.ts`:

```ts
/**
 * Path → surface. A pure function so the routing decision is testable without a
 * DOM; main.tsx is then a thin map from surface to element.
 *
 * The unknown-path fallback is the panel, deliberately: "/" is the only path
 * whose meaning changes in this release, so a stale bookmark to anything else
 * still lands on the graph app instead of a blank screen.
 */
export type Surface = "console" | "signin" | "panel" | "tracking" | "duet";

export function resolveRoute(pathname: string, hasSession: boolean): Surface {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return hasSession ? "console" : "signin";
  if (path === "/tracking") return "tracking";
  if (path === "/duet") return "duet";
  return "panel";
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm run test -- src/routes.test.ts
```

Expected: 7 tests PASS.

- [ ] **Step 5: Write the root component**

Hooks cannot run at module top level, so the session-aware branch needs a component. Create `src/Root.tsx`:

```tsx
/**
 * Top-level surface switch. Reads the session once (the root is the only route
 * whose meaning depends on it) and maps the resolved surface to an element.
 *
 * "/" renders the console or the sign-in form directly rather than going
 * through AuthGate, because AuthGate gates a subtree — here the two branches
 * are different pages, not gated/ungated versions of one page.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import App from "./App";
import { AuthGate } from "./auth/AuthGate";
import { useSession } from "./auth/useSession";
import { ConsoleApp } from "./console/ConsoleApp";
import { DuetApp } from "./duet/DuetApp";
import { resolveRoute } from "./routes";
import { SignInForm } from "./tracking/SignInForm";
import { getSupabaseClient } from "./tracking/supabaseClient";
import { TrackingApp } from "./tracking/TrackingApp";

export function Root() {
  // Mirrors AuthGate's own guard: getSupabaseClient() throws when the env vars
  // are absent, and that must render a message rather than a white screen.
  try {
    return <ConfiguredRoot supabase={getSupabaseClient()} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth is not configured.";
    return (
      <main className="tracking-state">
        <p className="tracking-error">{message}</p>
      </main>
    );
  }
}

function ConfiguredRoot({ supabase }: { supabase: SupabaseClient }) {
  const session = useSession(supabase);
  const surface = resolveRoute(window.location.pathname, Boolean(session));

  if (surface === "tracking") return <TrackingApp />;
  if (surface === "duet") return <DuetApp />;
  if (surface === "panel") {
    return (
      <AuthGate>
        <App />
      </AuthGate>
    );
  }

  // "/" — wait for the session to resolve before choosing, so an already
  // signed-in visitor never sees the sign-in form flash.
  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }
  if (surface === "console" && session) return <ConsoleApp session={session} />;
  return <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />;
}
```

- [ ] **Step 6: Rewire `main.tsx`**

Replace the routing block. The file currently computes `const path = ...` and renders a three-way ternary; both go away. Keep every stylesheet import exactly as it is (including the `console.css` line added in Task 2):

```tsx
import { createRoot } from "react-dom/client";
import { Root } from "./Root";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/console.css";
import "./styles/canvas.css";
import "./styles/tracking.css";
import "./styles/motion.css";

createRoot(document.getElementById("root")!).render(<Root />);
```

Note the now-unused imports of `App`, `AuthGate`, `DuetApp`, and `TrackingApp` are gone from this file — they moved to `Root.tsx`. The build fails on any you leave behind.

- [ ] **Step 7: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, 77 tests PASS (70 + 7).

- [ ] **Step 8: Commit**

```bash
git add src/routes.ts src/routes.test.ts src/Root.tsx src/main.tsx
git commit -m "feat(routing): session-aware root, graph panel moves to /kg"
```

---

### Task 4: The findings deep-link

The findings tile points at `/kg?view=findings`. Without this task it lands on the graph view and the tile is a lie.

**Files:**
- Modify: `src/App.tsx` (the existing boot effect)

**Interfaces:**
- Consumes: `TILES` (Task 2) supplies the link; the store's `setView` already exists.
- Produces: nothing.

- [ ] **Step 1: Read the current boot effect**

`src/App.tsx` has, around line 30:

```tsx
  useEffect(() => {
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

- [ ] **Step 2: Add the param read**

`view` is already selected in this component (`const view = useStore((s) => s.view)`). Add `setView` beside it:

```tsx
  const setView = useStore((s) => s.setView);
```

Then extend the boot effect:

```tsx
  useEffect(() => {
    // the console's findings tile deep-links here; honour it once, on boot.
    if (new URLSearchParams(window.location.search).get("view") === "findings") {
      setView("findings");
    }
    void boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
```

`setView("findings")` also triggers `loadFindings()` (see `src/state/store.ts:362-365`), so the data loads without extra wiring. When the param is absent the effect behaves exactly as before.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, 77 tests PASS. No test covers this (it needs a DOM and a live store); Task 5 checks it in the browser.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat(app): honour ?view=findings on boot for the console deep-link"
```

---

### Task 5: Verify every surface

No new code unless a defect is found. Half of this is now checkable without a session — that is a deliberate benefit of the routing change.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Signed-out checks (no session needed)**

- `http://localhost:5173/` → the sign-in form, titled "delapan".
- `http://localhost:5173/kg` → `AuthGate`'s sign-in form (the panel is gated).
- `http://localhost:5173/whatever` → same as `/kg`; the fallback works.

None of these should flash a different screen first.

- [ ] **Step 3: Signed-in checks**

Sign in through the form, then confirm:

- `/` → the console: pixel-8 mark, "signed in as <your email>", greeting, resume card, four tiles, account block.
- The resume card → `/kg`, and the graph panel loads as it always did.
- The `findings` tile → `/kg?view=findings` and the findings view is showing, **not** the graph.
- The `tracking` tile → `/tracking`.
- The `dua` tile opens `dua.delapan.ai` in a new tab.
- **Sign out** from the account block returns you to the sign-in form at `/`.

- [ ] **Step 4: Confirm no session flash**

Hard-reload `/` while signed in. You must see "checking session…" (or nothing) and then the console — never the sign-in form first. That flash is what the `undefined` session state exists to prevent.

- [ ] **Step 5: Final gate**

```bash
npm run build && npm run test && git status --porcelain
```

Expected: build PASS, 77 tests PASS, working tree clean.

---

## Self-review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 Routing table — `/`, `/kg`, `/tracking`, `/duet`, fallback | 3 |
| §1 No `vercel.json` change | none needed — asserted, not edited |
| §2 `useSession()`, AuthGate consumes it | 1 |
| §3 Console: header, resume, tiles, account block | 2 |
| §3 Tiles — only real destinations | 2 (asserted in `tiles.test.ts`) |
| §3 Findings deep-link via `?view=findings` | 2 (the href) + 4 (the read) |
| §4 Visual language — tokens, grid, hairlines, brand | 2 (`console.css`) |
| §5 Verification 1 — route resolution unit-tested | 3 |
| §5 Verification 2 — tile targets unit-tested | 2 |
| §5 Verification 3 — build passes | every task |
| §5 Verification 4 — browser pass, signed-out half unaided | 5 |

No gaps.

**Type consistency:** `useSession(supabase)` is defined in Task 1 and consumed in Task 3. `Surface` and `resolveRoute` are defined in Task 3 and used only there. `Tile`/`TILES` are defined in Task 2 and asserted in its own test. `<ConsoleApp session={Session}/>` matches its call site in `Root.tsx`. `Logomark` takes `size` (it also accepts `mode`, defaulted to `"ink"`, which is correct on this light surface).

**Ordering note:** Task 2 lands the console before Task 3 references it, so the tree compiles after every task. Task 4 is independent of 2 and 3 except that the tile href it honours is created in Task 2.
