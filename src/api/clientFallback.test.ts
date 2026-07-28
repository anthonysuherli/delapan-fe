import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

vi.mock("../tracking/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getSession: async () => ({ data: { session: null } }), signOut: vi.fn() } }),
}));
vi.mock("./engineStatus", () => ({ reportUnreachable: vi.fn() }));
vi.mock("../analytics", () => ({ captureError: vi.fn(), captureEvent: vi.fn() }));

import { explore, getFinding, getProjects, getResume, patchNode } from "./client";
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

    await expect(getProjects()).rejects.toMatchObject({ kind: "forbidden", status: 403 });
    await getProjects().catch(() => undefined);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("does not export the old mock-mode surface", async () => {
    const mod: Record<string, unknown> = await import("./client");
    expect(mod.getApiMode).toBeUndefined();
    expect(mod.onApiModeChange).toBeUndefined();
  });

  // The 404/503 exclusion is scoped to the specific path it was ruled on, not
  // the status alone — see client.ts's EXPECTED array. These four tests pin
  // both the excluded paths (getFinding, getResume) and their mirrors (a 404
  // on a mutation path, a 503 on a non-resume path), which must still report.

  it("does NOT report a 404 from getFinding as an exception — a deleted finding's citation survives by design", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "not found", text: async () => "x" }),
    );

    await expect(getFinding("p", "k", "f1")).rejects.toMatchObject({ kind: "server", status: 404 });
    await getFinding("p", "k", "f1").catch(() => undefined);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("DOES report a 404 from patchNode — the alias-map gotcha surfacing as a stale id is a real bug", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "not found", text: async () => "x" }),
    );

    await expect(patchNode("p", "k", "n1", {})).rejects.toMatchObject({ kind: "server", status: 404 });
    await patchNode("p", "k", "n1", {}).catch(() => undefined);
    expect(captureError).toHaveBeenCalled();
  });

  it("does NOT report a 503 from getResume as an exception — that's the coverage probe's embeddings-unavailable state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "unavailable", text: async () => "x" }),
    );

    await expect(getResume("p", "k", "query")).rejects.toMatchObject({ kind: "server", status: 503 });
    await getResume("p", "k", "query").catch(() => undefined);
    expect(captureError).not.toHaveBeenCalled();
  });

  it("DOES report a 503 from getProjects — an engine failing every request must not go quiet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503, statusText: "unavailable", text: async () => "x" }),
    );

    await expect(getProjects()).rejects.toMatchObject({ kind: "server", status: 503 });
    await getProjects().catch(() => undefined);
    expect(captureError).toHaveBeenCalled();
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

  it("classifies an ok response with no stream body as parse, not a status-keyed server error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, body: null }));

    await expect(explore("p", "k", { prompt: "x" }).next()).rejects.toMatchObject({
      kind: "parse",
      status: 200,
    });
  });

  it("reports the ok-but-no-body explore case to error tracking too — it's a parse failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200, body: null }));

    await explore("p", "k", { prompt: "x" })
      .next()
      .catch(() => undefined);

    expect(captureError).toHaveBeenCalled();
  });
});
