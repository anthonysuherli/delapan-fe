/**
 * Path → surface. A pure function so the routing decision is testable without a
 * DOM; main.tsx is then a thin map from surface to element.
 *
 * The unknown-path fallback is the panel, deliberately: "/" is the only path
 * whose meaning changes in this release, so a stale bookmark to anything else
 * still lands on the graph app instead of a blank screen.
 */
export type Surface = "console" | "signin" | "panel" | "tracking" | "duet";

export function resolveRoute(pathname: string, hasSession: boolean): Surface {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return hasSession ? "console" : "signin";
  if (path === "/tracking") return "tracking";
  if (path === "/duet") return "duet";
  return "panel";
}
