/**
 * Path → surface. A pure function so the routing decision is testable without a
 * DOM; Root.tsx is then a thin map from surface to element.
 *
 * The unknown-path fallback is "not-found", not the panel: now that the public
 * site (docs, terms, privacy, changelog, about) owns everything outside the
 * app surfaces, a stale or mistyped path should land on a branded 404 that
 * links onward — not silently open the graph app to a signed-out stranger.
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
  | "duet"
  | "docs"
  | "terms"
  | "privacy"
  | "changelog"
  | "about"
  | "not-found";

export function resolveRoute(pathname: string, hasSession: boolean): Surface {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/") return hasSession ? "console" : "landing";
  if (path === "/login") return hasSession ? "redirect-home" : "signin";
  if (path === "/signup") return hasSession ? "redirect-home" : "signup";
  if (path === "/tracking") return "tracking";
  if (path === "/duet") return "duet";
  if (path === "/kg") return "panel";
  if (path === "/docs" || path.startsWith("/docs/")) return "docs";
  if (path === "/terms") return "terms";
  if (path === "/privacy") return "privacy";
  if (path === "/changelog") return "changelog";
  if (path === "/about") return "about";
  return "not-found";
}

/**
 * The docs slug is the path segment after `/docs/` — trailing-slash
 * normalized, undefined for `/docs` itself or any non-docs path. DocsPage
 * falls back to "quickstart" when this is undefined.
 */
export function docSlug(pathname: string): string | undefined {
  const path = pathname.replace(/\/$/, "") || "/";
  if (!path.startsWith("/docs/")) return undefined;
  return path.slice("/docs/".length) || undefined;
}
