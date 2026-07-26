/**
 * Path → surface. A pure function so the routing decision is testable without a
 * DOM; Root.tsx is then a thin map from surface to element.
 *
 * The unknown-path fallback is the panel, deliberately: a stale bookmark still
 * lands on the graph app instead of a blank screen.
 *
 * "redirect-home" exists so the "already signed in, don't show them a login
 * form" rule is a tested branch rather than a side effect buried in a component.
 */
export type Surface =
  | "landing"
  | "signin"
  | "signup"
  | "redirect-home"
  | "console"
  | "panel"
  | "tracking"
  | "duet";

export function resolveRoute(pathname: string, hasSession: boolean): Surface {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return hasSession ? "console" : "landing";
  if (path === "/login") return hasSession ? "redirect-home" : "signin";
  if (path === "/signup") return hasSession ? "redirect-home" : "signup";
  if (path === "/tracking") return "tracking";
  if (path === "/duet") return "duet";
  return "panel";
}
