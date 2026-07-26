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
import { Interstitial } from "./auth/Interstitial";
import { PendingApp } from "./auth/PendingApp";
import { SignUpForm } from "./auth/SignUpForm";
import { useBetaAccess } from "./auth/useBetaAccess";
import { useSession } from "./auth/useSession";
import { ConsoleApp } from "./console/ConsoleApp";
import { DuetApp } from "./duet/DuetApp";
import { LandingApp } from "./landing/LandingApp";
import { resolveRoute } from "./routes";
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
  const access = useBetaAccess(surface === "console" || surface === "panel" ? session : null);

  if (surface === "tracking") return <TrackingApp />;
  if (surface === "duet") return <DuetApp />;

  // These four depend on the session, so wait for it to resolve. Rendering
  // early would flash the landing page at an already-signed-in visitor.
  if (session === undefined) {
    return (
      <div className="site">
        <Interstitial line="checking session…" />
      </div>
    );
  }
  if (surface === "panel") {
    if (access === "pending") {
      return (
        <div className="site">
          <PendingApp session={session!} />
        </div>
      );
    }
    return PANEL;
  }
  if (surface === "redirect-home") return <RedirectHome />;
  if (surface === "signup") {
    return (
      <div className="site">
        <SignUpForm supabase={supabase} />
      </div>
    );
  }
  if (surface === "console" && session) {
    // The gate is only real if the client honours it. "error" deliberately
    // falls through to the console rather than accusing an approved user of
    // being waitlisted because a request failed.
    if (access === "checking" || access === "idle") {
      return (
        <div className="site">
          <Interstitial line="checking access…" />
        </div>
      );
    }
    if (access === "pending") {
      return (
        <div className="site">
          <PendingApp session={session} />
        </div>
      );
    }
    return <ConsoleApp session={session} />;
  }
  if (surface === "signin") {
    return (
      <div className="site">
        <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />
      </div>
    );
  }
  return <LandingApp />;
}
