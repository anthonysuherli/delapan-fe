/**
 * Top-level surface switch. Reads the session once (the root is the only route
 * whose meaning depends on it) and maps the resolved surface to an element.
 *
 * "/" renders the console or the sign-in form directly rather than going
 * through AuthGate, because AuthGate gates a subtree — here the two branches
 * are different pages, not gated/ungated versions of one page.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import App from "./App";
import { AuthGate } from "./auth/AuthGate";
import { useSession } from "./auth/useSession";
import { ConsoleApp } from "./console/ConsoleApp";
import { DuetApp } from "./duet/DuetApp";
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
    return (
      <main className="tracking-state">
        <p className="tracking-error">{message}</p>
      </main>
    );
  }
}

function ConfiguredRoot({ supabase }: { supabase: SupabaseClient }) {
  const session = useSession(supabase);
  const surface = resolveRoute(window.location.pathname, Boolean(session));

  if (surface === "tracking") return <TrackingApp />;
  if (surface === "duet") return <DuetApp />;
  if (surface === "panel") return PANEL;

  // "/" — wait for the session to resolve before choosing, so an already
  // signed-in visitor never sees the sign-in form flash.
  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }
  if (surface === "console" && session) return <ConsoleApp session={session} />;
  return <SignInForm supabase={supabase} title="delapan" subtitle="Sign in to your delapan account." />;
}
