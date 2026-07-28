import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import type { BetaAccess } from "../auth/betaAccess";
import type { EngineState } from "../api/engineStatus";
import { resolveAppState } from "./appState";

const SESSION = { user: { id: "u1", email: "a@b.com" } } as unknown as Session;

const at = (
  surface: "console" | "panel",
  session: Session | null | undefined,
  access: BetaAccess,
  engine: EngineState,
) => resolveAppState({ surface, session, access, engine });

describe("resolveAppState", () => {
  it("waits while the session is still resolving", () => {
    expect(at("console", undefined, "idle", "reachable")).toBe("checking");
    expect(at("panel", undefined, "idle", "unreachable")).toBe("checking");
  });

  it("sends a signed-out visitor to sign-in", () => {
    expect(at("console", null, "idle", "reachable")).toBe("signin");
    expect(at("panel", null, "idle", "reachable")).toBe("signin");
  });

  it("shows engine-down ahead of any access verdict", () => {
    expect(at("console", SESSION, "approved", "unreachable")).toBe("engine-down");
    expect(at("panel", SESSION, "approved", "unreachable")).toBe("engine-down");
  });

  it("never claims approved on an unreachable engine — the 2026-07-28 review's finding #4", () => {
    // before this change an outage satisfied the probe and rendered the console
    expect(at("console", SESSION, "error", "unreachable")).toBe("engine-down");
  });

  it("shows the waitlist for a 403", () => {
    expect(at("console", SESSION, "pending", "reachable")).toBe("pending");
    expect(at("panel", SESSION, "pending", "reachable")).toBe("pending");
  });

  it("waits while the access probe is in flight", () => {
    expect(at("console", SESSION, "checking", "reachable")).toBe("checking");
    expect(at("console", SESSION, "idle", "reachable")).toBe("checking");
  });

  it("lets an approved user through to their surface", () => {
    expect(at("console", SESSION, "approved", "reachable")).toBe("console");
    expect(at("panel", SESSION, "approved", "reachable")).toBe("panel");
  });

  it("falls through to the surface on a probe error — a 500 must not read as waitlisted", () => {
    expect(at("console", SESSION, "error", "reachable")).toBe("console");
    expect(at("panel", SESSION, "error", "reachable")).toBe("panel");
  });

  it("treats an unknown engine as not-yet-a-problem", () => {
    expect(at("console", SESSION, "approved", "unknown")).toBe("console");
  });
});
