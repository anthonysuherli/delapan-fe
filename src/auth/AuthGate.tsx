import type { SupabaseClient } from "@supabase/supabase-js";
import { SignInForm } from "../tracking/SignInForm";
import { getSupabaseClient } from "../tracking/supabaseClient";
import { useSession } from "./useSession";

interface ConfiguredAuthGateProps {
  supabase: SupabaseClient;
  children: React.ReactNode;
}

function ConfiguredAuthGate({ supabase, children }: ConfiguredAuthGateProps) {
  const session = useSession(supabase);

  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }

  if (!session) {
    return (
      <SignInForm
        supabase={supabase}
        title="delapan"
        subtitle="Sign in to your delapan account."
      />
    );
  }

  return <>{children}</>;
}

/** Session gate around the whole dashboard. No session → login; undefined →
 *  "checking session"; session → children. Mirrors TrackingApp's auth pattern. */
export function AuthGate({ children }: { children: React.ReactNode }) {
  try {
    return <ConfiguredAuthGate supabase={getSupabaseClient()}>{children}</ConfiguredAuthGate>;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Auth is not configured.";
    return (
      <main className="tracking-state">
        <p className="tracking-error">{message}</p>
      </main>
    );
  }
}
