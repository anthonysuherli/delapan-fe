import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// This project has no @types/node (tsconfig `types` is scoped to `["vite/client"]`
// for the browser build), but vitest itself runs on Node (`environment: "node"`
// in vite.config.ts), so the real `process` global is present at runtime. Declare
// just enough of it to register the `unhandledRejection` listener used below.
declare const process: {
  on(event: "unhandledRejection", listener: (reason: unknown) => void): void;
  off(event: "unhandledRejection", listener: (reason: unknown) => void): void;
};

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

/** Captures the delay passed to the setTimeout stub below, for assertion. */
let lastSetTimeoutDelay: number | undefined;

/** Runs the setTimeout callback synchronously, capturing the delay for assertion. */
const syncSetTimeout = ((
  cb: TimerHandler,
  delay?: number,
) => {
  lastSetTimeoutDelay = delay ?? 0;
  if (typeof cb === "function") {
    cb();
  }
  return 0;
}) satisfies typeof setTimeout;

describe("posthog-lazy", () => {
  const originalSetTimeout = globalThis.setTimeout;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    globalThis.requestIdleCallback = syncIdleCallback;
    lastSetTimeoutDelay = undefined;
  });

  afterEach(() => {
    (globalThis as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      undefined;
    globalThis.setTimeout = originalSetTimeout;
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
    globalThis.setTimeout = syncSetTimeout;

    const { default: posthog } = await import("./posthog-lazy");
    posthog.init("phc_test", {});
    expect(mockPosthogInstance.init).not.toHaveBeenCalled();

    // Verify the delay was correct
    expect(lastSetTimeoutDelay).toBe(2000);

    // Wait for the microtask promise to settle
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalledWith("phc_test", {}));
  });

  it("get_distinct_id is undefined before load and delegates after", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    expect(posthog.get_distinct_id()).toBeUndefined();

    posthog.init("phc_test", {});
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalled());

    expect(posthog.get_distinct_id()).toBe("real-id");
  });

  it("stops queueing after a failed dynamic import, without an unhandled rejection", async () => {
    const onUnhandledRejection = vi.fn();
    process.on("unhandledRejection", onUnhandledRejection);

    try {
      vi.doMock("posthog-js", async () => {
        throw new Error("chunk load failed");
      });

      const { default: posthog } = await import("./posthog-lazy");

      posthog.init("phc_test", {});
      // Let the rejected dynamic import's .catch() run to completion.
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Calls made after the failed load must not accumulate in the (now
      // permanently unreachable) queue instead of being dropped.
      posthog.capture("during-failure");
      posthog.identify("user-during-failure", { plan: "free" });

      expect(onUnhandledRejection).not.toHaveBeenCalled();

      // Swap in a working posthog-js and force re-resolution of the dynamic
      // import. `posthog` is still the same module instance/closure — its
      // `real`/`queue`/`loadFailed` state carries over — but resetting the
      // module registry clears the cached (failed) posthog-js resolution so
      // the next `import("posthog-js")` picks up the new factory below.
      vi.doMock("posthog-js", () => ({ default: mockPosthogInstance }));
      vi.resetModules();

      posthog.init("phc_test2", { api_host: "https://y" });
      await vi.waitFor(() =>
        expect(mockPosthogInstance.init).toHaveBeenCalledWith("phc_test2", {
          api_host: "https://y",
        }),
      );

      // The calls made during the failed window were dropped, not queued —
      // they must not replay now that a real client is available.
      expect(mockPosthogInstance.capture).not.toHaveBeenCalled();
      expect(mockPosthogInstance.identify).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", onUnhandledRejection);
    }
  });
});
