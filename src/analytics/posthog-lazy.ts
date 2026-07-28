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
