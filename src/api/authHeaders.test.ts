import { describe, expect, it, vi, beforeEach } from "vitest";

const { getSession, signOut, state } = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn().mockResolvedValue({ error: null }),
  state: { throwOnGetClient: false },
}));
vi.mock("../tracking/supabaseClient", () => ({
  getSupabaseClient: () => {
    if (state.throwOnGetClient) {
      throw new Error("Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to use /tracking.");
    }
    return { auth: { getSession, signOut } };
  },
}));

import { authHeaders, on401SignOut, getProjects, explore } from "./client";
import { ApiError } from "./types";

describe("authHeaders", () => {
  beforeEach(() => vi.resetAllMocks());

  it("returns a Bearer header when a session exists", async () => {
    getSession.mockResolvedValue({ data: { session: { access_token: "tok123" } } });
    expect(await authHeaders()).toEqual({ Authorization: "Bearer tok123" });
  });

  it("returns an empty object when there is no session", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    expect(await authHeaders()).toEqual({});
  });

  it("never throws when the client is unconfigured", async () => {
    getSession.mockRejectedValue(new Error("not configured"));
    expect(await authHeaders()).toEqual({});
  });
});

describe("on401SignOut", () => {
  it("calls signOut only for 401", async () => {
    const signOut = vi.fn().mockResolvedValue({ error: null });
    // @ts-expect-error partial client for test
    on401SignOut(401, { auth: { signOut } });
    expect(signOut).toHaveBeenCalledOnce();
    signOut.mockReset();
    // @ts-expect-error partial client for test
    on401SignOut(500, { auth: { signOut } });
    expect(signOut).not.toHaveBeenCalled();
  });
});

describe("http() non-401 errors", () => {
  it("surfaces a non-401 error as ApiError even when Supabase is unconfigured", async () => {
    state.throwOnGetClient = true;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "err",
        text: async () => "boom",
      }),
    );
    try {
      let error: unknown;
      try {
        await getProjects();
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(500);
    } finally {
      state.throwOnGetClient = false;
      vi.unstubAllGlobals();
    }
  });
});

describe("explore() 401", () => {
  it("signs out and rejects with ApiError on a 401 from the explore SSE stream", async () => {
    getSession.mockResolvedValue({ data: { session: null } });
    signOut.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        body: null,
      }),
    );
    try {
      let error: unknown;
      try {
        await explore("p", "k", { prompt: "x" }).next();
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(401);
      expect(signOut).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
