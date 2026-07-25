import { describe, expect, it, vi, beforeEach } from "vitest";

const getSession = vi.fn();
vi.mock("../tracking/supabaseClient", () => ({
  getSupabaseClient: () => ({ auth: { getSession } }),
}));

import { authHeaders, on401SignOut } from "./client";

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
