# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bare sign-in form at logged-out `/` with a public landing page arguing that delapan is agent memory you can audit, and move sign-in to `/login`.

**Architecture:** `resolveRoute` gains `landing` and `redirect-home` surfaces plus a `/login` path, staying a pure unit-testable function. The page is ten presentational components under `src/landing/`, each in its own file with no shared state, composed by `LandingApp`. Sections land in groups so the page is renderable and reviewable after every task.

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public landing page at `/`."*

**Tech Stack:** React 18, TypeScript (strict), Vite 6, Vitest (node env, no DOM). **No router, no new dependency.**

**Spec:** `docs/truenorth/specs/2026-07-26-landing-page-design.md`

## Global Constraints

- **Working directory is `frontend/`** (`8star/delapan-ai/frontend`). Branch `feat/landing-page` — confirm with `git branch --show-current` before every commit.
- **No new dependency.** No router, no animation library, no icon package.
- **`npm run build`** (`tsc --noEmit && vite build`) is the gate and is strict: `noUnusedLocals`/`noUnusedParameters` fail on orphans.
- **`npm run test`** baseline before Task 1: **77 passing.** Vitest runs in a **node environment with no DOM** — test pure functions only, never components.
- **Never hard-code a hex.** Tokens only, from `src/styles/tokens.css`.
- **No `--data-*` token may appear on this page.** Those encode categorical graph channels; nothing on a landing page is one. `--state-rich`/`--state-sparse`/`--state-gap` ARE correct for the coverage verdicts — that is their real meaning.
- **Copy is lowercase** for UI furniture, matching the app. Section prose may use sentence case.
- **No claim may exceed what ships.** The spec's claims table is authoritative; anything marked `planned` there must be visibly labelled `planned` on the page.
- **No invented metrics.** There is no verified benchmark for delapan. Do not add percentages, multipliers, latency figures, or user counts.
- **No autoplay, no scroll-jacking, no entrance animation, no countdown.** Calm technology governs this page.
- **Do not touch** `src/graph/`, `src/panels/`, `src/state/`, `src/api/`, `src/console/`, `src/auth/`, or `src/tracking/SignInForm.tsx`.

---

### Task 1: Routing — `landing`, `/login`, and the signed-in redirect

Pure function first, no UI. After this task the app still behaves as it does today, because nothing renders the new surfaces yet.

**Files:**
- Modify: `src/routes.ts`
- Modify: `src/routes.test.ts`

**Interfaces:**
- Produces, relied on by Task 2: `Surface` gains `"landing"` and `"redirect-home"`; `resolveRoute("/", false) === "landing"`, `resolveRoute("/login", false) === "signin"`, `resolveRoute("/login", true) === "redirect-home"`.

- [ ] **Step 1: Write the failing tests**

Append to `src/routes.test.ts`:

```ts
describe("landing and /login", () => {
  it("shows the landing page to a signed-out visitor at the root", () => {
    expect(resolveRoute("/", false)).toBe("landing");
  });

  it("still shows the console to a signed-in visitor at the root", () => {
    expect(resolveRoute("/", true)).toBe("console");
  });

  it("puts the sign-in form on /login", () => {
    expect(resolveRoute("/login", false)).toBe("signin");
  });

  it("sends an already signed-in visitor away from /login", () => {
    expect(resolveRoute("/login", true)).toBe("redirect-home");
  });

  it("normalises a trailing slash on /login", () => {
    expect(resolveRoute("/login/", false)).toBe("signin");
  });

  it("still routes everything else by path alone", () => {
    for (const p of ["/kg", "/tracking", "/duet", "/unknown"]) {
      expect(resolveRoute(p, true)).toBe(resolveRoute(p, false));
    }
  });
});
```

**Note:** the existing test `"sends a signed-out visitor at the root to sign-in"` asserts `resolveRoute("/", false) === "signin"` and is now wrong. Update that one existing assertion to `"landing"` and rename the test to match. Do not delete it — it becomes the landing assertion above, so remove the now-duplicated old copy rather than keeping both.

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test -- src/routes.test.ts
```

Expected: FAIL — `expected 'signin' to be 'landing'`.

- [ ] **Step 3: Update the resolver**

Replace the body of `src/routes.ts`:

```ts
/**
 * Path → surface. A pure function so the routing decision is testable without a
 * DOM; Root.tsx is then a thin map from surface to element.
 *
 * The unknown-path fallback is the panel, deliberately: a stale bookmark still
 * lands on the graph app instead of a blank screen.
 *
 * "redirect-home" exists so the "already signed in, don't show them a login
 * form" rule is a tested branch rather than a side effect buried in a component.
 */
export type Surface =
  | "landing"
  | "signin"
  | "redirect-home"
  | "console"
  | "panel"
  | "tracking"
  | "duet";

export function resolveRoute(pathname: string, hasSession: boolean): Surface {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return hasSession ? "console" : "landing";
  if (path === "/login") return hasSession ? "redirect-home" : "signin";
  if (path === "/tracking") return "tracking";
  if (path === "/duet") return "duet";
  return "panel";
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npm run test
```

Expected: 82 passing (77 + 6 new − 1 replaced).

- [ ] **Step 5: Commit**

```bash
git add src/routes.ts src/routes.test.ts
git commit -m "feat(routing): add the landing surface and a /login path"
```

---

### Task 2: Landing shell, hero, and stylesheet

After this task `/` renders a real (short) landing page. Every later task adds sections below the hero.

**Files:**
- Create: `src/landing/LandingApp.tsx`
- Create: `src/landing/Hero.tsx`
- Create: `src/styles/landing.css`
- Modify: `src/Root.tsx` (render the new surfaces)
- Modify: `src/main.tsx` (import the stylesheet)

**Interfaces:**
- Consumes: `resolveRoute` (Task 1).
- Produces, relied on by Tasks 3–5: `<LandingApp/>` from `src/landing/LandingApp.tsx`, which composes section components in order.

- [ ] **Step 1: Write the stylesheet foundation**

Create `src/styles/landing.css`:

```css
/* the public landing page. Hairlines, 4px grid, flush left, no motion.
   base.css sets `body { overflow: hidden }` for the full-screen graph app and
   that propagates to the viewport, so a full-page surface MUST scroll itself —
   the console shipped without this once and its lower half was unreachable. */

.lp {
  height: 100%;
  overflow: auto;
  background: var(--bg0);
  color: var(--text);
}

.lp-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 0 var(--u6);
}

.lp-nav {
  display: flex;
  align-items: center;
  gap: var(--u3);
  padding: var(--u4) var(--u6);
  border-bottom: 1px solid var(--line);
}

.lp-wordmark {
  font-family: var(--font-brand);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
  text-transform: lowercase;
  color: var(--brand-ink);
}

.lp-nav-cta {
  margin-left: auto;
}

/* --- hero ---------------------------------------------------------------- */

.lp-hero {
  padding: var(--u8) 0 var(--u8);
}

.lp-hero h1 {
  margin: 0 0 var(--u4);
  max-width: 18ch;
  font-family: var(--font-display);
  font-size: clamp(34px, 6vw, 54px);
  font-weight: 600;
  line-height: 1.08;
  letter-spacing: 0.01em;
  text-transform: lowercase;
}

.lp-lede {
  margin: 0 0 var(--u6);
  max-width: 60ch;
  font-size: 16px;
  line-height: 1.6;
  color: var(--text-dim);
}

.lp-cta-row {
  display: flex;
  align-items: center;
  gap: var(--u4);
  flex-wrap: wrap;
}

.lp-cta {
  display: inline-block;
  padding: var(--u3) var(--u6);
  background: var(--chrome-accent);
  color: var(--bg0);
  border-radius: var(--radius);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.lp-cta:hover {
  background: var(--chrome-accent-bright);
}

.lp-cta-note {
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  color: var(--text-faint);
}

/* --- shared section furniture -------------------------------------------- */

.lp-section {
  padding: var(--u8) 0;
  border-top: 1px solid var(--line);
}

.lp-kicker {
  margin: 0 0 var(--u3);
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.lp-section h2 {
  margin: 0 0 var(--u4);
  max-width: 24ch;
  font-family: var(--font-display);
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 600;
  line-height: 1.15;
  text-transform: lowercase;
}

.lp-body {
  margin: 0 0 var(--u4);
  max-width: 62ch;
  font-size: 15px;
  line-height: 1.65;
  color: var(--text-dim);
}

.lp-body:last-child {
  margin-bottom: 0;
}

.lp-code {
  font-family: var(--font-mono);
  font-size: 0.92em;
  color: var(--text);
}
```

- [ ] **Step 2: Write the hero**

Create `src/landing/Hero.tsx`. The copy is fixed by the spec — do not reword it:

```tsx
/**
 * Hero. Problem-first, and the promise is one the shipped code keeps: findings
 * carry grounded_in, and the write-time resolver retires rather than deletes.
 */
import { Logomark } from "../panels/Logomark";

export function Hero() {
  return (
    <>
      <nav className="lp-nav">
        <Logomark size={40} />
        <span className="lp-wordmark">delapan</span>
        <a className="lp-cta lp-nav-cta" href="/login">
          sign in
        </a>
      </nav>

      <header className="lp-inner lp-hero">
        <h1>your agent learns something. where did it come from, and what happens when it changes?</h1>
        <p className="lp-lede">
          delapan researches a domain once, keeps every fact with the source it came from, and
          corrects itself when the facts move — without ever losing what it knew before.
        </p>
        <div className="lp-cta-row">
          <a className="lp-cta" href="/login">
            request an invite
          </a>
          <span className="lp-cta-note">free · invite-gated beta</span>
        </div>
      </header>
    </>
  );
}
```

- [ ] **Step 3: Write the shell**

Create `src/landing/LandingApp.tsx`. Later tasks add imports and elements here in order:

```tsx
/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 */
import { Hero } from "./Hero";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
    </div>
  );
}
```

- [ ] **Step 4: Wire the new surfaces into `Root`**

In `src/Root.tsx`, add these imports beside the existing ones:

```ts
import { useEffect } from "react";
import { LandingApp } from "./landing/LandingApp";
```

Add this component above `ConfiguredRoot`:

```tsx
/** Already signed in and asking for /login — send them home. */
function RedirectHome() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return (
    <main className="tracking-state">
      <span className="spin" /> taking you home…
    </main>
  );
}
```

Then replace the tail of `ConfiguredRoot` — everything from the `session === undefined` comment onward — with:

```tsx
  // These three depend on the session, so wait for it to resolve. Rendering
  // early would flash the landing page at an already-signed-in visitor.
  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }
  if (surface === "redirect-home") return <RedirectHome />;
  if (surface === "console" && session) return <ConsoleApp session={session} />;
  if (surface === "signin") {
    return <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />;
  }
  return <LandingApp />;
```

- [ ] **Step 5: Register the stylesheet**

In `src/main.tsx`, add one line beside the other stylesheet imports, after `./styles/console.css`:

```ts
import "./styles/landing.css";
```

- [ ] **Step 6: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, 82 tests PASS.

```bash
npm run dev
```

Open `http://localhost:5173/` — the hero renders, no session needed. `http://localhost:5173/login` shows the sign-in form. Report what you see; this page is fully public so there is nothing you cannot check.

- [ ] **Step 7: Commit**

```bash
git add src/landing src/styles/landing.css src/Root.tsx src/main.tsx
git commit -m "feat(landing): hero, shell, and the /login split"
```

---

### Task 3: The problem, and the three shipped pillars

**Files:**
- Create: `src/landing/Problem.tsx`
- Create: `src/landing/Pillars.tsx`
- Modify: `src/landing/LandingApp.tsx`
- Modify: `src/styles/landing.css` (append the pillar grid)

**Interfaces:**
- Consumes: the section furniture classes from Task 2.
- Produces: `<Problem/>`, `<Pillars/>`.

- [ ] **Step 1: Write the problem section**

Create `src/landing/Problem.tsx`:

```tsx
/**
 * 01 — the gap core/memory/ exists to close. Every claim here describes the
 * status quo delapan is arguing against, not a delapan feature.
 */
export function Problem() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">01 — the problem</p>
      <h2>agent memory is append-only</h2>
      <p className="lp-body">
        Ingest the same domain twice and you get two copies of the same fact. Correct something and
        you either overwrite the old version — losing the history of what you believed and when — or
        leave the contradiction sitting in the store for a retrieval to pick at random.
      </p>
      <p className="lp-body">
        And when an agent finally answers, nothing tells you which stored fact it leaned on, where
        that fact came from, or whether it was still true.
      </p>
    </section>
  );
}
```

- [ ] **Step 2: Append the pillar grid styles**

Append to `src/styles/landing.css`:

```css
/* --- pillars -------------------------------------------------------------- */

.lp-pillars {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--u6);
  margin-top: var(--u6);
}

.lp-pillar h3 {
  margin: 0 0 var(--u2);
  font-size: 15px;
  font-weight: 600;
  text-transform: lowercase;
}

.lp-pillar p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dim);
}

.lp-pillar-rule {
  width: 24px;
  height: 2px;
  margin-bottom: var(--u3);
  background: var(--chrome-accent);
}
```

- [ ] **Step 3: Write the pillars**

Create `src/landing/Pillars.tsx`. Every claim here is shipped — see the spec's claims table:

```tsx
/**
 * 02 — what delapan actually does. Three shipped capabilities:
 * grounded_in provenance, the write-time resolver, and bi-temporal retirement.
 * No claim in this file is aspirational.
 */
export function Pillars() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">02 — what delapan does</p>
      <h2>every fact keeps its source, and its history</h2>

      <div className="lp-pillars">
        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>grounded</h3>
          <p>
            Every finding carries <span className="lp-code">grounded_in</span> — the source it was
            extracted from. Graph nodes and edges keep it too, so a claim can be traced back to the
            page it came from rather than to a similarity score.
          </p>
        </div>

        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>self-correcting</h3>
          <p>
            A candidate fact is resolved against what the base already knows{" "}
            <em>before</em> it is written — add, update, no-op, or supersede. Re-ingesting
            overlapping material produces updates, not another copy.
          </p>
        </div>

        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>nothing is lost</h3>
          <p>
            Superseding retires a fact; it never deletes one. Each carries{" "}
            <span className="lp-code">valid_from</span>,{" "}
            <span className="lp-code">invalidated_at</span> and{" "}
            <span className="lp-code">superseded_by</span>, so you can ask what the base believed at
            any point. Archived bases come back with their counts intact.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Compose**

In `src/landing/LandingApp.tsx`, add the imports and elements:

```tsx
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
      <Problem />
      <Pillars />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run build && npm run test && npm run dev
```

Expected: build PASS, 82 tests PASS. In the browser at `/`, both sections render below the hero and the page scrolls. Confirm scrolling explicitly — `body` has `overflow: hidden` globally, so `.lp` doing its own scrolling is load-bearing.

- [ ] **Step 6: Commit**

```bash
git add src/landing src/styles/landing.css
git commit -m "feat(landing): the problem and the three shipped pillars"
```

---

### Task 4: Coverage and where it plugs in

**Files:**
- Create: `src/landing/Coverage.tsx`
- Create: `src/landing/WhereItPlugsIn.tsx`
- Modify: `src/landing/LandingApp.tsx`
- Modify: `src/styles/landing.css`

**Interfaces:**
- Produces: `<Coverage/>`, `<WhereItPlugsIn/>`.

- [ ] **Step 1: Append the styles**

Append to `src/styles/landing.css`:

```css
/* --- coverage verdicts ---------------------------------------------------- */

.lp-verdicts {
  display: grid;
  gap: var(--u3);
  margin-top: var(--u6);
}

.lp-verdict {
  display: flex;
  align-items: baseline;
  gap: var(--u3);
  padding: var(--u3) var(--u4);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--bg1);
}

.lp-verdict-glyph {
  font-size: 12px;
  line-height: 1;
}

.lp-verdict-name {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  min-width: 8ch;
}

.lp-verdict-note {
  font-size: 14px;
  color: var(--text-dim);
}

/* --- plug-in targets ------------------------------------------------------ */

.lp-targets {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: var(--u6);
  margin-top: var(--u6);
}

.lp-target h3 {
  margin: 0 0 var(--u2);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.lp-target p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dim);
}
```

- [ ] **Step 2: Write the coverage section**

Create `src/landing/Coverage.tsx`. The glyphs and tokens are the same ones the product renders — that is the point:

```tsx
/**
 * 03 — coverage banding. Uses the SAME glyphs and --state-* tokens the app
 * renders, so the marketing and the product agree rather than merely resembling
 * each other. Dual-encoded: glyph AND name AND colour, never colour alone.
 */
const VERDICTS = [
  {
    glyph: "●",
    name: "rich",
    token: "var(--state-rich)",
    note: "the base already covers this. answered from what it knows, no research run.",
  },
  {
    glyph: "▲",
    name: "sparse",
    token: "var(--state-sparse)",
    note: "thin coverage. it answers what it has and tells you the grounding is partial.",
  },
  {
    glyph: "■",
    name: "gap",
    token: "var(--state-gap)",
    note: "not covered. it says so instead of guessing, and can go research it.",
  },
];

export function Coverage() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">03 — coverage</p>
      <h2>it tells you what it doesn't know</h2>
      <p className="lp-body">
        Every read is scored against the base before any work happens, and comes back banded. An
        agent that knows its grounding is thin can say so — which is the difference between a
        confident answer and a trustworthy one.
      </p>

      <div className="lp-verdicts">
        {VERDICTS.map((v) => (
          <div className="lp-verdict" key={v.name}>
            <span className="lp-verdict-glyph" style={{ color: v.token }}>
              {v.glyph}
            </span>
            <span className="lp-verdict-name" style={{ color: v.token }}>
              {v.name}
            </span>
            <span className="lp-verdict-note">{v.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write the plug-in section**

Create `src/landing/WhereItPlugsIn.tsx`:

```tsx
/**
 * 04 — the two shipped surfaces: the MCP server (6 tools) and the /api
 * surface. Both are in backend/README.md's "What's inside" table.
 */
export function WhereItPlugsIn() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">04 — where it plugs in</p>
      <h2>in your editor, or in your product</h2>

      <div className="lp-targets">
        <div className="lp-target">
          <h3>claude code</h3>
          <p>
            A plugin exposes the base over MCP — resume, search, explore, backlog, projects,
            archive. Your assistant reads the grounding as part of its normal context, and every
            answer can name the findings it used.
          </p>
        </div>

        <div className="lp-target">
          <h3>your product</h3>
          <p>
            The same engine serves an HTTP API behind your own key. One request returns a grounded
            context block and its coverage band, ready to drop into a prompt.
          </p>
        </div>

        <div className="lp-target">
          <h3>your machine</h3>
          <p>
            The local tier runs on SQLite with no credentials and no cloud. The hosted tier is the
            same engine behind the same storage protocol — the code cannot tell them apart.
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Compose**

Update `src/landing/LandingApp.tsx` to import and render `<Coverage/>` then `<WhereItPlugsIn/>` after `<Pillars/>`, keeping imports alphabetically ordered as the file already does.

- [ ] **Step 5: Verify**

```bash
npm run build && npm run test && npm run dev
```

Expected: build PASS, 82 tests PASS. In the browser, confirm the three verdict rows show glyph + name + note, and that each verdict is legible with colour removed — the glyph and the name must carry it. Check by adding a temporary `filter: grayscale(1)` in devtools, then removing it.

- [ ] **Step 6: Commit**

```bash
git add src/landing src/styles/landing.css
git commit -m "feat(landing): coverage banding and the plug-in surfaces"
```

---

### Task 5: What it isn't, what isn't built, and the close

The section that earns the page's argument.

**Files:**
- Create: `src/landing/WhatItIsnt.tsx`
- Create: `src/landing/ClosingCta.tsx`
- Create: `src/landing/Footer.tsx`
- Modify: `src/landing/LandingApp.tsx`
- Modify: `src/styles/landing.css`

**Interfaces:**
- Produces: `<WhatItIsnt/>`, `<ClosingCta/>`, `<Footer/>`.

- [ ] **Step 1: Append the styles**

Append to `src/styles/landing.css`:

```css
/* --- what it isn't / not built yet ---------------------------------------- */

.lp-contrasts {
  display: grid;
  gap: var(--u4);
  margin-top: var(--u6);
}

.lp-contrast {
  padding-left: var(--u4);
  border-left: 2px solid var(--line-bright);
}

.lp-contrast b {
  display: block;
  margin-bottom: var(--u);
  font-size: 14px;
  font-weight: 600;
}

.lp-contrast span {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-dim);
}

.lp-planned {
  display: grid;
  gap: var(--u2);
  margin-top: var(--u6);
  padding-top: var(--u6);
  border-top: 1px solid var(--line);
}

.lp-planned-row {
  display: flex;
  align-items: baseline;
  gap: var(--u3);
  font-size: 14px;
  color: var(--text-dim);
}

.lp-planned-tag {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 1px var(--u2);
}

/* --- close + footer ------------------------------------------------------- */

.lp-close {
  padding: var(--u8) 0;
  border-top: 1px solid var(--line);
}

.lp-footer {
  display: flex;
  align-items: center;
  gap: var(--u3);
  padding: var(--u6);
  border-top: 1px solid var(--line);
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-faint);
}
```

- [ ] **Step 2: Write the section**

Create `src/landing/WhatItIsnt.tsx`. The `planned` block is the spec's honesty requirement — the three items are Planned Detours in the vision and must not be implied as working:

```tsx
/**
 * 05 — positioning, then the part that earns it: what is NOT built yet.
 * The three planned items are Planned Detours in docs/truenorth/vision.md.
 * A page arguing for auditability cannot hide its own roadmap.
 */
const CONTRASTS = [
  {
    title: "not a memory layer",
    body: "Stores of facts hand your agent raw material it still has to reason over. delapan keeps the reasoning already distilled, scored, and attributed.",
  },
  {
    title: "not a vector database",
    body: "A vector store holds embeddings and returns neighbours. It has no opinion about whether a fact superseded another, or where either came from.",
  },
  {
    title: "not a RAG framework",
    body: "Frameworks hand you parts to assemble. This is an engine that researches, resolves and serves — with the storage seam already behind it.",
  },
];

const PLANNED = [
  "watching the graph build itself live, as an ingest runs",
  "previewing the consequence of a graph edit before you commit it",
  "elasticsearch as an alternative retrieval backend",
];

export function WhatItIsnt() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">05 — where it fits</p>
      <h2>what delapan isn't</h2>

      <div className="lp-contrasts">
        {CONTRASTS.map((c) => (
          <div className="lp-contrast" key={c.title}>
            <b>{c.title}</b>
            <span>{c.body}</span>
          </div>
        ))}
      </div>

      <div className="lp-planned">
        <p className="lp-kicker">and what isn't built yet</p>
        {PLANNED.map((p) => (
          <div className="lp-planned-row" key={p}>
            <span className="lp-planned-tag">planned</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write the close and footer**

Create `src/landing/ClosingCta.tsx`:

```tsx
export function ClosingCta() {
  return (
    <section className="lp-inner lp-close">
      <h2>give your agents something they can show their work from</h2>
      <div className="lp-cta-row">
        <a className="lp-cta" href="/login">
          request an invite
        </a>
        <span className="lp-cta-note">free · invite-gated beta</span>
      </div>
    </section>
  );
}
```

Create `src/landing/Footer.tsx`. **No legal links** — `delapan-fe` has no terms or privacy route, and linking at a page that does not exist is the defect this project has already shipped once:

```tsx
export function Footer() {
  return (
    <footer className="lp-footer">
      <span>delapan</span>
      <span>·</span>
      <span>agent memory you can audit</span>
    </footer>
  );
}
```

- [ ] **Step 4: Compose the finished page**

Update `src/landing/LandingApp.tsx` to its final form:

```tsx
/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 */
import { ClosingCta } from "./ClosingCta";
import { Coverage } from "./Coverage";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";
import { WhatItIsnt } from "./WhatItIsnt";
import { WhereItPlugsIn } from "./WhereItPlugsIn";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
      <Problem />
      <Pillars />
      <Coverage />
      <WhereItPlugsIn />
      <WhatItIsnt />
      <ClosingCta />
      <Footer />
    </div>
  );
}
```

- [ ] **Step 5: Verify**

```bash
npm run build && npm run test && npm run dev
```

Expected: build PASS, 82 tests PASS, and the whole page renders end to end.

- [ ] **Step 6: Commit**

```bash
git add src/landing src/styles/landing.css
git commit -m "feat(landing): positioning, the unbuilt roadmap, and the close"
```

---

### Task 6: Full verification

No new code unless a defect is found. This page is entirely public, so — uniquely in this app — every check is available without a session.

- [ ] **Step 1: Route checks**

```bash
npm run dev
```

- `/` → the landing page (NOT the sign-in form)
- `/login` → the sign-in form
- `/kg` → the gated panel's sign-in form
- `/whatever` → same as `/kg` (the fallback still works)

- [ ] **Step 2: Scrolling**

Scroll `/` from hero to footer. `body` is `overflow: hidden` globally, so if the page cannot scroll, `.lp` is missing `height: 100%; overflow: auto`. This exact defect shipped in the console once.

- [ ] **Step 3: Responsive**

Resize to 375px wide. Confirm: the hero headline does not overflow, the pillar and target grids collapse to one column, the verdict rows stay readable, and the whole page still scrolls to the footer.

- [ ] **Step 4: Colour-independence**

In devtools, apply `filter: grayscale(1)` to `<html>`. The three coverage verdicts must remain distinguishable — glyph and name carry them, colour is redundant. If they collapse into each other, the dual-encoding is not doing its job.

- [ ] **Step 5: Calm-technology check**

Load the page and leave it for 30 seconds. Nothing may animate, autoplay, pulse, or move. Then:

```bash
grep -rn "infinite\|animation:" src/styles/landing.css
```

Expected: no output.

- [ ] **Step 6: No invented claims**

Re-read the rendered page against the spec's claims table. Every capability stated as present must be a `shipped` row; the three `planned` items must be visibly tagged. Report any sentence that cannot be traced to a row.

- [ ] **Step 7: Performance**

Confirm the built bundle did not grow unreasonably:

```bash
npm run build
```

Note the reported bundle sizes. The landing page adds markup and CSS only — no new dependency — so any large jump means something was imported that should not have been.

- [ ] **Step 8: Final gate**

```bash
npm run build && npm run test && git status --porcelain
```

Expected: build PASS, 82 tests PASS, working tree clean.

---

## Self-review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 Routing — `landing`, `/login`, signed-in redirect | 1 (resolver), 2 (wiring) |
| §2 Page structure — ten section components | 2, 3, 4, 5 |
| §2 Hero copy, fixed | 2 |
| §2 No legal links in the footer | 5 (stated in the step) |
| §3 Real coverage glyphs, labelled planned items, no autoplay | 4 (glyphs), 5 (planned), 6 (verified) |
| §4 Visual language — tokens, grid, no `--data-*`, `.lp` scrolls | 2 (stylesheet), 6 (scroll check) |
| §5 Verification 1 — resolver branches unit-tested | 1 |
| §5 Verification 2 — build passes | every task |
| §5 Verification 3 — full public browser pass | 6 |
| §5 Verification 4 — performance budget | 6 step 7 |
| §5 Verification 5 — signed-in `/login` redirect | **user-run**, needs a session |

One gap, deliberate and named: the signed-in `/login` redirect is the single check requiring a session, so Task 6 cannot cover it. It is handed to the user.

**Type consistency:** `Surface` gains `"landing"` and `"redirect-home"` in Task 1 and both are consumed in Task 2's `Root` wiring. `<LandingApp/>` is created in Task 2 and extended — never renamed — in Tasks 3–5. Every section component is `export function <Name>()` with no props, matching its use in `LandingApp`. CSS class names are namespaced `lp-` throughout and no class is defined twice.

**Note on the copy:** all prose is fixed in the plan rather than left to the implementer. Marketing copy written ad hoc by a subagent is exactly where invented metrics and overclaims creep in, and this page's entire argument is that it does not do that.
