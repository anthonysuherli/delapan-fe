/**
 * Top-level surface switch. Reads the session once (the root is the only route
 * whose meaning depends on it) and maps the resolved surface to an element.
 *
 * "/" renders the console or the sign-in form directly rather than going
 * through AuthGate, because AuthGate gates a subtree — here the two branches
 * are different pages, not gated/ungated versions of one page.
 */
import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import App from "./App";
import { AuthGate } from "./auth/AuthGate";
import { EngineDown } from "./auth/EngineDown";
import { Interstitial } from "./auth/Interstitial";
import { PendingApp } from "./auth/PendingApp";
import { SignUpForm } from "./auth/SignUpForm";
import { useBetaAccess } from "./auth/useBetaAccess";
import { useEngineState } from "./auth/useEngineState";
import { useSession } from "./auth/useSession";
import { ConsoleApp } from "./console/ConsoleApp";
import { DuetApp } from "./duet/DuetApp";
import { LandingApp } from "./landing/LandingApp";
import { docSlug, resolveRoute } from "./routes";
import { AboutPage } from "./site/AboutPage";
import { ChangelogPage } from "./site/ChangelogPage";
import { DocsPage } from "./site/DocsPage";
import { NotFound } from "./site/NotFound";
import { PrivacyPage } from "./site/PrivacyPage";
import { TermsPage } from "./site/TermsPage";
import { resolveAppState } from "./state/appState";
import { useStore } from "./state/store";
import { SignInForm } from "./tracking/SignInForm";
import { getSupabaseClient } from "./tracking/supabaseClient";
import { TrackingApp } from "./tracking/TrackingApp";

/**
 * Built once, at module scope. ConfiguredRoot re-renders on every auth event —
 * and supabase-js fires SIGNED_IN on tab refocus — so constructing this inside
 * the render body would mint a new <App/> each time and destroy React's
 * reference-equality bailout, re-rendering the whole graph panel on every
 * alt-tab. main.tsx built it at module scope before this branch; keep that.
 */
const PANEL = (
  <AuthGate>
    <App />
  </AuthGate>
);

export function Root() {
  const pathname = window.location.pathname;
  const surface = resolveRoute(pathname, false);

  // The six public site surfaces are session-invariant — resolveRoute
  // returns the same surface for them regardless of the session argument
  // (pinned in routes.test.ts) — so they render before getSupabaseClient()
  // is even constructed. A signed-out docs reader (or 404 visitor) must not
  // be stuck behind — or crashed into an Interstitial by — a Supabase
  // client that has nothing to do with what they're looking at.
  if (surface === "docs") return <DocsPage slug={docSlug(pathname)} />;
  if (surface === "terms") return <TermsPage />;
  if (surface === "privacy") return <PrivacyPage />;
  if (surface === "changelog") return <ChangelogPage />;
  if (surface === "about") return <AboutPage />;
  if (surface === "not-found") return <NotFound />;

  // Mirrors AuthGate's own guard: getSupabaseClient() throws when the env vars
  // are absent, and that must render a message rather than a white screen.
  try {
    return <ConfiguredRoot supabase={getSupabaseClient()} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth is not configured.";
    return <Interstitial error={message} />;
  }
}

/** Already signed in and asking for /login — send them home. */
function RedirectHome() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return (
    <div className="site">
      <Interstitial line="taking you home…" />
    </div>
  );
}

function ConfiguredRoot({ supabase }: { supabase: SupabaseClient }) {
  const session = useSession(supabase);
  const surface = resolveRoute(window.location.pathname, Boolean(session));
  const engine = useEngineState();
  const isApp = surface === "console" || surface === "panel";
  const access = useBetaAccess(isApp ? session : null);
  // Only the panel ever renders engine data worth preserving through an
  // outage; the console has none, so it never claims hasLoadedData. The hook
  // itself is always called (Rules of Hooks) — only its result is gated.
  const storeHasLoadedData = useStore((s) => s.hasLoadedData);
  const hasLoadedData = surface === "panel" && storeHasLoadedData;

  if (surface === "tracking") return <TrackingApp />;
  if (surface === "duet") return <DuetApp />;
  if (surface === "redirect-home") return <RedirectHome />;
  if (surface === "signup") {
    return (
      <div className="site">
        <SignUpForm supabase={supabase} />
      </div>
    );
  }
  if (surface === "signin") {
    if (session === undefined) {
      return (
        <div className="site">
          <Interstitial line="checking session…" />
        </div>
      );
    }
    return (
      <div className="site">
        <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />
      </div>
    );
  }
  if (!isApp) return <LandingApp />;

  const screen = resolveAppState({ surface, session, access, engine, hasLoadedData });
  switch (screen) {
    case "checking":
      return (
        <div className="site">
          <Interstitial line="checking session…" />
        </div>
      );
    case "engine-down":
      return (
        <div className="site">
          <EngineDown />
        </div>
      );
    case "signin":
      return surface === "console" ? (
        <LandingApp />
      ) : (
        <div className="site">
          <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />
        </div>
      );
    case "pending":
      return (
        <div className="site">
          <PendingApp session={session!} />
        </div>
      );
    case "console":
      return <ConsoleApp session={session!} />;
    case "panel":
      return PANEL;
  }
}
