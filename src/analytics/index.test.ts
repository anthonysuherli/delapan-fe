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
