# Engine-Unreachable Trust Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop delapan.ai from presenting fabricated findings as the user's own knowledge base when the engine is unreachable, and give every failure an honest, named screen.

**Architecture:** `src/api/client.ts` currently catches any `TypeError` and silently swaps a 29-finding fixture in for the live API. We remove that fallback, put the fixture behind a dynamic import so it tree-shakes out of production, classify failures into a small typed union, and drive every screen from one pure `resolveAppState` function. A `/health`-backed `engineStatus` module owns liveness and auto-recovery. PostHog ships first so the newly-visible failures are observable.

**Vision goals served:** "Hosted public tier with account isolation" — specifically *"an authenticated engine API giving the dashboard real (non-mock) data"* — plus its "Stranger round-trip" acceptance criterion and the hardening minimum *"error tracking on backend + frontend."* Implements the already-ratified `backend/docs/truenorth/specs/2026-07-20-public-release-design.md` §G: *"no silent mock, no silent empty."*

**Tech Stack:** React 18, TypeScript (strict), Vite 6, Zustand, vitest (node env), posthog-js.

**Spec:** `docs/truenorth/specs/2026-07-28-engine-unreachable-trust-design.md` (commit `569555c`)

## Global Constraints

- **TypeScript strict**, plus `noUnusedLocals` and `noUnusedParameters` — an unused import or binding **fails the build**. Never leave one behind when deleting code.
- **Tests run in vitest's `node` environment — there is no DOM.** No component rendering tests. Logic that needs testing must live in a pure function outside the component. This is why `resolveAppState` exists.
- **Stylesheet literal scan** (`src/styles/literals.test.ts`) forbids raw hex, `rgba()`, px `border-radius`, and integer `z-index` in the scanned sheets. `layout.css` and `auth.css` are both scanned. Use tokens.
- **Token layer discipline** (`src/styles/tokens.css:6-10`): `--chrome-*` is brand/annunciator, `--data-*` is categorical, `--state-*` is **coverage banding only, never decoration**. The outage banner is an annunciator → `--chrome-*`. Error text → `--red` (signals group), matching `auth.css:53`.
  > **Spec correction:** the spec's §4 says the banner "uses `--state-*` tokens". That contradicts `tokens.css:9`. Use `--chrome-*`. This plan is correct; the spec line is not.
- **`ApiError.status` is a required `number`** (`src/api/types.ts:170-178`). `EngineFailure` extends it, so `unreachable` must pass a numeric status — use **`0`** as the "no HTTP response" sentinel. The spec's `status?` phrasing is shorthand; the type needs `0`.
- **Never hardcode a toggle** — config only (vision invariant).
- **Build gate:** `npm run build` (`tsc --noEmit && vite build`). Run it before claiming a change compiles.
- **Baseline:** 173 tests across 20 files, all passing. Every task must leave that green (plus its own new tests).
- Match surrounding style: terse module docstring with an ASCII flow diagram where it helps, explicit types, no formatter config.

---

# Phase 1 — Observability (ships first)

The spec fixes this order: install the instrument before removing the thing that was hiding the readings.

---

### Task 1: Port the lazy PostHog proxy

**Files:**
- Create: `src/analytics/posthog-lazy.ts`
- Create: `src/analytics/posthog-lazy.test.ts`
- Modify: `package.json` (add `posthog-js` dependency)

**Interfaces:**
- Consumes: nothing (first task).
- Produces: default export `posthogLazy` with `{ init(key: string, config: Partial<PostHogConfig>): void, capture(...), identify(...), reset(...), captureException(...), get_distinct_id(): string | undefined }`. Task 2 imports this as `posthog`.

- [ ] **Step 1: Install the dependency**

```bash
cd /Users/anthonysuherli/Repositories/8star/delapan-ai/frontend
npm install posthog-js@^1.379.1
```

Expected: `package.json` gains `"posthog-js": "^1.379.1"` under `dependencies`. This is the same version `delapan-ai-site` pins.

- [ ] **Step 2: Write the failing test**

Create `src/analytics/posthog-lazy.test.ts`. This is ported from `delapan-ai-site/frontend/lib/posthog-lazy.test.ts` — six tests, unchanged except the import path:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockPosthogInstance = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  captureException: vi.fn(),
  get_distinct_id: vi.fn(() => "real-id"),
};

vi.mock("posthog-js", () => ({ default: mockPosthogInstance }));

/** Runs the idle callback synchronously, so init() flushes on the next microtask tick. */
const syncIdleCallback = ((cb: IdleRequestCallback) => {
  cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline);
  return 0;
}) satisfies typeof requestIdleCallback;

describe("posthog-lazy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    globalThis.requestIdleCallback = syncIdleCallback;
  });

  afterEach(() => {
    (globalThis as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      undefined;
    vi.useRealTimers();
  });

  it("queues capture/identify calls made before init resolves, then flushes them in order", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    posthog.capture("$pageview");
    posthog.identify("user-1", { email: "a@b.com" });
    expect(mockPosthogInstance.capture).not.toHaveBeenCalled();
    expect(mockPosthogInstance.identify).not.toHaveBeenCalled();

    posthog.init("phc_test", { api_host: "https://x" });

    await vi.waitFor(() =>
      expect(mockPosthogInstance.init).toHaveBeenCalledWith("phc_test", { api_host: "https://x" }),
    );
    expect(mockPosthogInstance.capture).toHaveBeenCalledWith("$pageview");
    expect(mockPosthogInstance.identify).toHaveBeenCalledWith("user-1", { email: "a@b.com" });
  });

  it("queues a captureException raised before load and replays it once ready", async () => {
    const { default: posthog } = await import("./posthog-lazy");
    const err = new Error("boom");

    posthog.captureException(err);
    expect(mockPosthogInstance.captureException).not.toHaveBeenCalled();

    posthog.init("phc_test", {});

    await vi.waitFor(() => expect(mockPosthogInstance.captureException).toHaveBeenCalledWith(err));
  });

  it("delegates directly (no queueing) once the real client has loaded", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    posthog.init("phc_test", {});
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalled());

    posthog.capture("clicked");
    posthog.reset();
    expect(mockPosthogInstance.capture).toHaveBeenCalledWith("clicked");
    expect(mockPosthogInstance.reset).toHaveBeenCalled();
  });

  it("is a no-op when the key is empty (dev without VITE_POSTHOG_KEY)", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    posthog.init("", {});
    posthog.capture("$pageview");

    // give any (incorrectly) scheduled work a chance to run, then assert nothing fired
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(mockPosthogInstance.init).not.toHaveBeenCalled();
    expect(mockPosthogInstance.capture).not.toHaveBeenCalled();
  });

  it("falls back to a setTimeout when requestIdleCallback is unavailable (Safari)", async () => {
    (globalThis as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      undefined;
    vi.useFakeTimers();

    const { default: posthog } = await import("./posthog-lazy");
    posthog.init("phc_test", {});
    expect(mockPosthogInstance.init).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(2000);
    expect(mockPosthogInstance.init).toHaveBeenCalledWith("phc_test", {});
  });

  it("get_distinct_id is undefined before load and delegates after", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    expect(posthog.get_distinct_id()).toBeUndefined();

    posthog.init("phc_test", {});
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalled());

    expect(posthog.get_distinct_id()).toBe("real-id");
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npx vitest run src/analytics/posthog-lazy.test.ts
```

Expected: FAIL — `Failed to resolve import "./posthog-lazy"`.

- [ ] **Step 4: Write the implementation**

Create `src/analytics/posthog-lazy.ts`. Ported from the site verbatim; only the docstring changes (the site's referenced Next-specific call sites do not exist here):

```ts
/**
 * Lazy PostHog proxy — keeps posthog-js (186KB raw / 61KB gz) out of the JS the
 * page must download and parse before it is interactive.
 *
 *   call ──▶ real client loaded? ──yes──▶ delegate
 *                              └──no───▶ queue ──(on load)──▶ replay in order
 *                                          └──(load failed)──▶ drop
 *
 * init() defers BOTH the dynamic import and posthog.init() to the browser's next
 * idle window (requestIdleCallback, falling back to a 2s setTimeout on browsers
 * without it, e.g. Safari). Calls made before then — including captureException
 * for errors thrown during that window — are queued and replayed on load.
 *
 * If the chunk fails to load, that queue is dropped and every later call becomes
 * a no-op. Analytics is best-effort: holding calls for a client that is never
 * coming would grow without bound for the life of the session, and the global
 * unhandledrejection handler feeds this same path.
 */
import type { PostHog, PostHogConfig } from "posthog-js";

type QueuedCall =
  | { fn: "capture"; args: Parameters<PostHog["capture"]> }
  | { fn: "identify"; args: Parameters<PostHog["identify"]> }
  | { fn: "reset"; args: Parameters<PostHog["reset"]> }
  | { fn: "captureException"; args: Parameters<PostHog["captureException"]> };

let real: PostHog | null = null;
let queue: QueuedCall[] = [];
let loadFailed = false;

/** Enqueues a call unless the real client failed to load — see init()'s .catch(). */
function enqueue(call: QueuedCall): void {
  if (loadFailed) return;
  queue.push(call);
}

function runWhenIdle(fn: () => void): void {
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(fn);
  } else {
    setTimeout(fn, 2000);
  }
}

function drain(instance: PostHog): void {
  const pending = queue;
  queue = [];
  for (const call of pending) {
    switch (call.fn) {
      case "capture":
        instance.capture(...call.args);
        break;
      case "identify":
        instance.identify(...call.args);
        break;
      case "reset":
        instance.reset(...call.args);
        break;
      case "captureException":
        instance.captureException(...call.args);
        break;
    }
  }
}

/** Schedules the real posthog-js import + init for the next idle window. No-op if `key` is empty. */
function init(key: string, config: Partial<PostHogConfig>): void {
  if (!key) return;
  runWhenIdle(() => {
    import("posthog-js")
      .then(({ default: posthog }) => {
        posthog.init(key, config);
        real = posthog;
        drain(posthog);
      })
      .catch(() => {
        // No reporting channel exists when the analytics client itself failed to
        // load, so there's nowhere to send this — swallow it and stop queueing.
        loadFailed = true;
        queue = [];
      });
  });
}

function capture(...args: Parameters<PostHog["capture"]>): void {
  if (real) {
    real.capture(...args);
    return;
  }
  enqueue({ fn: "capture", args });
}

function identify(...args: Parameters<PostHog["identify"]>): void {
  if (real) {
    real.identify(...args);
    return;
  }
  enqueue({ fn: "identify", args });
}

function reset(...args: Parameters<PostHog["reset"]>): void {
  if (real) {
    real.reset(...args);
    return;
  }
  enqueue({ fn: "reset", args });
}

function captureException(...args: Parameters<PostHog["captureException"]>): void {
  if (real) {
    real.captureException(...args);
    return;
  }
  enqueue({ fn: "captureException", args });
}

/** Only meaningful once the real client has loaded; undefined before then. */
function get_distinct_id(): string | undefined {
  return real?.get_distinct_id();
}

const posthogLazy = { init, capture, identify, reset, captureException, get_distinct_id };

export default posthogLazy;
```

> **Amendment (2026-07-28, after Task 1 review).** The `.catch()` on the dynamic
> import and the `enqueue()` guard above are a deliberate deviation from the
> `delapan-ai-site` source, authorised by the human during Task 1's review. Without
> them a failed chunk load leaves `real` null forever, so every later call
> accumulates in a queue that can never drain — and Task 2's global
> `unhandledrejection` handler routes into that same queue, making the growth
> self-feeding. The source repo still carries this bug; the two files are no longer
> byte-identical, so a future re-sync needs a manual merge on `init()` and the four
> dispatch functions. The reviewer also flagged those four functions as verbatim
> duplication; the human ruled the plan governs and they stay as they are.

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/analytics/posthog-lazy.test.ts
```

Expected: PASS — 6 tests.

- [ ] **Step 6: Verify the whole suite and the build**

```bash
npm test && npm run build
```

Expected: 179 tests passing (173 + 6), `tsc` clean, `vite build` succeeds.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/analytics/posthog-lazy.ts src/analytics/posthog-lazy.test.ts
git commit -m "feat(analytics): port the lazy PostHog proxy from delapan-ai-site"
```

---

### Task 2: Wire PostHog init, global error capture, and the privacy policy

**Files:**
- Create: `src/analytics/index.ts`
- Modify: `src/main.tsx:1-17`
- Modify: `src/site/PrivacyPage.tsx:30-37` (processors paragraph)

**Interfaces:**
- Consumes: `posthogLazy` from Task 1.
- Produces: `initAnalytics(): void`, `captureError(error: unknown, context?: Record<string, unknown>): void`, `captureEvent(name: string, props?: Record<string, unknown>): void`, `POSTHOG_CONFIG: Partial<PostHogConfig>`. Task 5 calls `captureError`; Task 4 calls `captureEvent`.

> **Legal gate.** `VITE_POSTHOG_KEY` must NOT be set in the Vercel production environment until the privacy-policy change in Step 5 is deployed. The page currently omits PostHog from its processor list. This step is what unblocks setting the key.

- [ ] **Step 1: Write the failing test**

Create `src/analytics/index.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach } from "vitest";

const lazy = vi.hoisted(() => ({
  init: vi.fn(),
  capture: vi.fn(),
  captureException: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
  get_distinct_id: vi.fn(),
}));
vi.mock("./posthog-lazy", () => ({ default: lazy }));

import { captureError, captureEvent, POSTHOG_CONFIG } from "./index";

describe("analytics", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is cookieless — the privacy policy's 'no tracking cookies' claim depends on it", () => {
    expect(POSTHOG_CONFIG.persistence).toBe("memory");
  });

  it("forwards an Error to captureException", () => {
    const err = new Error("boom");
    captureError(err);
    expect(lazy.captureException).toHaveBeenCalledWith(err, undefined);
  });

  it("wraps a non-Error thrown value so PostHog always receives an Error", () => {
    captureError("just a string");
    const [received] = lazy.captureException.mock.calls[0];
    expect(received).toBeInstanceOf(Error);
    expect((received as Error).message).toBe("just a string");
  });

  it("forwards events with their properties", () => {
    captureEvent("engine_unreachable", { backend: "cloud" });
    expect(lazy.capture).toHaveBeenCalledWith("engine_unreachable", { backend: "cloud" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/analytics/index.test.ts
```

Expected: FAIL — `Failed to resolve import "./index"`.

- [ ] **Step 3: Write the implementation**

Create `src/analytics/index.ts`:

```ts
/**
 * The one analytics entry point. Three signal types, deliberately separated:
 *
 *   captureError  ──▶ exceptions — real bugs only
 *   captureEvent  ──▶ ops + product (engine_unreachable, signed_up, …)
 *
 * Expected states (unreachable / unauthorized / forbidden) have defined screens
 * and are NOT exceptions — filing them as such buries real bugs.
 *
 * persistence:"memory" is load-bearing, not a preference: PrivacyPage's cookies
 * section states "no tracking or advertising cookies". Do not change it without
 * changing that page.
 */
import type { PostHogConfig } from "posthog-js";
import posthog from "./posthog-lazy";

export const POSTHOG_CONFIG: Partial<PostHogConfig> = {
  api_host: "https://us.i.posthog.com",
  persistence: "memory",
  capture_pageview: false,
  capture_exceptions: false, // we route exceptions explicitly, see captureError
};

export function initAnalytics(): void {
  const key = (import.meta.env as Record<string, string | undefined>).VITE_POSTHOG_KEY ?? "";
  if (!key) return;
  posthog.init(key, POSTHOG_CONFIG);
  posthog.capture("$pageview");

  window.addEventListener("error", (event) => captureError(event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => captureError(event.reason));
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  posthog.captureException(err, context);
}

export function captureEvent(name: string, props?: Record<string, unknown>): void {
  posthog.capture(name, props);
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/analytics/index.test.ts
```

Expected: PASS — 4 tests.

- [ ] **Step 5: Update the privacy policy**

In `src/site/PrivacyPage.tsx`, the `<h2>processors</h2>` paragraph currently ends `…nothing you haven't explicitly submitted through explore leaves the system that way.` Add PostHog to the list. Replace that paragraph's closing sentence so the paragraph reads:

```tsx
          <h2>processors</h2>
          <p>
            a small set of outside services process data on our behalf. Supabase handles the
            database and authentication. Vercel hosts the application. LLM providers reached
            through our AI gateway process the content you explicitly send through explore; the
            search queries that explore issues are sent to the Tavily search API. PostHog
            receives anonymous product-usage and error events so we can tell when something
            breaks — cookieless, and never the content of your findings. nothing you haven't
            explicitly submitted through explore leaves the system that way.
          </p>
```

Leave the `<h2>cookies</h2>` paragraph exactly as it is — `persistence: "memory"` is what keeps its claim true.

- [ ] **Step 6: Wire init into the entry point**

In `src/main.tsx`, add the import and the call. The file becomes:

```tsx
import { createRoot } from "react-dom/client";
import { initAnalytics } from "./analytics";
import { Root } from "./Root";
import "./styles/tokens.css";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/panels.css";
import "./styles/console.css";
import "./styles/landing.css";
import "./styles/canvas.css";
import "./styles/tracking.css";
import "./styles/auth.css";
import "./styles/site.css";
import "./styles/site-shell.css";
import "./styles/site-docs.css";
import "./styles/motion.css";

initAnalytics();

createRoot(document.getElementById("root")!).render(<Root />);
```

- [ ] **Step 7: Verify the suite and the build**

```bash
npm test && npm run build
```

Expected: 183 tests passing, `tsc` clean, build succeeds.

- [ ] **Step 8: Verify PostHog is not in the main chunk**

```bash
grep -c "posthog" dist/assets/index-*.js
ls dist/assets/*.js | wc -l
```

Expected: the main chunk contains only the small proxy (a handful of matches, not the library), and there is now **more than one** JS file in `dist/assets/` — the lazily-imported posthog chunk. If `dist/assets/` still has exactly one file, the dynamic import was not code-split and the proxy is not doing its job.

- [ ] **Step 9: Commit**

```bash
git add src/analytics/index.ts src/analytics/index.test.ts src/main.tsx src/site/PrivacyPage.tsx
git commit -m "feat(analytics): init cookieless PostHog, capture unhandled errors, disclose in privacy policy"
```

---

# Phase 2 — The client seam

---

### Task 3: Classify failures into a typed union

**Files:**
- Create: `src/api/failure.ts`
- Create: `src/api/failure.test.ts`

**Interfaces:**
- Consumes: `ApiError` from `src/api/types.ts`.
- Produces: `type EngineFailureKind = "unreachable" | "unauthorized" | "forbidden" | "server" | "parse"`, `class EngineFailure extends ApiError { readonly kind: EngineFailureKind }`, `function classify(err: unknown, status?: number): EngineFailureKind`. Tasks 4, 5, 6, 9 all consume these.

> `ApiError.status` is a required `number`, so `EngineFailure` for an `unreachable` passes **`0`** — the "no HTTP response" sentinel. `EngineFailure extends ApiError` keeps every existing `instanceof ApiError` check working, including the two in `src/api/authHeaders.test.ts`.

- [ ] **Step 1: Write the failing test**

Create `src/api/failure.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { ApiError } from "./types";
import { classify, EngineFailure } from "./failure";

describe("classify", () => {
  it("maps a fetch TypeError to unreachable", () => {
    expect(classify(new TypeError("Failed to fetch"))).toBe("unreachable");
  });

  it("maps HTTP statuses to their kinds", () => {
    expect(classify(null, 401)).toBe("unauthorized");
    expect(classify(null, 403)).toBe("forbidden");
    expect(classify(null, 500)).toBe("server");
    expect(classify(null, 502)).toBe("server");
    expect(classify(null, 503)).toBe("server");
  });

  it("treats an unmapped 4xx as server rather than guessing", () => {
    expect(classify(null, 418)).toBe("server");
  });

  it("maps a JSON syntax error to parse", () => {
    expect(classify(new SyntaxError("Unexpected token <"))).toBe("parse");
  });

  it("defaults to server for an unknown error with no status", () => {
    expect(classify(new Error("???"))).toBe("server");
  });
});

describe("EngineFailure", () => {
  it("is an ApiError, so existing instanceof checks keep working", () => {
    const failure = new EngineFailure("server", 500, "boom");
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(500);
    expect(failure.kind).toBe("server");
  });

  it("uses status 0 for unreachable — there was no HTTP response", () => {
    const failure = new EngineFailure("unreachable", 0, "network");
    expect(failure.status).toBe(0);
    expect(failure.kind).toBe("unreachable");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/api/failure.test.ts
```

Expected: FAIL — `Failed to resolve import "./failure"`.

- [ ] **Step 3: Write the implementation**

Create `src/api/failure.ts`:

```ts
/**
 * One vocabulary for "the engine did not give us what we asked for".
 *
 *   fetch threw ──▶ unreachable        401 ──▶ unauthorized
 *   bad JSON    ──▶ parse              403 ──▶ forbidden
 *   any status  ──▶ server             (everything else)
 *
 * `unreachable` is the only kind with no HTTP response, so it carries status 0.
 * EngineFailure extends ApiError so every existing `instanceof ApiError` narrow
 * — betaAccess.ts, LeftRail's 503 branch, authHeaders.test.ts — keeps working.
 */
import { ApiError } from "./types";

export type EngineFailureKind =
  | "unreachable"
  | "unauthorized"
  | "forbidden"
  | "server"
  | "parse";

export class EngineFailure extends ApiError {
  readonly kind: EngineFailureKind;

  constructor(kind: EngineFailureKind, status: number, message: string) {
    super(status, message);
    this.name = "EngineFailure";
    this.kind = kind;
  }
}

/** fetch rejects with TypeError on a network-level failure — that, and only that,
 *  means unreachable. A SyntaxError means we got bytes we could not read. */
export function classify(err: unknown, status?: number): EngineFailureKind {
  if (err instanceof TypeError) return "unreachable";
  if (err instanceof SyntaxError) return "parse";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "server";
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/api/failure.test.ts
```

Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/api/failure.ts src/api/failure.test.ts
git commit -m "feat(api): typed EngineFailure and failure classification"
```

---

### Task 4: The engineStatus liveness module

**Files:**
- Create: `src/api/engineStatus.ts`
- Create: `src/api/engineStatus.test.ts`

**Interfaces:**
- Consumes: `captureEvent` from `src/analytics`.
- Produces:
  - `type EngineState = "unknown" | "reachable" | "unreachable"`
  - `getEngineState(): EngineState`
  - `onEngineStateChange(fn: (state: EngineState) => void): () => void`
  - `probeEngine(): Promise<EngineState>` — single `/health` probe, updates state
  - `reportUnreachable(): void` — called by the client when a request throws `unreachable`; triggers a confirming probe
  - `startEngineWatch(): () => void` — attaches `visibilitychange` + `online` listeners, returns a detach fn
  - `BACKOFF_MS: readonly number[]` — `[2000, 4000, 8000, 16000, 30000]`

  Tasks 5, 6 and 7 consume these.

> **`unreachable` is confirmed, never assumed.** One request throwing does not flip the state — it calls `reportUnreachable()`, which probes `/health`. Only the probe decides.

- [ ] **Step 1: Write the failing test**

Create `src/api/engineStatus.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../analytics", () => ({ captureEvent: vi.fn(), captureError: vi.fn() }));

describe("engineStatus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("starts unknown", async () => {
    const { getEngineState } = await import("./engineStatus");
    expect(getEngineState()).toBe("unknown");
  });

  it("a 200 from /health makes it reachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { probeEngine, getEngineState } = await import("./engineStatus");

    await expect(probeEngine()).resolves.toBe("reachable");
    expect(getEngineState()).toBe("reachable");
  });

  it("a thrown fetch makes it unreachable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    const { probeEngine, getEngineState } = await import("./engineStatus");

    await expect(probeEngine()).resolves.toBe("unreachable");
    expect(getEngineState()).toBe("unreachable");
  });

  it("a non-ok /health response is unreachable too — the process is not serving", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    const { probeEngine } = await import("./engineStatus");

    await expect(probeEngine()).resolves.toBe("unreachable");
  });

  it("notifies subscribers only on an actual transition", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { probeEngine, onEngineStateChange } = await import("./engineStatus");
    const seen: string[] = [];
    onEngineStateChange((s) => seen.push(s));

    await probeEngine();
    await probeEngine();

    expect(seen).toEqual(["reachable"]);
  });

  it("unsubscribing stops notifications", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { probeEngine, onEngineStateChange } = await import("./engineStatus");
    const seen: string[] = [];
    const off = onEngineStateChange((s) => seen.push(s));
    off();

    await probeEngine();

    expect(seen).toEqual([]);
  });

  it("reports an engine_unreachable event on the reachable → unreachable transition", async () => {
    const { captureEvent } = await import("../analytics");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    const { probeEngine } = await import("./engineStatus");
    await probeEngine();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    await probeEngine();

    expect(captureEvent).toHaveBeenCalledWith("engine_unreachable", expect.any(Object));
  });

  it("backoff is monotonic and capped at 30s", async () => {
    const { BACKOFF_MS } = await import("./engineStatus");
    expect(BACKOFF_MS[0]).toBe(2000);
    expect(BACKOFF_MS[BACKOFF_MS.length - 1]).toBe(30000);
    for (let i = 1; i < BACKOFF_MS.length; i += 1) {
      expect(BACKOFF_MS[i]).toBeGreaterThan(BACKOFF_MS[i - 1]);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/api/engineStatus.test.ts
```

Expected: FAIL — `Failed to resolve import "./engineStatus"`.

- [ ] **Step 3: Write the implementation**

Create `src/api/engineStatus.ts`:

```ts
/**
 * Engine liveness. The one place that decides whether the engine is up.
 *
 *   request throws ──▶ reportUnreachable() ──▶ probeEngine() ──▶ /health
 *                                                   │
 *   visibilitychange / online ─────────────────────▶┤
 *   backoff timer while unreachable ───────────────▶┘
 *
 * A single failing request never flips the state — it only asks for a probe.
 * /health is unauthenticated and outside the rate limiter, so probing is cheap.
 */
import { captureEvent } from "../analytics";

export type EngineState = "unknown" | "reachable" | "unreachable";

export const BACKOFF_MS = [2000, 4000, 8000, 16000, 30000] as const;

const env = import.meta.env as Record<string, string | undefined>;
const BASE = env.VITE_API_BASE ?? "http://127.0.0.1:8001";

let state: EngineState = "unknown";
let attempts = 0;
let since = 0;
let inFlight: Promise<EngineState> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

const listeners = new Set<(state: EngineState) => void>();

export function getEngineState(): EngineState {
  return state;
}

export function onEngineStateChange(fn: (state: EngineState) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function setState(next: EngineState): void {
  if (state === next) return;
  const previous = state;
  state = next;
  if (next === "unreachable") {
    since = Date.now();
    attempts = 0;
    if (previous === "reachable") {
      captureEvent("engine_unreachable", { base: BASE });
    }
  } else if (next === "reachable" && previous === "unreachable") {
    captureEvent("engine_recovered", { base: BASE, outage_ms: Date.now() - since });
  }
  listeners.forEach((fn) => fn(next));
}

/** One /health probe. Concurrent callers share the in-flight request. */
export function probeEngine(): Promise<EngineState> {
  if (inFlight) return inFlight;
  inFlight = fetch(`${BASE}/health`)
    .then((res) => (res.ok ? "reachable" : "unreachable"))
    .catch(() => "unreachable" as const)
    .then((next: EngineState) => {
      setState(next);
      if (next === "unreachable") scheduleRetry();
      else clearRetry();
      return next;
    })
    .finally(() => {
      inFlight = null;
    });
  return inFlight;
}

/** The client calls this when a request fails at the network level. It asks for a
 *  confirming probe rather than declaring the engine down on one flaky request. */
export function reportUnreachable(): void {
  void probeEngine();
}

function clearRetry(): void {
  if (timer !== undefined) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function scheduleRetry(): void {
  clearRetry();
  const delay = BACKOFF_MS[Math.min(attempts, BACKOFF_MS.length - 1)];
  attempts += 1;
  timer = setTimeout(() => void probeEngine(), delay);
}

/** Attaches the two event triggers that turn a cold start into ~10s of degraded
 *  state instead of a dead-end retry button. Returns a detach function. */
export function startEngineWatch(): () => void {
  const onVisible = () => {
    if (document.visibilityState === "visible" && state === "unreachable") void probeEngine();
  };
  const onOnline = () => {
    if (state === "unreachable") void probeEngine();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", onOnline);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", onOnline);
    clearRetry();
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/api/engineStatus.test.ts
```

Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add src/api/engineStatus.ts src/api/engineStatus.test.ts
git commit -m "feat(api): engineStatus — /health liveness with backoff and recovery"
```

---

### Task 5: Remove the fallback, hide the mock behind a dynamic import, guard the build

**Files:**
- Modify: `src/api/client.ts:1-121` (header, mock import, mode plumbing, `http`, `call`) and `:285-310` (`explore`)
- Modify: `src/state/store.ts` (`mode` → `readOnly`)
- Modify: `src/panels/StatusBar.tsx:8,20-23`
- Modify: `src/panels/ConceptDocReader.tsx:37,59,83-88`
- Modify: `src/styles/layout.css` (`.sb-dot--mock` → `.sb-dot--down`, drop `.sb-mock-badge`)
- Create: `scripts/assert-no-mock.mjs`
- Modify: `package.json` (build script)
- Modify: `vite.config.ts:9-24`

**Interfaces:**
- Consumes: `classify`, `EngineFailure` (Task 3); `reportUnreachable`, `getEngineState`, `onEngineStateChange` (Task 4); `captureError` (Task 2).
- Produces: `client.ts` no longer exports `ApiMode`, `getApiMode`, or `onApiModeChange`. `useStore(s => s.readOnly): boolean` replaces `s.mode`. Every endpoint keeps its signature. Task 8 gates affordances on `readOnly`.

> **Deletion checklist** — `noUnusedLocals` will fail the build if you miss one: in `client.ts`, `mode`, `modeListeners`, `getApiMode`, `onApiModeChange`, `setMode`, `isNetworkError`, `ApiMode`, and the static `import { mockApi } from "./mock"`.
>
> **⚠️ `mode` must die in ONE commit.** Three files outside `client.ts` read it — `store.ts` (5 sites), `StatusBar.tsx`, `ConceptDocReader.tsx`. Deleting the client exports without migrating all three leaves `tsc` broken, so this task's build gate would be unsatisfiable. Steps 7-8 below are not optional cleanup; they are what keeps the task green.

- [ ] **Step 1: Write the failing test**

Create `src/api/clientFallback.test.ts`:

```ts
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../tracking/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }), signOut: vi.fn() } }),
}));
vi.mock("./engineStatus", () => ({ reportUnreachable: vi.fn() }));
vi.mock("../analytics", () => ({ captureError: vi.fn(), captureEvent: vi.fn() }));

import { getProjects } from "./client";
import { EngineFailure } from "./failure";
import { reportUnreachable } from "./engineStatus";
import { captureError } from "../analytics";

describe("client no longer falls back to mock data", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("rejects with an unreachable EngineFailure instead of serving the fixture", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await expect(getProjects()).rejects.toBeInstanceOf(EngineFailure);
    await expect(getProjects()).rejects.toMatchObject({ kind: "unreachable", status: 0 });
  });

  it("asks engineStatus to confirm rather than declaring the engine down itself", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await getProjects().catch(() => undefined);

    expect(reportUnreachable).toHaveBeenCalled();
  });

  it("surfaces a 500 as a server EngineFailure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "err", text: async () => "boom" }),
    );

    await expect(getProjects()).rejects.toMatchObject({ kind: "server", status: 500 });
  });

  it("reports a 500 to error tracking — a server fault is a bug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "err", text: async () => "boom" }),
    );

    await getProjects().catch(() => undefined);

    expect(captureError).toHaveBeenCalled();
  });

  it("does NOT report an unreachable engine as an exception — it is an expected state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    await getProjects().catch(() => undefined);

    expect(captureError).not.toHaveBeenCalled();
  });

  it("does NOT report a 403 as an exception — that is the waitlist, not a fault", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403, statusText: "forbidden", text: async () => "x" }),
    );

    await getProjects().catch(() => undefined);

    expect(captureError).not.toHaveBeenCalled();
  });

  it("does not export the old mock-mode surface", async () => {
    const mod: Record<string, unknown> = await import("./client");
    expect(mod.getApiMode).toBeUndefined();
    expect(mod.onApiModeChange).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/api/clientFallback.test.ts
```

Expected: FAIL — `getProjects()` resolves with the fixture instead of rejecting, and `mod.getApiMode` is defined.

- [ ] **Step 3: Rewrite the client header and mode plumbing**

In `src/api/client.ts`, replace lines 1-32 (the docstring and imports) with:

```ts
/**
 * Single typed client for the delapan engine API.
 *
 *   UI ──▶ client.* ──▶ fetch(VITE_API_BASE) ──ok──▶ typed response
 *                                            └─err─▶ EngineFailure(kind)
 *
 * There is NO automatic fallback to mock data. A network failure raises an
 * `unreachable` EngineFailure and asks engineStatus to confirm via /health; the
 * UI then renders an honest failure state. The fixture is reachable only via
 * VITE_USE_MOCK=1, behind a dynamic import so it is tree-shaken out of any
 * production build (enforced by scripts/assert-no-mock.mjs).
 */

import { getSupabaseClient } from "../tracking/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { captureError } from "../analytics";
import { classify, EngineFailure } from "./failure";
import { reportUnreachable } from "./engineStatus";
import {
  ApiError,
  type ConceptDocResponse,
  type EdgeSpec,
  type ExploreEvent,
  type Finding,
  type FindingsResponse,
  type GraphNode,
  type GraphQuery,
  type GraphResponse,
  type GraphSchema,
  type GraphStats,
  type NodePatch,
  type NodeSpec,
  type ProjectsResponse,
  type ResumeResponse,
  type Synopsis,
} from "./types";
import type { mockApi as MockApi } from "./mock";
```

> `import type { mockApi as MockApi }` is erased at compile time — it gives the mock loader its type without pulling the fixture into the bundle.

- [ ] **Step 4: Replace the mode plumbing with the mock loader**

Replace the block from `export type ApiMode = "live" | "mock";` through the end of `function call(...)` (originally lines 55-111) with:

```ts
const USE_MOCK = env.VITE_USE_MOCK === "1";

/** Resolved once, on first use, and only when the mock flag is on. In a
 *  production build USE_MOCK is statically false, so this import is unreachable
 *  and rollup drops src/api/mock.ts from the output entirely. */
let mockPromise: Promise<typeof MockApi> | null = null;
function loadMock(): Promise<typeof MockApi> {
  if (!mockPromise) mockPromise = import("./mock").then((m) => m.mockApi);
  return mockPromise;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
  } catch (err) {
    reportUnreachable();
    throw new EngineFailure(classify(err), 0, "the engine is not reachable");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.text();
      if (body) detail = body.slice(0, 300);
    } catch {
      /* keep statusText */
    }
    if (res.status === 401) on401SignOut(res.status, getSupabaseClient());
    throw report(new EngineFailure(classify(null, res.status), res.status, detail), path);
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw report(
      new EngineFailure(classify(err), res.status, "the engine returned an unreadable body"),
      path,
    );
  }
}

/** Only `server` and `parse` are bugs. `unreachable`, `unauthorized` and
 *  `forbidden` are expected states with their own screens — filing them as
 *  exceptions would bury the real ones. */
function report(failure: EngineFailure, path: string): EngineFailure {
  if (failure.kind === "server" || failure.kind === "parse") {
    captureError(failure, { path, status: failure.status, kind: failure.kind });
  }
  return failure;
}

/** Mock is an explicit dev mode, never a failure fallback. */
async function call<T>(live: () => Promise<T>, mock: (api: typeof MockApi) => Promise<T>): Promise<T> {
  if (USE_MOCK) return mock(await loadMock());
  return live();
}
```

> `ApiError` is still imported because `on401SignOut` and the exported surface reference it; if `tsc` reports it unused after this edit, remove it from the import list.

- [ ] **Step 5: Update every endpoint's mock arm**

Each `call(...)` now receives the mock api as an argument. Mechanically, change every `() => mockApi.X(...)` to `(m) => m.X(...)`. For example `getProjects` and `getGraph` become:

```ts
export function getProjects(): Promise<ProjectsResponse> {
  return call(() => http("/api/projects"), (m) => m.getProjects());
}

export function getGraph(project: string, kb: string, query: GraphQuery = {}): Promise<GraphResponse> {
  return call(
    () => http(`${kbPath(project, kb)}/graph${qs({ ...query })}`),
    (m) => m.getGraph(project, kb, query),
  );
}
```

Apply the same rewrite to: `getStats`, `getSchema`, `createNodes`, `patchNode`, `deleteNode`, `synthesizeConceptDoc`, `createEdges`, `deleteEdge`, `getFindings`, `getFinding`, `deleteFinding`, `getSynopsis`, `getResume`.

- [ ] **Step 6: Rewrite the explore generator**

Replace `export async function* explore(...)` (originally lines 285-310) with:

```ts
export async function* explore(
  project: string,
  kb: string,
  body: { prompt: string; max_findings?: number },
): AsyncGenerator<ExploreEvent> {
  if (USE_MOCK) {
    const m = await loadMock();
    yield* m.explore(project, kb, body);
    return;
  }
  yield* liveExplore(project, kb, body);
}
```

And in `liveExplore`, wrap the initial fetch the same way `http` does:

```ts
  let res: Response;
  try {
    res = await fetch(`${BASE}${kbPath(project, kb)}/explore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
  } catch (err) {
    reportUnreachable();
    throw new EngineFailure(classify(err), 0, "the engine is not reachable");
  }
  if (!res.ok || !res.body) {
    if (res.status === 401) on401SignOut(res.status, getSupabaseClient());
    throw new EngineFailure(classify(null, res.status), res.status, res.statusText);
  }
```

- [ ] **Step 7: Migrate the store off `mode`, onto `readOnly`**

In `src/state/store.ts`:

Replace `mode: api.ApiMode;` in the `AppState` interface with:

```ts
  readOnly: boolean;
```

Replace the initialiser `mode: api.getApiMode(),` with `readOnly: false,`. Delete `mode: api.getApiMode()` from the `set({ projects, … })` call in `boot()` and from the `set({ … })` call in `loadScope()` — both become plain removals, leaving the surrounding object intact.

Add the import:

```ts
import { getEngineState, onEngineStateChange } from "../api/engineStatus";
```

Replace the trailing `api.onApiModeChange((mode) => { … });` block with:

```ts
// engine liveness → read-only. An unreachable engine cannot accept a mutation,
// so the affordances go away rather than letting an edit apply-then-rollback.
useStore.setState({ readOnly: getEngineState() === "unreachable" });
onEngineStateChange((state) => {
  useStore.setState({ readOnly: state === "unreachable" });
});
```

- [ ] **Step 8: Migrate the two components that read `mode`**

`src/panels/StatusBar.tsx` — replace the `mode` selector and the connection span, and delete the mock badge line entirely:

```tsx
  const readOnly = useStore((s) => s.readOnly);
```

```tsx
      <span className="sb-conn">
        <span className={`sb-dot${readOnly ? " sb-dot--down" : ""}`} />
        {readOnly ? "engine unreachable" : "live api"}
      </span>
```

Delete `{mode === "mock" && <span className="sb-mock-badge">MOCK DATA</span>}`.

`src/panels/ConceptDocReader.tsx` — swap the selector at line 37 for `const readOnly = useStore((s) => s.readOnly);`, then:

```tsx
  const canSynthesize = !readOnly && doc.findings.length > 0 && !synthesizing;
```

```tsx
  const synthDisabledTitle = readOnly
    ? "the engine isn't responding"
    : doc.findings.length === 0
      ? "no grounded findings to synthesize from"
      : "";
```

`src/styles/layout.css` — rename `.sb-dot--mock` to `.sb-dot--down` and delete the `.sb-mock-badge` rule (nothing references it once the badge line is gone).

- [ ] **Step 9: Run both client test files**

```bash
npx vitest run src/api/clientFallback.test.ts src/api/authHeaders.test.ts
```

Expected: PASS — 7 new tests, and all 6 existing `authHeaders` tests still green (`EngineFailure extends ApiError`, so their `instanceof ApiError` assertions hold).

- [ ] **Step 10: Write the build guard**

Create `scripts/assert-no-mock.mjs`:

```js
/**
 * Build gate: the mock fixture must never reach a production bundle.
 * Greps dist/ for a string that exists only in src/api/mock.ts.
 * Structural, not discipline — `npm run build` cannot pass with the mock in it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const NEEDLE = "Findings are the atomic unit of delapan knowledge";
const DIR = "dist/assets";

let offenders = [];
try {
  offenders = readdirSync(DIR)
    .filter((f) => f.endsWith(".js"))
    .filter((f) => readFileSync(join(DIR, f), "utf8").includes(NEEDLE));
} catch (err) {
  console.error(`assert-no-mock: cannot read ${DIR} — did vite build run?`, err.message);
  process.exit(1);
}

if (offenders.length) {
  console.error(
    `assert-no-mock: FAIL — the mock fixture is in the production bundle: ${offenders.join(", ")}\n` +
      "The dynamic import in src/api/client.ts is not being tree-shaken.",
  );
  process.exit(1);
}
console.log("assert-no-mock: ok — no fixture in dist/");
```

- [ ] **Step 11: Wire the guard and the env guard**

In `package.json`, change the build script:

```json
    "build": "tsc --noEmit && vite build && node scripts/assert-no-mock.mjs",
```

In `vite.config.ts`, change the exported config to a function so it can see the mode, and add the production guard. Replace `export default defineConfig({` with:

```ts
export default defineConfig(({ mode }) => {
  if (mode === "production") {
    if (!process.env.VITE_API_BASE) {
      throw new Error(
        "VITE_API_BASE must be set for a production build — the localhost default would ship a bundle pointing at the visitor's own machine.",
      );
    }
    if (process.env.VITE_USE_MOCK === "1") {
      throw new Error("VITE_USE_MOCK=1 must never be set for a production build.");
    }
  }
  return {
```

and close the function at the end of the file by replacing the final `});` with:

```ts
  };
});
```

- [ ] **Step 12: Verify the guards actually fire**

```bash
npm test && npm run build && VITE_API_BASE= npx vite build --mode production
```

Expected: the suite passes; `npm run build` succeeds and prints `assert-no-mock: ok`; the final command **fails** with the `VITE_API_BASE must be set` error. If that last command succeeds, the guard is not wired.

- [ ] **Step 13: Verify the fixture is gone from the bundle**

```bash
grep -c "rag-ecosystem" dist/assets/*.js || echo "GONE — correct"
```

Expected: `GONE — correct`.

- [ ] **Step 14: Commit**

```bash
git add src/api/client.ts src/api/clientFallback.test.ts src/state/store.ts \
        src/panels/StatusBar.tsx src/panels/ConceptDocReader.tsx src/styles/layout.css \
        scripts/assert-no-mock.mjs package.json vite.config.ts
git commit -m "feat(api): remove the silent mock fallback; gate the fixture out of production builds"
```

---

### Task 6: `resolveAppState` — the taxonomy as a pure function

**Files:**
- Create: `src/state/appState.ts`
- Create: `src/state/appState.test.ts`

**Interfaces:**
- Consumes: `EngineState` (Task 4), `BetaAccess` (`src/auth/betaAccess.ts`).
- Produces:
  - `type AppScreen = "checking" | "engine-down" | "signin" | "pending" | "console" | "panel"`
  - `function resolveAppState(input: AppStateInput): AppScreen` where
    `AppStateInput = { surface: "console" | "panel"; session: Session | null | undefined; access: BetaAccess; engine: EngineState }`

  Task 7 consumes `resolveAppState`.

> Precedence, highest first: **session still resolving → `checking`**; **no session → `signin`**; **engine unreachable → `engine-down`** (it outranks the access check, because an unreachable engine cannot have answered the probe truthfully); **access pending → `pending`**; **access checking → `checking`**; otherwise the surface's own screen.

- [ ] **Step 1: Write the failing test**

Create `src/state/appState.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import type { BetaAccess } from "../auth/betaAccess";
import type { EngineState } from "../api/engineStatus";
import { resolveAppState } from "./appState";

const SESSION = { user: { id: "u1", email: "a@b.com" } } as unknown as Session;

const at = (
  surface: "console" | "panel",
  session: Session | null | undefined,
  access: BetaAccess,
  engine: EngineState,
) => resolveAppState({ surface, session, access, engine });

describe("resolveAppState", () => {
  it("waits while the session is still resolving", () => {
    expect(at("console", undefined, "idle", "reachable")).toBe("checking");
    expect(at("panel", undefined, "idle", "unreachable")).toBe("checking");
  });

  it("sends a signed-out visitor to sign-in", () => {
    expect(at("console", null, "idle", "reachable")).toBe("signin");
    expect(at("panel", null, "idle", "reachable")).toBe("signin");
  });

  it("shows engine-down ahead of any access verdict", () => {
    expect(at("console", SESSION, "approved", "unreachable")).toBe("engine-down");
    expect(at("panel", SESSION, "approved", "unreachable")).toBe("engine-down");
  });

  it("never claims approved on an unreachable engine — the 2026-07-28 review's finding #4", () => {
    // before this change an outage satisfied the probe and rendered the console
    expect(at("console", SESSION, "error", "unreachable")).toBe("engine-down");
  });

  it("shows the waitlist for a 403", () => {
    expect(at("console", SESSION, "pending", "reachable")).toBe("pending");
    expect(at("panel", SESSION, "pending", "reachable")).toBe("pending");
  });

  it("waits while the access probe is in flight", () => {
    expect(at("console", SESSION, "checking", "reachable")).toBe("checking");
    expect(at("console", SESSION, "idle", "reachable")).toBe("checking");
  });

  it("lets an approved user through to their surface", () => {
    expect(at("console", SESSION, "approved", "reachable")).toBe("console");
    expect(at("panel", SESSION, "approved", "reachable")).toBe("panel");
  });

  it("falls through to the surface on a probe error — a 500 must not read as waitlisted", () => {
    expect(at("console", SESSION, "error", "reachable")).toBe("console");
    expect(at("panel", SESSION, "error", "reachable")).toBe("panel");
  });

  it("treats an unknown engine as not-yet-a-problem", () => {
    expect(at("console", SESSION, "approved", "unknown")).toBe("console");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/state/appState.test.ts
```

Expected: FAIL — `Failed to resolve import "./appState"`.

- [ ] **Step 3: Write the implementation**

Create `src/state/appState.ts`:

```ts
/**
 * Which screen does this combination of facts deserve?
 *
 * A pure function for the same reason routes.ts is one: the suite runs in a node
 * environment with no DOM, so the decision has to live outside the component to
 * be testable. Root/App are thin maps from AppScreen to element.
 *
 * Precedence — session, then liveness, then authorization. Liveness outranks
 * authorization deliberately: an unreachable engine cannot have answered the
 * access probe truthfully, so "approved" is not a claim we may act on.
 */
import type { Session } from "@supabase/supabase-js";
import type { EngineState } from "../api/engineStatus";
import type { BetaAccess } from "../auth/betaAccess";

export type AppScreen = "checking" | "engine-down" | "signin" | "pending" | "console" | "panel";

export interface AppStateInput {
  surface: "console" | "panel";
  session: Session | null | undefined;
  access: BetaAccess;
  engine: EngineState;
}

export function resolveAppState({ surface, session, access, engine }: AppStateInput): AppScreen {
  if (session === undefined) return "checking";
  if (!session) return "signin";
  if (engine === "unreachable") return "engine-down";
  if (access === "pending") return "pending";
  if (access === "checking" || access === "idle") return "checking";
  // "approved" and "error" both proceed: a probe failure must never accuse an
  // approved user of being waitlisted.
  return surface;
}
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/state/appState.test.ts
```

Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add src/state/appState.ts src/state/appState.test.ts
git commit -m "feat(state): resolveAppState — the failure taxonomy as a tested pure function"
```

---

### Task 7: The EngineDown screen, the outage banner, and Root wiring

**Files:**
- Create: `src/auth/EngineDown.tsx`
- Create: `src/panels/OutageBanner.tsx`
- Modify: `src/Root.tsx:84-149` (`ConfiguredRoot`)
- Modify: `src/App.tsx:68-88` (render the banner)
- Modify: `src/styles/auth.css` (append `.engine-down-*`)
- Modify: `src/styles/layout.css` (append `.outage`)

**Interfaces:**
- Consumes: `resolveAppState`, `AppScreen` (Task 6); `getEngineState`, `onEngineStateChange`, `probeEngine`, `startEngineWatch` (Task 4).
- Produces: `useEngineState(): EngineState` hook (exported from `src/api/engineStatus.tsx`? **No** — put it in `src/auth/useEngineState.ts` to keep the pure module free of React). `EngineDown` and `OutageBanner` components.

- [ ] **Step 1: Write the hook**

Create `src/auth/useEngineState.ts`:

```ts
/** React's view of engineStatus. The status module itself stays React-free so it
 *  can be unit-tested in the node environment. */
import { useEffect, useState } from "react";
import {
  getEngineState,
  onEngineStateChange,
  probeEngine,
  startEngineWatch,
  type EngineState,
} from "../api/engineStatus";

export function useEngineState(): EngineState {
  const [state, setState] = useState<EngineState>(getEngineState);

  useEffect(() => {
    const off = onEngineStateChange(setState);
    const stopWatch = startEngineWatch();
    void probeEngine();
    return () => {
      off();
      stopWatch();
    };
  }, []);

  return state;
}
```

- [ ] **Step 2: Write the EngineDown screen**

Create `src/auth/EngineDown.tsx`:

```tsx
/**
 * The engine is not answering. Says what happened, that it is not the user's
 * fault and nothing of theirs is lost, and offers the one action that helps.
 * Deliberately shows no raw error detail — that goes to PostHog, not the reader.
 */
import { probeEngine } from "../api/engineStatus";
import { Wordmark } from "../panels/Wordmark";
import { getSupabaseClient } from "../tracking/supabaseClient";

export function EngineDown() {
  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Wordmark form="display" className="auth-wm" />
        <h1>the engine isn't responding</h1>
        <p className="engine-down-note">
          this is on our side, not yours — nothing you've saved is affected. we're retrying
          automatically, and this page will come back on its own once the engine answers.
        </p>
        <button className="btn btn--accent" onClick={() => void probeEngine()}>
          retry now
        </button>
        <button className="btn" onClick={signOut}>
          sign out
        </button>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: Write the outage banner**

Create `src/panels/OutageBanner.tsx`:

```tsx
/**
 * Mid-session outage. The graph on screen is the user's real data, truthfully
 * loaded — so we keep it and say edits are paused, rather than replacing it with
 * an error screen that would tell them less than they already have.
 */
import { probeEngine } from "../api/engineStatus";

export function OutageBanner() {
  return (
    <div className="outage" role="status">
      <span className="outage-dot" />
      <span>
        the engine isn't responding — <b>edits are paused</b>. what you see was loaded before the
        connection dropped. retrying automatically.
      </span>
      <button className="btn" onClick={() => void probeEngine()}>
        retry now
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Add the styles**

Append to `src/styles/auth.css`:

```css
.engine-down-note {
  color: var(--text-dim);
  font-size: 13px;
  line-height: 1.55;
}
```

Append to `src/styles/layout.css`:

```css
/* mid-session outage annunciator — chrome, not state: this is an instrument
   warning light, and --state-* is reserved for coverage banding. */
.outage {
  display: flex;
  align-items: center;
  gap: var(--u3);
  padding: var(--u2) var(--u4);
  background: var(--chrome-accent-dim);
  border-bottom: 1px solid var(--chrome-accent);
  color: var(--chrome-accent-deep);
  font-size: 12px;
}

.outage-dot {
  width: var(--u2);
  height: var(--u2);
  border-radius: 50%;
  background: var(--chrome-accent-bright);
  flex: none;
}

.outage .btn {
  margin-left: auto;
}
```

> `border-radius: 50%` is already an allowed literal in `literals.test.ts`'s ALLOW list ("circles are geometry, not scale"). Everything else here resolves through tokens.

- [ ] **Step 5: Wire `ConfiguredRoot`**

In `src/Root.tsx`, replace the body of `ConfiguredRoot` (lines 84-149) with:

```tsx
function ConfiguredRoot({ supabase }: { supabase: SupabaseClient }) {
  const session = useSession(supabase);
  const surface = resolveRoute(window.location.pathname, Boolean(session));
  const engine = useEngineState();
  const isApp = surface === "console" || surface === "panel";
  const access = useBetaAccess(isApp ? session : null);

  if (surface === "tracking") return <TrackingApp />;
  if (surface === "duet") return <DuetApp />;
  if (surface === "redirect-home") return <RedirectHome />;
  if (surface === "signup") {
    return (
      <div className="site">
        <SignUpForm supabase={supabase} />
      </div>
    );
  }
  if (surface === "signin") {
    if (session === undefined) {
      return (
        <div className="site">
          <Interstitial line="checking session…" />
        </div>
      );
    }
    return (
      <div className="site">
        <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />
      </div>
    );
  }
  if (!isApp) return <LandingApp />;

  const screen = resolveAppState({ surface, session, access, engine });
  switch (screen) {
    case "checking":
      return (
        <div className="site">
          <Interstitial line="checking session…" />
        </div>
      );
    case "engine-down":
      return (
        <div className="site">
          <EngineDown />
        </div>
      );
    case "signin":
      return surface === "console" ? (
        <LandingApp />
      ) : (
        <div className="site">
          <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />
        </div>
      );
    case "pending":
      return (
        <div className="site">
          <PendingApp session={session!} />
        </div>
      );
    case "console":
      return <ConsoleApp session={session!} />;
    case "panel":
      return PANEL;
  }
}
```

Add the imports at the top of `Root.tsx`:

```tsx
import { EngineDown } from "./auth/EngineDown";
import { useEngineState } from "./auth/useEngineState";
import { resolveAppState } from "./state/appState";
```

> The `"signin"` case for `console` returns `<LandingApp />` — that preserves today's behaviour where a signed-out visitor at `/` sees the landing page, not a login form.

- [ ] **Step 6: Render the banner in the panel**

In `src/App.tsx`, add the import and render the banner above `TopBar`:

```tsx
import { useEngineState } from "./auth/useEngineState";
import { OutageBanner } from "./panels/OutageBanner";
```

and inside the returned shell:

```tsx
  const engine = useEngineState();

  return (
    <div className="shell">
      {engine === "unreachable" && <OutageBanner />}
      <TopBar />
```

- [ ] **Step 7: Verify the suite and the build**

```bash
npm test && npm run build
```

Expected: all tests pass, `tsc` clean (watch for unused imports from the `ConfiguredRoot` rewrite — `useBetaAccess` and `Interstitial` are still used, but confirm nothing else is orphaned).

- [ ] **Step 8: Commit**

```bash
git add src/auth/EngineDown.tsx src/auth/useEngineState.ts src/panels/OutageBanner.tsx src/Root.tsx src/App.tsx src/styles/auth.css src/styles/layout.css
git commit -m "feat(ui): EngineDown screen and mid-session outage banner"
```

---

### Task 8: Gate the mutation affordances on read-only

**Files:**
- Modify: `src/panels/TopBar.tsx:19-107`
- Modify: `src/panels/StatusBar.tsx:27-44` (undo/redo)
- Modify: `src/panels/Inspector.tsx`

**Interfaces:**
- Consumes: `useStore(s => s.readOnly)` — introduced in Task 5.
- Produces: nothing new. This is the UI half of read-only; Task 5 built the state half.

> **Why this exists:** under the optimistic-mutation architecture an edit during an outage applies to graphology, fails the API call, and rolls back — the user watches their own edit undo itself. Disabling the control is quieter and more honest than letting that happen.
>
> **Scope note:** `StatusBar`'s connection text and `ConceptDocReader`'s synthesize gate were already migrated in Task 5 (they had to be, to keep `tsc` green when `mode` was deleted). This task adds only what remains.

- [ ] **Step 1: Gate the TopBar actions**

In `src/panels/TopBar.tsx`, add the selector alongside the others:

```tsx
  const readOnly = useStore((s) => s.readOnly);
```

Add `disabled={readOnly}` to the `+ node`, `connect`, and `layout` buttons. Leave `travel` enabled — it is read-only navigation and stays useful during an outage. For example:

```tsx
        <button className="btn" onClick={() => setAddNodeOpen(true)} title="Add a node" disabled={readOnly}>
          + node
        </button>
```

- [ ] **Step 2: Disable undo/redo in the StatusBar**

`readOnly` is already selected in this component from Task 5. Add it to both history buttons:

```tsx
          disabled={!canUndo || readOnly}
```
```tsx
          disabled={!canRedo || readOnly}
```

- [ ] **Step 3: Gate the Inspector's edit affordances**

Read `src/panels/Inspector.tsx` first — it has three editing components (`NodeInspector`, `EdgeInspector`, `BulkInspector`) and the exact controls differ between them. In each, add:

```tsx
  const readOnly = useStore((s) => s.readOnly);
```

then add `disabled={readOnly}` to every control that mutates: the label input, the `TypeSelect`, the relation input, the property key/value inputs, the "+ property" and property-delete buttons, the connect button, and the delete buttons. Do **not** disable navigation controls (the endpoint buttons that select another node, the "open concept doc" action) — those are reads.

Verify by grepping for mutation entry points and checking each one is covered:

```bash
grep -n "renameNode\|setNodeType\|setNodeProperties\|replaceEdge\|deleteElements\|bulkSetProperty" src/panels/Inspector.tsx
```

Every call site listed must sit behind a control that is `disabled` when `readOnly`.

- [ ] **Step 4: Verify the suite and build**

```bash
npm test && npm run build
```

Expected: all tests pass; `tsc` clean.

- [ ] **Step 5: Commit**

```bash
git add src/panels/TopBar.tsx src/panels/StatusBar.tsx src/panels/Inspector.tsx
git commit -m "feat(ui): disable mutation affordances while the engine is unreachable"
```

---

### Task 9: Split the beta gate

**Files:**
- Modify: `src/auth/betaAccess.ts:15-23`
- Modify: `src/auth/betaAccess.test.ts` (add cases)
- Modify: `src/auth/useBetaAccess.ts:19-47`

**Interfaces:**
- Consumes: `EngineFailure` (Task 3), `probeEngine` (Task 4).
- Produces: `BetaAccess` gains `"unreachable"`. `resolveAppState` (Task 6) already handles the engine dimension separately, so this change is about not *lying* in the access dimension.

- [ ] **Step 1: Add the failing test cases**

Append to `src/auth/betaAccess.test.ts` inside the existing `describe("classifyProbe", …)`:

```ts
  it("reports an unreachable engine as unreachable, never as approved or waitlisted", () => {
    const failure = new EngineFailure("unreachable", 0, "the engine is not reachable");
    expect(classifyProbe({ ok: false, error: failure })).toBe("unreachable");
  });

  it("still treats a 500 EngineFailure as error, so an approved user is not accused", () => {
    const failure = new EngineFailure("server", 500, "boom");
    expect(classifyProbe({ ok: false, error: failure })).toBe("error");
  });

  it("still treats a 403 EngineFailure as pending", () => {
    const failure = new EngineFailure("forbidden", 403, "beta access required");
    expect(classifyProbe({ ok: false, error: failure })).toBe("pending");
  });
```

and add the import at the top of the file:

```ts
import { EngineFailure } from "../api/failure";
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/auth/betaAccess.test.ts
```

Expected: FAIL — the first new case returns `"error"`, not `"unreachable"`.

- [ ] **Step 3: Update the classifier**

In `src/auth/betaAccess.ts`, extend the type and the function:

```ts
export type BetaAccess = "idle" | "checking" | "approved" | "pending" | "unreachable" | "error";

export function classifyProbe(
  outcome: ProbeOutcome,
): "approved" | "pending" | "unreachable" | "error" {
  if (outcome.ok) return "approved";
  if (outcome.error instanceof EngineFailure && outcome.error.kind === "unreachable") {
    return "unreachable";
  }
  if (outcome.error instanceof ApiError && outcome.error.status === 403) return "pending";
  return "error";
}
```

Add the import:

```ts
import { EngineFailure } from "../api/failure";
```

and extend the module docstring with a line recording the new arm:

```
 * "unreachable" is its own answer: an engine that never responded cannot have
 * told us anything about this user's access, so we must not borrow the leniency
 * that "error" gets.
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npx vitest run src/auth/betaAccess.test.ts
```

Expected: PASS — 10 tests (7 existing + 3 new).

- [ ] **Step 5: Remove the duplicate probe on the panel**

In `src/Root.tsx`, change the access line so only the console probes — the panel already calls `getProjects()` in `App.boot()`:

```tsx
  const access = useBetaAccess(surface === "console" ? session : null);
```

Then in `src/state/appState.ts`, the panel branch must not stall on an `idle` access. Change the precedence block to:

```ts
  if (access === "pending") return "pending";
  // The panel never runs the probe (App.boot's own getProjects is the gate), so
  // an idle/checking access there is not something to wait on.
  if (surface === "console" && (access === "checking" || access === "idle")) return "checking";
```

Update `src/state/appState.test.ts`'s "waits while the access probe is in flight" case to assert the panel goes straight through:

```ts
  it("waits while the console's access probe is in flight, but never stalls the panel", () => {
    expect(at("console", SESSION, "checking", "reachable")).toBe("checking");
    expect(at("console", SESSION, "idle", "reachable")).toBe("checking");
    expect(at("panel", SESSION, "idle", "reachable")).toBe("panel");
  });
```

- [ ] **Step 6: Verify the suite and build**

```bash
npm test && npm run build
```

Expected: all tests pass, `tsc` clean.

- [ ] **Step 7: Commit**

```bash
git add src/auth/betaAccess.ts src/auth/betaAccess.test.ts src/auth/useBetaAccess.ts src/Root.tsx src/state/appState.ts src/state/appState.test.ts
git commit -m "fix(auth): an unreachable engine can no longer read as beta-approved"
```

---

### Task 10: Scope-staleness trio

**Files:**
- Modify: `src/state/store.ts` (`loadScope` catch, `deleteFinding` result handling)
- Modify: `src/panels/FindingDrawer.tsx:21-36`
- Modify: `src/panels/LeftRail.tsx:395`
- Create: `src/state/scopeStaleness.test.ts`

**Interfaces:**
- Consumes: everything already built.
- Produces: `removeFindingFromView(id: string): void` on the store — called by `FindingDrawer`.

> Three instances of the same defect this whole plan exists to remove: the UI asserting something the engine did not confirm. Review findings #6, #5 and #7.

- [ ] **Step 1: Write the failing test**

Create `src/state/scopeStaleness.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getGraph: vi.fn(async () => {
      throw new Error("graph fetch failed");
    }),
    getStats: vi.fn(async () => ({ node_count: 0, edge_count: 0, by_type: {}, by_relation: {} })),
    getSchema: vi.fn(async () => ({ intent: null, emergent: {} })),
    getSynopsis: vi.fn(async () => null),
    getFindings: vi.fn(async () => ({ count: 0, total: 0, findings: [] })),
  };
});

import { graph } from "../graph/graphStore";
import { useStore } from "./store";

function stubLocalStorage(): void {
  const backing = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => backing.set(key, value),
    removeItem: (key: string) => backing.delete(key),
    clear: () => backing.clear(),
  });
}

describe("a failed KB switch does not leave the previous KB on screen", () => {
  beforeEach(() => {
    stubLocalStorage();
    graph.clear();
    graph.addNode("stale", {
      label: "from the OLD kb",
      nodeType: "concept",
      properties: {},
      grounded_in: [],
      created_at: "2026-07-01T00:00:00Z",
      x: 0,
      y: 0,
      size: 4,
      color: "#000000",
    });
    useStore.setState({
      project: "p",
      kb: "old",
      stats: { node_count: 1, edge_count: 0, by_type: {}, by_relation: {} },
      synopsis: null,
      scopeError: null,
    });
  });

  it("clears the graph and the derived panels when the graph fetch rejects", async () => {
    await useStore.getState().setScope("p", "new");

    expect(graph.order).toBe(0);
    expect(useStore.getState().stats).toBeNull();
    expect(useStore.getState().scopeError).toBeTruthy();
  });
});

describe("deleting a finding updates the view immediately", () => {
  beforeEach(() => {
    stubLocalStorage();
    useStore.setState({
      project: "p",
      kb: "k",
      findings: [
        { id: "a", title: "A", category: "x", confidence: 0.9, tags: [], created_at: "2026-07-01T00:00:00Z" },
        { id: "b", title: "B", category: "x", confidence: 0.5, tags: [], created_at: "2026-07-01T00:00:00Z" },
      ],
      findingsTotal: 2,
    });
  });

  it("splices the row out and decrements the total", () => {
    useStore.getState().removeFindingFromView("a");

    expect(useStore.getState().findings?.map((f) => f.id)).toEqual(["b"]);
    expect(useStore.getState().findingsTotal).toBe(1);
  });

  it("is a no-op for an id that is not in the current view", () => {
    useStore.getState().removeFindingFromView("zzz");

    expect(useStore.getState().findings).toHaveLength(2);
    expect(useStore.getState().findingsTotal).toBe(2);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx vitest run src/state/scopeStaleness.test.ts
```

Expected: FAIL — `scopeError` is not a store field, `removeFindingFromView` is not a function, and `graph.order` is still 1.

- [ ] **Step 3: Add `scopeError` and reset the view on a failed load**

In `src/state/store.ts`, add to `AppState`:

```ts
  scopeError: string | null;
  removeFindingFromView(id: string): void;
```

Add `scopeError: null,` to the initial state. In `loadScope`, add `scopeError: null` to the opening `set({ loadingGraph: true, … })` call, and replace the `catch` block with:

```ts
    } catch (err) {
      // A failed switch must not leave the previous KB's graph rendered under the
      // new scope's label — mutations would then target the new KB with old ids.
      graph.clear();
      graphTouched();
      const message = err instanceof Error ? err.message : String(err);
      set({
        stats: null,
        schema: null,
        synopsis: null,
        findings: null,
        findingsTotal: 0,
        scopeError: message,
        lastAction: `failed to load ${project}/${kb}`,
      });
      get().pushToast("error", `failed to load graph: ${message}`);
    } finally {
```

- [ ] **Step 4: Add `removeFindingFromView`**

Add to the store body, next to `loadFindings`:

```ts
  removeFindingFromView(id) {
    const { findings, findingsTotal } = get();
    if (!findings?.some((f) => f.id === id)) return;
    set({
      findings: findings.filter((f) => f.id !== id),
      findingsTotal: Math.max(0, findingsTotal - 1),
    });
  },
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx vitest run src/state/scopeStaleness.test.ts
```

Expected: PASS — 3 tests.

- [ ] **Step 6: Call it from the drawer**

In `src/panels/FindingDrawer.tsx`, add the selector and call it in the success branch of `remove()`:

```tsx
  const removeFindingFromView = useStore((s) => s.removeFindingFromView);
```

```tsx
      await api.deleteFinding(project, kb, openFindingId);
      const cache = { ...useStore.getState().findingCache };
      delete cache[openFindingId];
      useStore.setState({ findingCache: cache, lastAction: `deleted finding ${openFindingId}` });
      removeFindingFromView(openFindingId);
      openFinding(null);
```

- [ ] **Step 7: Guard the post-explore synopsis write**

In `src/panels/LeftRail.tsx`, replace line 395 with a scope-checked version:

```tsx
          api
            .getSynopsis(project, kb)
            .then((synopsis) => {
              // the scope may have moved on while explore ran — a stale synopsis
              // must not land under a different KB's heading
              const s = useStore.getState();
              if (s.project !== project || s.kb !== kb) return;
              useStore.setState({ synopsis });
            })
            .catch(() => undefined);
```

- [ ] **Step 8: Render the scope error on the canvas**

In `src/graph/GraphCanvas.tsx`, add the selector and a branch before the existing `cv-empty` block:

```tsx
  const scopeError = useStore((s) => s.scopeError);
```

```tsx
      {!loadingGraph && scopeError && (
        <div className="cv-empty">
          <p className="cv-empty-title">this KB didn't load</p>
          <p className="cv-empty-line">{scopeError}</p>
          <div className="cv-empty-actions">
            <button className="btn btn--accent" onClick={() => void useStore.getState().loadScope()}>
              retry
            </button>
          </div>
        </div>
      )}
      {!loadingGraph && !scopeError && graph.order === 0 && (
```

(the existing empty-state block keeps its body; only its condition gains `&& !scopeError`)

- [ ] **Step 9: Verify the suite and build**

```bash
npm test && npm run build
```

Expected: all tests pass, `tsc` clean.

- [ ] **Step 10: Commit**

```bash
git add src/state/store.ts src/state/scopeStaleness.test.ts src/panels/FindingDrawer.tsx src/panels/LeftRail.tsx src/graph/GraphCanvas.tsx
git commit -m "fix(state): failed KB switch resets the view; deleted findings leave the table"
```

---

### Task 11: Manual acceptance pass

**Files:** none — this is the spec's acceptance criteria, run by hand.

- [ ] **Step 1: Mock still works in dev**

```bash
VITE_USE_MOCK=1 npm run dev
```

Open http://localhost:5173/kg. Expected: the `delapan/rag-ecosystem` demo KB loads as before. (Criterion 2)

- [ ] **Step 2: No engine, no flag → EngineDown**

Stop any local engine, then `npm run dev` and open `/kg` signed in. Expected: the `EngineDown` screen, never a graph. (Criterion 3)

- [ ] **Step 3: Mid-session outage keeps the graph**

Start the engine, load `/kg`, confirm the graph renders, then kill the engine. Expected within ~2s: the outage banner appears, `+ node` / `connect` / `layout` / undo / redo are disabled, **the graph is still on screen**. (Criterion 4)

- [ ] **Step 4: Recovery is automatic**

With the banner showing, restart the engine. Expected within ~30s (or immediately on tab refocus): the banner clears and the scope reloads with no manual page reload. (Criterion 5)

- [ ] **Step 5: Waitlisted user, engine up → the waitlist**

With the engine **running** and a non-beta account signed in, open `/`. Expected: `PendingApp` ("you're on the list"), not the console and not `EngineDown`. This confirms the gate still works in the ordinary case after Task 9 rewired it. (Criterion 6)

- [ ] **Step 6: Waitlisted user, engine down**

With the engine stopped and a non-beta account signed in, open `/`. Expected: `EngineDown`, **not** a populated console. This is the review's finding #4 and the criterion that was failing before this plan. (Criterion 7)

- [ ] **Step 7: Failed KB switch**

With the engine running, use a KB whose graph endpoint errors (or stop the engine between the projects call and the graph call). Expected: cleared canvas with the "this KB didn't load" message and a retry, **not** the previous KB's graph. (Criterion 8)

- [ ] **Step 8: Deleted finding leaves the table**

In the findings view, delete a finding. Expected: the row disappears and the total decrements immediately. (Criterion 9)

- [ ] **Step 9: PostHog receives the right signals**

With `VITE_POSTHOG_KEY` set locally, throw an error in the console (`window.dispatchEvent(new ErrorEvent("error", { error: new Error("test") }))`) and separately stop the engine. Expected in PostHog: one exception for the thrown error, and an `engine_unreachable` **event** for the outage — the outage must NOT appear as an exception. (Criterion 10)

- [ ] **Step 10: Commit any fixes, then confirm the full gate**

```bash
npm test && npm run build
```

Expected: green suite, `assert-no-mock: ok`, build succeeds.

---

## Post-plan operational steps (not code)

These are the deploy-side actions the spec's rollout depends on. They are not commits.

- [ ] Confirm `VITE_API_BASE` is set in the Vercel production environment (it is, as of 2026-07-28: `https://delapan-api.fly.dev`). The new build guard will now fail the build if it is ever unset.
- [ ] Deploy the privacy-policy change (Task 2) **before** setting `VITE_POSTHOG_KEY` in Vercel production.
- [ ] Set `VITE_POSTHOG_KEY` in Vercel production once the policy is live.
- [ ] Deploy Phase 1 and let it soak before deploying Phase 2 — the spec's rollout order exists so failures are observable before they become visible.
