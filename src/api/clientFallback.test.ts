import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../tracking/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }), signOut: vi.fn() } }),
}));
vi.mock("./engineStatus", () => ({ reportUnreachable: vi.fn() }));
vi.mock("../analytics", () => ({ captureError: vi.fn(), captureEvent: vi.fn() }));

import { explore, getProjects } from "./client";
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

  it("does NOT report a 404 as an exception — a deleted finding's citation survives by design", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "not found", text: async () => "x" }),
    );

    await getProjects().catch(() => undefined);

    expect(captureError).not.toHaveBeenCalled();
  });

  it("does NOT report a 503 as an exception — that's the coverage probe's embeddings-unavailable state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "unavailable", text: async () => "x" }),
    );

    await getProjects().catch(() => undefined);

    expect(captureError).not.toHaveBeenCalled();
  });

  it("reports an unreadable body to error tracking — a parse failure is a bug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new SyntaxError("Unexpected token");
        },
      }),
    );

    await getProjects().catch(() => undefined);

    expect(captureError).toHaveBeenCalled();
  });

  it("reports a failing /explore call to error tracking too, not just http() endpoints", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: "err", body: null }),
    );

    await explore("p", "k", { prompt: "x" })
      .next()
      .catch(() => undefined);

    expect(captureError).toHaveBeenCalled();
  });
});
