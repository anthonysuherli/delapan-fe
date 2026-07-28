import { describe, expect, it } from "vitest";
import type { Session } from "@supabase/supabase-js";
import type { BetaAccess } from "../auth/betaAccess";
import type { EngineState } from "../api/engineStatus";
import type { EngineFailureKind } from "../api/failure";
import { resolveAppState } from "./appState";

const SESSION = { user: { id: "u1", email: "a@b.com" } } as unknown as Session;

const at = (
  surface: "console" | "panel",
  session: Session | null | undefined,
  access: BetaAccess,
  engine: EngineState,
  hasLoadedData = false,
  bootFailure: EngineFailureKind | null = null,
) => resolveAppState({ surface, session, access, engine, hasLoadedData, bootFailure });

describe("resolveAppState", () => {
  it("waits while the session is still resolving", () => {
    expect(at("console", undefined, "idle", "reachable")).toBe("checking");
    expect(at("panel", undefined, "idle", "unreachable")).toBe("checking");
  });

  it("sends a signed-out visitor to sign-in, even mid-outage — 'no session' outranks liveness", () => {
    expect(at("console", null, "idle", "reachable")).toBe("signin");
    expect(at("panel", null, "idle", "reachable")).toBe("signin");
    // a wrong implementation hoisting the engine check above !session would
    // show engine-down to every anonymous visitor during an outage instead
    expect(at("console", null, "idle", "unreachable")).toBe("signin");
    expect(at("panel", null, "idle", "unreachable")).toBe("signin");
  });

  it("shows engine-down ahead of any access verdict — before any data has loaded", () => {
    expect(at("console", SESSION, "approved", "unreachable")).toBe("engine-down");
    expect(at("panel", SESSION, "approved", "unreachable")).toBe("engine-down");
    // the case that matters most: a waitlisted user must not read as "in" during an outage
    expect(at("console", SESSION, "pending", "unreachable")).toBe("engine-down");
    expect(at("panel", SESSION, "pending", "unreachable")).toBe("engine-down");
    expect(at("console", SESSION, "checking", "unreachable")).toBe("engine-down");
    expect(at("console", SESSION, "idle", "unreachable")).toBe("engine-down");
  });

  it("never claims approved on an unreachable engine — the 2026-07-28 review's finding #4", () => {
    // before this change an outage satisfied the probe and rendered the console
    expect(at("console", SESSION, "error", "unreachable")).toBe("engine-down");
  });

  it("keeps the panel up through an outage once real data has already loaded — this is what makes the mid-session banner reachable", () => {
    expect(at("panel", SESSION, "approved", "unreachable", true)).toBe("panel");
  });

  it("still blocks with engine-down when hasLoadedData is explicitly false, not just absent", () => {
    expect(at("panel", SESSION, "approved", "unreachable", false)).toBe("engine-down");
  });

  it("still honors an explicit pending verdict once data has loaded — access denial isn't something an outage falling through should paper over", () => {
    // unreachable via the real app (access is decided once, before the panel
    // can ever load data), but pins the deliberate precedence choice: the
    // engine branch falling through does not also skip the access checks below it
    expect(at("panel", SESSION, "pending", "unreachable", true)).toBe("pending");
  });

  it("shows the waitlist for a 403", () => {
    expect(at("console", SESSION, "pending", "reachable")).toBe("pending");
    expect(at("panel", SESSION, "pending", "reachable")).toBe("pending");
  });

  it("waits while the console's access probe is in flight, but never stalls the panel", () => {
    expect(at("console", SESSION, "checking", "reachable")).toBe("checking");
    expect(at("console", SESSION, "idle", "reachable")).toBe("checking");
    expect(at("panel", SESSION, "idle", "reachable")).toBe("panel");
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

  // Regression guard. Before this branch, Root ran the beta probe for BOTH the
  // console and the panel and rendered PendingApp on "pending". Removing the
  // panel's duplicate probe left it with no waitlist signal at all, so a
  // waitlisted user opening /kg got boot()'s raw 403 response body on the
  // boot-error screen. boot()'s own failure kind is now that signal.
  it("shows the waitlist when the panel's own boot() was forbidden — it has no probe of its own", () => {
    expect(at("panel", SESSION, "idle", "reachable", false, "forbidden")).toBe("pending");
    expect(at("panel", SESSION, "idle", "reachable", true, "forbidden")).toBe("pending");
  });

  it("does not treat a non-403 boot failure as a waitlist", () => {
    expect(at("panel", SESSION, "idle", "reachable", false, "server")).toBe("panel");
    expect(at("panel", SESSION, "idle", "reachable", false, "parse")).toBe("panel");
    expect(at("panel", SESSION, "idle", "reachable", false, null)).toBe("panel");
  });

  it("still puts an unreachable engine ahead of a forbidden boot — liveness outranks authorization", () => {
    expect(at("panel", SESSION, "idle", "unreachable", false, "forbidden")).toBe("engine-down");
  });
});
