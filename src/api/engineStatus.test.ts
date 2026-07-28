import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../analytics", () => ({ captureEvent: vi.fn(), captureError: vi.fn() }));

describe("engineStatus", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllTimers();
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

  // startEngineWatch() itself — not the React hook that calls it — is a plain
  // function, so its attach/detach wiring is testable here the same way fetch
  // is stubbed above: fake just enough of document/window (neither exists in
  // this node environment) to observe the listener calls.
  it("startEngineWatch adds visibilitychange + online listeners, stop() removes the same handlers", async () => {
    const docAdd = vi.fn();
    const docRemove = vi.fn();
    const winAdd = vi.fn();
    const winRemove = vi.fn();
    vi.stubGlobal("document", {
      visibilityState: "visible",
      addEventListener: docAdd,
      removeEventListener: docRemove,
    });
    vi.stubGlobal("window", { addEventListener: winAdd, removeEventListener: winRemove });

    const { startEngineWatch } = await import("./engineStatus");
    const stop = startEngineWatch();

    expect(docAdd).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(winAdd).toHaveBeenCalledWith("online", expect.any(Function));

    stop();

    expect(docRemove).toHaveBeenCalledWith("visibilitychange", docAdd.mock.calls[0][1]);
    expect(winRemove).toHaveBeenCalledWith("online", winAdd.mock.calls[0][1]);
  });

  it("stop() does NOT cancel the pending backoff retry — it's module-level liveness, not per-watcher state", async () => {
    vi.stubGlobal("document", { visibilityState: "visible", addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("window", { addEventListener: vi.fn(), removeEventListener: vi.fn() });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { startEngineWatch, probeEngine } = await import("./engineStatus");
    const stop = startEngineWatch();
    await probeEngine(); // unreachable — schedules a retry timer

    expect(vi.getTimerCount()).toBe(1);

    stop();

    // a detaching watcher (e.g. App unmounting because Root swapped to
    // EngineDown) must not cancel the retry that brings the engine back
    // automatically — EngineDown's own "we're retrying automatically" promise
    // depends on this timer surviving
    expect(vi.getTimerCount()).toBe(1);
  });
});
