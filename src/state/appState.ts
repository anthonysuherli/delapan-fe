/**
 * Which screen does this combination of facts deserve?
 *
 * A pure function for the same reason routes.ts is one: the suite runs in a node
 * environment with no DOM, so the decision has to live outside the component to
 * be testable. Root/App are thin maps from AppScreen to element.
 *
 * Precedence — session, then liveness, then authorization. Liveness outranks
 * authorization deliberately: an unreachable engine cannot have answered the
 * access probe truthfully, so "approved" is not a claim we may act on.
 */
import type { Session } from "@supabase/supabase-js";
import type { EngineState } from "../api/engineStatus";
import type { BetaAccess } from "../auth/betaAccess";

export type AppScreen = "checking" | "engine-down" | "signin" | "pending" | "console" | "panel";

export interface AppStateInput {
  surface: "console" | "panel";
  session: Session | null | undefined;
  access: BetaAccess;
  engine: EngineState;
}

export function resolveAppState({ surface, session, access, engine }: AppStateInput): AppScreen {
  if (session === undefined) return "checking";
  if (!session) return "signin";
  if (engine === "unreachable") return "engine-down";
  if (access === "pending") return "pending";
  if (access === "checking" || access === "idle") return "checking";
  // "approved" and "error" both proceed: a probe failure must never accuse an
  // approved user of being waitlisted.
  return surface;
}
