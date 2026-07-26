# Sign-up Path Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a stranger create an account from delapan.ai, and give the ones who aren't beta-approved a screen that explains why they can't get in yet.

**Architecture:** `resolveRoute` gains a `signup` surface. A `useBetaAccess` hook probes `getProjects()` once per session and classifies 200 as approved, 403 as waitlisted; `Root` uses that to choose between the console and a new pending screen. `SignUpForm` mirrors `SignInForm` and branches on whether Supabase returned a session or is waiting on email confirmation.

**Vision goals served:** *"Hosted public tier with account isolation — self-serve sign-up … free, invite-gated beta"*, and the **Stranger round-trip** acceptance criterion.

**Tech Stack:** React 18, TypeScript (strict), Vite 6, `@supabase/supabase-js`, Vitest (node env, no DOM). **No router, no new dependency.**

**Spec:** `docs/truenorth/specs/2026-07-26-signup-path-design.md`

## Global Constraints

- **Working directory is `frontend/`.** Branch `feat/signup-path` — confirm with `git branch --show-current` before every commit.
- **No new dependency.**
- **`npm run build`** (`tsc --noEmit && vite build`) is the gate and is strict: `noUnusedLocals`/`noUnusedParameters` fail on orphans.
- **`npm run test`** baseline before Task 1: **82 passing.** Vitest runs in a **node environment with no DOM** — test pure logic only, never render a component.
- **A 403 must NEVER trigger sign-out.** `src/api/client.ts:51`'s `on401SignOut` is deliberately narrow (`status === 401`). A 403 means a valid session belonging to an unapproved user; signing them out would loop them between login and rejection forever with no explanation. Do not widen that check, and do not add a 403 branch to it.
- **Never hard-code a hex.** Tokens only, from `src/styles/tokens.css`.
- **Copy is lowercase** for UI furniture, matching the app.
- **Do not touch** `src/graph/`, `src/panels/`, `src/state/`, `src/console/`, `src/landing/` (except the two CTA hrefs in Task 5), `src/tracking/SignInForm.tsx` (except the one added link in Task 5), or anything under `backend/`.
- **No backend changes.** Approval is a `beta_members` row, inserted out of band.

---

### Task 1: Route the `/signup` path

**Files:**
- Modify: `src/routes.ts`
- Modify: `src/routes.test.ts`

**Interfaces:**
- Produces, relied on by Task 4: `Surface` gains `"signup"`; `resolveRoute("/signup", false) === "signup"`, `resolveRoute("/signup", true) === "redirect-home"`.

- [ ] **Step 1: Write the failing tests**

Append to `src/routes.test.ts`:

```ts
describe("/signup", () => {
  it("shows the sign-up form to a signed-out visitor", () => {
    expect(resolveRoute("/signup", false)).toBe("signup");
  });

  it("sends an already signed-in visitor home instead", () => {
    expect(resolveRoute("/signup", true)).toBe("redirect-home");
  });

  it("normalises a trailing slash", () => {
    expect(resolveRoute("/signup/", false)).toBe("signup");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test -- src/routes.test.ts
```

Expected: FAIL — `expected 'panel' to be 'signup'` (unknown paths currently fall through to the panel).

- [ ] **Step 3: Add the surface and the path**

In `src/routes.ts`, add `| "signup"` to the `Surface` union, and add this line directly after the `/login` line so the two auth paths sit together:

```ts
  if (path === "/signup") return hasSession ? "redirect-home" : "signup";
```

- [ ] **Step 4: Run to verify it passes**

```bash
npm run test
```

Expected: **85 passing** (82 + 3).

- [ ] **Step 5: Commit**

```bash
git add src/routes.ts src/routes.test.ts
git commit -m "feat(routing): add the /signup path"
```

---

### Task 2: `useBetaAccess` — the approval probe

The load-bearing piece. Written as a pure classifier plus a thin hook, so the classification is testable without a DOM.

**Files:**
- Create: `src/auth/betaAccess.ts`
- Create: `src/auth/betaAccess.test.ts`
- Create: `src/auth/useBetaAccess.ts`

**Interfaces:**
- Consumes: `ApiError` from `@/api/types` (it is exported from `src/api/types.ts:170` with a `status: number` field), `getProjects` from `../api/client`.
- Produces, relied on by Tasks 3 and 4:
  - `type BetaAccess = "idle" | "checking" | "approved" | "pending" | "error"`
  - `classifyProbe(outcome: { ok: true } | { ok: false; error: unknown }): "approved" | "pending" | "error"`
  - `useBetaAccess(session: Session | null | undefined): BetaAccess`

- [ ] **Step 1: Write the failing test**

Create `src/auth/betaAccess.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ApiError } from "../api/types";
import { classifyProbe } from "./betaAccess";

describe("classifyProbe", () => {
  it("treats a successful probe as approved", () => {
    expect(classifyProbe({ ok: true })).toBe("approved");
  });

  it("treats a 403 as waitlisted, not as a failure", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(403, "beta access required") })).toBe("pending");
  });

  it("treats a 500 as an error, not as waitlisted", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(500, "boom") })).toBe("error");
  });

  it("treats a 401 as an error here — the client already handles sign-out", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(401, "unauthorised") })).toBe("error");
  });

  it("treats a network failure as an error, never as waitlisted", () => {
    expect(classifyProbe({ ok: false, error: new TypeError("Failed to fetch") })).toBe("error");
  });

  it("never reports pending for a non-403 status", () => {
    for (const status of [400, 404, 418, 500, 502, 503]) {
      expect(classifyProbe({ ok: false, error: new ApiError(status, "x") })).toBe("error");
    }
  });
});
```

The last two cases matter most: guessing "pending" on any failure would tell a perfectly approved user they are waitlisted every time the network hiccups.

- [ ] **Step 2: Run to verify it fails**

```bash
npm run test -- src/auth/betaAccess.test.ts
```

Expected: FAIL — `Failed to resolve import "./betaAccess"`.

- [ ] **Step 3: Write the classifier**

Create `src/auth/betaAccess.ts`:

```ts
/**
 * Is this signed-in user actually allowed into the product?
 *
 * The backend gates on a beta_members row (require_beta) and answers 403 when
 * it is missing — a VALID session belonging to someone not yet approved. That
 * is a different thing from a bad token, and it must not be treated as one:
 * 403 leads to the waitlist screen, never to a sign-out.
 *
 * Anything else — network failure, 500, 401 — is reported as "error" rather
 * than guessed at. Falsely reporting "pending" would tell an approved user
 * they are waitlisted every time the network hiccups.
 */
import { ApiError } from "../api/types";

export type BetaAccess = "idle" | "checking" | "approved" | "pending" | "error";

export type ProbeOutcome = { ok: true } | { ok: false; error: unknown };

export function classifyProbe(outcome: ProbeOutcome): "approved" | "pending" | "error" {
  if (outcome.ok) return "approved";
  if (outcome.error instanceof ApiError && outcome.error.status === 403) return "pending";
  return "error";
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npm run test -- src/auth/betaAccess.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Write the hook**

Create `src/auth/useBetaAccess.ts`. It is deliberately thin — all the judgement lives in the tested classifier:

```tsx
/**
 * Probes the API once per session to find out whether this user is beta
 * approved. The console renders no API-backed data of its own, so without
 * this probe the beta gate would be decorative on the client: a waitlisted
 * user would see a fully populated-looking console and only discover the
 * truth when they opened the graph.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getProjects } from "../api/client";
import { classifyProbe, type BetaAccess } from "./betaAccess";

export function useBetaAccess(session: Session | null | undefined): BetaAccess {
  const [access, setAccess] = useState<BetaAccess>("idle");
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setAccess("idle");
      return;
    }
    let active = true;
    setAccess("checking");
    void getProjects()
      .then(() => {
        if (active) setAccess(classifyProbe({ ok: true }));
      })
      .catch((error: unknown) => {
        if (active) setAccess(classifyProbe({ ok: false, error }));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return access;
}
```

- [ ] **Step 6: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, **88 passing** (85 + 3... note: 6 new tests were added in this task, so expect **91**). Run the command and record the real number in your report rather than asserting a predicted one.

- [ ] **Step 7: Commit**

```bash
git add src/auth/betaAccess.ts src/auth/betaAccess.test.ts src/auth/useBetaAccess.ts
git commit -m "feat(auth): probe beta access, treating 403 as waitlisted not failed"
```

---

### Task 3: The pending screen

**Files:**
- Create: `src/auth/PendingApp.tsx`
- Modify: `src/styles/tracking.css` (append)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces, relied on by Task 4: `<PendingApp session={Session} />`.

- [ ] **Step 1: Append the styles**

Append to `src/styles/tracking.css`:

```css
/* --- waitlist / pending beta access --------------------------------------- */

.pending-note {
  margin: 0 0 var(--u4);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-dim);
}

.pending-email {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text);
}
```

- [ ] **Step 2: Write the component**

Create `src/auth/PendingApp.tsx`. It reuses the `.tracking-login` shell so it reads as part of the same auth flow:

```tsx
/**
 * Signed in, but not beta approved — the backend's require_beta answered 403.
 * This exists so that state has somewhere to land: without it a waitlisted
 * user reaches the console and meets raw errors with no explanation.
 */
import type { Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "../tracking/supabaseClient";

export function PendingApp({ session }: { session: Session }) {
  const email = session.user.email ?? null;

  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <main className="tracking-login">
      <div className="tracking-login__panel">
        <div className="tracking-wordmark">
          DELAPAN<span>_8</span>
        </div>
        <h1>you're on the list</h1>
        <p className="pending-note">
          your account exists, but delapan is in a closed beta and this address hasn't been let in
          yet. we'll email you when it is — nothing else to do.
        </p>
        {email && <p className="pending-email">{email}</p>}
        <button className="btn" onClick={signOut}>
          sign out
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, test count unchanged from Task 2.

- [ ] **Step 4: Commit**

```bash
git add src/auth/PendingApp.tsx src/styles/tracking.css
git commit -m "feat(auth): waitlist screen for signed-in users without beta access"
```

---

### Task 4: The sign-up form, and wiring both new surfaces

**Files:**
- Create: `src/auth/SignUpForm.tsx`
- Modify: `src/Root.tsx`

**Interfaces:**
- Consumes: `useBetaAccess` (Task 2), `PendingApp` (Task 3), the `signup` surface (Task 1).
- Produces: `<SignUpForm supabase={SupabaseClient} />`.

- [ ] **Step 1: Write the form**

Create `src/auth/SignUpForm.tsx`. It mirrors `src/tracking/SignInForm.tsx`'s structure and classes so the two read as one flow. Note the `autoComplete="new-password"` — the sign-in form uses `current-password`, and getting this wrong makes password managers offer the wrong thing:

```tsx
/**
 * Create an account. Mirrors SignInForm's shape so the two read as one flow.
 *
 * The confirmation branch is not an edge case: when the Supabase project has
 * email confirmation enabled, signUp resolves with a user but NO session.
 * Rendering that as a failure would tell someone who just succeeded that
 * something went wrong, so it gets its own screen.
 */
import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export function SignUpForm({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const signUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
    } else if (!data.session) {
      // confirmation is on — the account exists but is not usable until the
      // emailed link is opened. Not an error.
      setConfirmSent(true);
    }
    // when a session DID arrive, Root re-renders on the auth change and takes
    // it from here; nothing more to do in this component.
    setSubmitting(false);
  };

  if (confirmSent) {
    return (
      <main className="tracking-login">
        <div className="tracking-login__panel">
          <div className="tracking-wordmark">
            DELAPAN<span>_8</span>
          </div>
          <h1>check your email</h1>
          <p className="pending-note">
            we sent a confirmation link to <span className="pending-email">{email}</span>. open it to
            finish creating your account.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="tracking-login">
      <form className="tracking-login__panel" onSubmit={(event) => void signUp(event)}>
        <div className="tracking-wordmark">
          DELAPAN<span>_8</span>
        </div>
        <h1>delapan</h1>
        <p>Create your delapan account.</p>

        <label>
          Email
          <input
            className="inp"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            className="inp"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className="tracking-error">{error}</p>}
        <button className="btn btn--accent" type="submit" disabled={submitting}>
          {submitting ? "creating account…" : "create account"}
        </button>
        <p className="pending-note">
          already have an account? <a href="/login">sign in</a>
        </p>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Wire both surfaces into `Root`**

In `src/Root.tsx`, add these imports beside the existing ones:

```ts
import { PendingApp } from "./auth/PendingApp";
import { SignUpForm } from "./auth/SignUpForm";
import { useBetaAccess } from "./auth/useBetaAccess";
```

Inside `ConfiguredRoot`, add the hook call directly below the existing `const session = useSession(supabase);`:

```ts
  const access = useBetaAccess(session);
```

Then replace the single console line — currently `if (surface === "console" && session) return <ConsoleApp session={session} />;` — with:

```tsx
  if (surface === "signup") {
    return <SignUpForm supabase={supabase} />;
  }
  if (surface === "console" && session) {
    // The gate is only real if the client honours it. "error" deliberately
    // falls through to the console rather than accusing an approved user of
    // being waitlisted because a request failed.
    if (access === "checking" || access === "idle") {
      return (
        <main className="tracking-state">
          <span className="spin" /> checking access…
        </main>
      );
    }
    if (access === "pending") return <PendingApp session={session} />;
    return <ConsoleApp session={session} />;
  }
```

Leave every other branch — `tracking`, `duet`, `panel`, `redirect-home`, the `session === undefined` guard, and the final `SignInForm` fallthrough — exactly as it is.

- [ ] **Step 3: Verify**

```bash
npm run build && npm run test
```

Expected: build PASS, test count unchanged from Task 3.

```bash
npm run dev
```

Open `http://localhost:5173/signup` — the form renders, no session needed. Confirm the "already have an account? sign in" link points at `/login`. **Do not submit the form**: it would create a real account against the production Supabase project. Report what you see.

- [ ] **Step 4: Commit**

```bash
git add src/auth/SignUpForm.tsx src/Root.tsx
git commit -m "feat(auth): sign-up form, and route waitlisted users to the pending screen"
```

---

### Task 5: Point the public CTAs at sign-up

**Files:**
- Modify: `src/landing/Hero.tsx`
- Modify: `src/landing/ClosingCta.tsx`
- Modify: `src/tracking/SignInForm.tsx`

**Interfaces:**
- Consumes: the `/signup` route (Task 1).

- [ ] **Step 1: Repoint the hero CTA**

In `src/landing/Hero.tsx`, the primary CTA currently reads:

```tsx
          <a className="lp-cta" href="/login">
            request an invite
          </a>
```

Change it to:

```tsx
          <a className="lp-cta" href="/signup">
            create an account
          </a>
```

The label changes because the button's behaviour changed: it no longer asks anyone to request anything, it creates the account and then explains the waitlist. Leaving "request an invite" would misdescribe the action. Leave the `sign in` link in the nav pointing at `/login`, and leave the "free · invite-gated beta" note exactly as it is — it is still true and it sets the expectation that an account is not immediate access.

- [ ] **Step 2: Repoint the closing CTA**

In `src/landing/ClosingCta.tsx`, make the identical change: `href="/login"` → `href="/signup"`, and the label `request an invite` → `create an account`.

- [ ] **Step 3: Add the cross-link on sign-in**

In `src/tracking/SignInForm.tsx`, directly after the submit button and before the closing `</form>`, add:

```tsx
        <p className="pending-note">
          no account? <a href="/signup">sign up</a>
        </p>
```

This is the only change to that file. Do not alter its props, its submit handler, or its existing markup.

- [ ] **Step 4: Verify**

```bash
npm run build && npm run test && npm run dev
```

Expected: build PASS, test count unchanged. In the browser: `/` shows "create an account" in both the hero and the closing section, both linking to `/signup`; `/login` shows the "no account? sign up" link; `/signup` shows "already have an account? sign in".

- [ ] **Step 5: Commit**

```bash
git add src/landing/Hero.tsx src/landing/ClosingCta.tsx src/tracking/SignInForm.tsx
git commit -m "feat(landing): point the public CTAs at sign-up"
```

---

### Task 6: Verification

No new code unless a defect is found.

- [ ] **Step 1: Public routes, no session needed**

```bash
npm run dev
```

- `/` → landing, both CTAs read "create an account" and link to `/signup`
- `/signup` → the sign-up form, with a working link to `/login`
- `/login` → the sign-in form, with a working link to `/signup`
- `/kg` → still the gated panel
- `/whatever` → still the panel fallback

- [ ] **Step 2: Every link resolves**

In the browser console on `/`, `/login` and `/signup`:

```js
[...new Set([...document.querySelectorAll("a")].map(a => a.getAttribute("href")))]
```

Every entry must be a path this app serves — `/`, `/login`, `/signup` — or an absolute external URL. A link to a route that does not exist is the specific defect this project has shipped before.

- [ ] **Step 3: Responsive**

Resize to 375px. The sign-up form must not overflow horizontally and its submit button must be reachable.

- [ ] **Step 4: Confirm the 403 rule is intact**

```bash
grep -n "401\|403" src/api/client.ts
```

Expected: `401` appears in `on401SignOut` and its two call sites; **`403` appears nowhere in this file.** If a 403 branch was added to the client, it is a defect — a 403 must reach `useBetaAccess`, not trigger a sign-out.

- [ ] **Step 5: Final gate**

```bash
npm run build && npm run test && git status --porcelain
```

Expected: build PASS, tests PASS, working tree clean.

- [ ] **Step 6: Hand the live round-trip to the user**

The sign-up round-trip creates a **real account against the production Supabase project** and needs a real email address, so it is not run by an implementer. Report to the user that they should: create an account at `/signup`, observe either the "check your email" screen or the pending screen, confirm the pending screen shows their address and its sign-out works, and — after adding a `beta_members` row for that user — confirm they then reach the console.

---

## Self-review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §1 Three post-sign-in states | 2 (probe), 3 (screen), 4 (wiring) |
| §1 403 must not sign the user out | Global Constraints + Task 6 Step 4 (asserted) |
| §2 Routing — `/signup`, signed-in redirect | 1 |
| §3 `SignUpForm`, `useBetaAccess`, `PendingApp` | 4, 2, 3 |
| §3 Email-confirmation branch | 4 (the `!data.session` case) |
| §4 Public exposure — CTAs, cross-links, copy change | 5 |
| §5 Verification 1 — route branches unit-tested | 1 |
| §5 Verification 2 — classification unit-tested | 2 |
| §5 Verification 3 — build passes | every task |
| §5 Verification 4 — public browser pass | 6 |
| §5 Verification 5 — live round-trip, user-run | 6 Step 6 |

No gaps. The spec's non-goals (GitHub OAuth, ToS/privacy, invite-code table, password reset) have no tasks, correctly.

**Type consistency:** `BetaAccess`, `ProbeOutcome` and `classifyProbe` are defined in Task 2 and consumed by `useBetaAccess` in the same task; `useBetaAccess` is consumed in Task 4 under that exact name. `PendingApp` takes `{ session: Session }`, matching its Task 4 call site. `SignUpForm` takes `{ supabase: SupabaseClient }`, matching how `Root` already passes `supabase` to `SignInForm`. The `signup` surface added in Task 1 is the string Task 4 branches on.

**One deliberate imprecision:** Task 2 Step 6 tells the implementer to run the suite and record the real count rather than asserting a predicted one, because the arithmetic across two tasks is easy to get wrong and a wrong expected number wastes a debugging cycle.
