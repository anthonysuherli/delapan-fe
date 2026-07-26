# Design: sign-up path

**Date:** 2026-07-26
**Branch:** `feat/signup-path`, cut from `main`
**Repo:** `delapan-fe` — `8star/delapan-ai/frontend`

**Vision goals served:** *"Hosted public tier with account isolation — self-serve sign-up
(email+password and GitHub OAuth via Supabase Auth), one org per user on the existing
`org_members` + RLS rails … The cloud tier launches as a free, invite-gated beta."* Also advances
the **Stranger round-trip** acceptance criterion: *landing → sign-up → verified email → first-run
empty state*.

---

## ⚠️ Known deviation from a ratified acceptance criterion

The vision states:

> **Hardening minimum live before the sign-up link is public:** ToS + privacy policy, custom SMTP
> for auth email, rate limiting on public endpoints, error tracking on backend + frontend, backups
> verified.

**This spec links sign-up publicly from delapan.ai without those in place.** The user was shown the
criterion, initially chose to build sign-up without linking it, then reversed and directed that it
be linked publicly. Recorded here so the deviation is tracked rather than silently absorbed.

Status of the five items, as far as this repo can tell (2026-07-26):

| Item | Status |
|---|---|
| ToS + privacy policy | **absent** — no `/terms` or `/privacy` route exists in `delapan-fe` |
| Custom SMTP for auth email | unknown — Supabase project config, not visible from this repo |
| Rate limiting on public endpoints | present on the backend (slowapi, per `backend/README.md`) |
| Error tracking, backend + frontend | unknown for the frontend; no Sentry wiring in `src/` |
| Backups verified | unknown — Supabase project concern |

The concrete consequence: the flow collects an email address and a password from members of the
public with no published privacy policy or terms of service. Closing that gap is out of scope for
this spec and should be its own piece of work.

---

## Problem

`SignInForm` calls `signInWithPassword` and nothing else — there is no way to create an account.
Separately, the app assumes *signed in* means *allowed in*, which the backend does not: `require_beta`
(`backend/delapan/api/auth.py:130`) returns **403** to any user without a `beta_members` row. A new
account today would authenticate successfully, reach the console, and hit raw errors.

So sign-up is not one form. It is a form, an email-confirmation branch, and a place for people who
can log in but are not yet approved to use the product.

## Non-goals

- **No GitHub OAuth.** The vision wants it; it needs a configured OAuth app and a callback route,
  and is its own piece of work. Email + password establishes the round-trip first.
- **No ToS or privacy pages.** See the deviation above.
- **No invite-code table.** Approval is a `beta_members` row, which is how the shipped backend gate
  already works. No new backend surface.
- **No password reset.** Absent today, still absent; separate work.
- **No changes to the engine, the `Store` seam, or any backend file.**

---

## 1. Three post-sign-in states

The core of the design. Today there are two states; there must be three.

| State | Detected by | Renders |
|---|---|---|
| signed out | no session | landing (`/`), `/login`, `/signup` |
| signed in, **approved** | `getProjects()` → 200 | console |
| signed in, **waitlisted** | `getProjects()` → **403** | pending screen |

`src/auth/useBetaAccess.ts` exposes:

```ts
useBetaAccess(session: Session | null | undefined): "idle" | "checking" | "approved" | "pending" | "error"
```

It probes `api.getProjects()` exactly once per session and classifies the result.

**Traced, not assumed** (2026-07-26): `GET /api/projects` → `Depends(request_store)`
(`backend/delapan/api/routes_projects.py:28-30`) → `request_store` → `require_beta(user_id)`
(`backend/delapan/api/auth.py:181`) → `HTTPException(403)`. The probe genuinely surfaces the gate;
this is the design's load-bearing assumption, so it was followed through the backend rather than
inferred from the endpoint's name. `idle` covers "no
session yet, nothing to check". The console renders no API-backed data today, so without this probe
the gate would be decorative — a waitlisted user would see a fully populated-looking console and
only discover the truth on `/kg`.

### 403 must not sign the user out

`src/api/client.ts:51` signs out on 401, which is correct: a 401 means the token is bad. **A 403 is
different** — the session is valid, the person simply is not approved. If 403 also signed them out
they would bounce to the login screen, sign in successfully, bounce again, forever, with nothing
explaining why. The existing `on401SignOut` is already narrow (`status === 401`), so this is a
constraint to preserve rather than code to change.

## 2. Routing

`resolveRoute` gains one surface and one path:

| Path | Signed out | Signed in |
|---|---|---|
| `/signup` | **`signup`** (new) | `redirect-home` — already signed in |
| `/login` | `signin` | `redirect-home` (unchanged) |
| `/` | `landing` | `console` **or pending**, decided by the probe |

The signed-in `/signup` redirect reuses the existing `redirect-home` surface and its
`window.location.replace("/")` component — no new mechanism.

## 3. Components

| File | Responsibility |
|---|---|
| `src/auth/SignUpForm.tsx` | email + password, `supabase.auth.signUp`, and the confirmation branch |
| `src/auth/useBetaAccess.ts` | the one-shot probe |
| `src/auth/PendingApp.tsx` | waitlist screen: what happened, which email, and sign out |

`SignUpForm` mirrors `SignInForm`'s structure and styling so the two read as one flow.

### Email confirmation is a real branch, not an edge case

Supabase's behaviour depends on a project setting this repo cannot see:

- **Confirmation ON** — `signUp` resolves with a user but **`session === null`**. The form must
  render "check your email to confirm". Treating this as failure would tell a user who just
  succeeded that something went wrong.
- **Confirmation OFF** — a session arrives immediately, `useBetaAccess` runs, and they land on the
  pending screen.

Both paths are handled; the form branches on whether `data.session` is null.

## 4. Public exposure

Per the user's direction:

- The landing hero CTA and closing CTA point at **`/signup`** (previously `/login`).
- `/login` carries a "no account? sign up" link.
- `/signup` carries a "already have an account? sign in" link.

CTA copy changes from "request an invite" to "create an account", because the flow no longer asks
anyone to request anything — it creates the account and then tells them they are on the waitlist.
Leaving the old label would misdescribe what the button does.

The "free · invite-gated beta" note stays: it is accurate, and it sets the expectation that
sign-up does not mean immediate access.

## 5. Verification

1. **`resolveRoute`'s new branches are unit-tested** — `/signup` signed out is `signup`, signed in
   is `redirect-home`.
2. **`useBetaAccess` classification is unit-tested** against a fake that returns 200, throws
   `ApiError(403)`, and throws `ApiError(500)` — the three outcomes that matter. This is pure logic
   over an injected client, so it runs in the DOM-free Vitest environment.
3. **`npm run build`** passes.
4. **Public browser pass, no session needed** — `/signup` renders, both cross-links work, the
   landing CTAs point at `/signup`.
5. **Signed-out sign-up round-trip** — needs a real email address, so the user runs it: create an
   account, observe either the confirmation prompt or the pending screen, and confirm sign-out
   returns to the landing page.

## Risks

- **A real account gets created against the production Supabase project** the moment this is
  tested. There is no staging auth. Whoever tests should use an address they control and be
  prepared to delete the row.
- **The probe adds one request per console load.** Acceptable: the console currently issues none,
  and without it the gate is not enforced client-side at all.
- **If `getProjects()` fails for an unrelated reason** — network, 500 — the hook returns `error`
  rather than guessing. The console renders with its existing behaviour rather than falsely
  claiming the user is waitlisted.
- **The deviation above.** Public sign-up without ToS or a privacy policy.
