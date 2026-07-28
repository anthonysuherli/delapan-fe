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
 *
 * Liveness itself is gated on hasLoadedData: at boot there is nothing on screen
 * worth preserving, so an unreachable engine blocks. Once real data has loaded,
 * discarding it to report the same failure would take away more than it
 * explains — the surface renders and the outage becomes a banner over it
 * instead (Root/App, not this function, own that banner).
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
  /** Has this session already rendered real engine data? At boot there is
   *  nothing worth preserving, so an unreachable engine is a blocking screen.
   *  Once real data is on screen it is the user's own, truthfully loaded —
   *  replacing it with an error would take away more than it explains, so the
   *  outage becomes a banner over the surface instead. */
  hasLoadedData: boolean;
}

export function resolveAppState({
  surface,
  session,
  access,
  engine,
  hasLoadedData,
}: AppStateInput): AppScreen {
  if (session === undefined) return "checking";
  if (!session) return "signin";
  if (engine === "unreachable" && !hasLoadedData) return "engine-down";
  if (access === "pending") return "pending";
  // The panel never runs the probe (App.boot's own getProjects is the gate), so
  // an idle/checking access there is not something to wait on.
  if (surface === "console" && (access === "checking" || access === "idle")) return "checking";
  // "approved" and "error" both proceed: a probe failure must never accuse an
  // approved user of being waitlisted.
  return surface;
}
