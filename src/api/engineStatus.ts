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
    // Deliberately does NOT clearRetry() here. The backoff timer is
    // module-level liveness, not per-watcher state — Root.tsx and App.tsx
    // both call startEngineWatch(), and a detaching watcher (e.g. App
    // unmounting because Root swapped to EngineDown) has no business
    // cancelling a retry the other watcher, or the user reading "we're
    // retrying automatically" on EngineDown itself, is relying on. The timer
    // self-manages: scheduleRetry() re-arms it on every failed probe, and
    // probeEngine()'s success path clears it. If a future change removes
    // this comment and adds clearRetry() back, it will silently reintroduce
    // a dead EngineDown screen the instant the first watcher to unmount
    // cancels everyone else's pending retry.
  };
}
