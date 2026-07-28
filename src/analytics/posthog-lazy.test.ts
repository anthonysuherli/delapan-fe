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

/** Runs the setTimeout callback synchronously, capturing the delay for assertion. */
const syncSetTimeout = ((
  cb: TimerHandler,
  delay?: number,
) => {
  // Store the delay so the test can verify it
  (globalThis as { __lastSetTimeoutDelay?: number }).__lastSetTimeoutDelay = delay ?? 0;
  if (typeof cb === "function") {
    cb();
  }
  return 0;
}) satisfies typeof setTimeout;

describe("posthog-lazy", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    globalThis.requestIdleCallback = syncIdleCallback;
  });

  afterEach(() => {
    (globalThis as { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback =
      undefined;
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
    const originalSetTimeout = globalThis.setTimeout;
    globalThis.setTimeout = syncSetTimeout;

    const { default: posthog } = await import("./posthog-lazy");
    posthog.init("phc_test", {});
    expect(mockPosthogInstance.init).not.toHaveBeenCalled();

    // Verify the delay was correct
    expect((globalThis as { __lastSetTimeoutDelay?: number }).__lastSetTimeoutDelay).toBe(2000);

    // Wait for the microtask promise to settle
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalledWith("phc_test", {}));

    // Restore setTimeout
    globalThis.setTimeout = originalSetTimeout;
  });

  it("get_distinct_id is undefined before load and delegates after", async () => {
    const { default: posthog } = await import("./posthog-lazy");

    expect(posthog.get_distinct_id()).toBeUndefined();

    posthog.init("phc_test", {});
    await vi.waitFor(() => expect(mockPosthogInstance.init).toHaveBeenCalled());

    expect(posthog.get_distinct_id()).toBe("real-id");
  });
});
