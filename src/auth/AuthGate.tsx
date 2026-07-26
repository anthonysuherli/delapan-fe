import type { SupabaseClient } from "@supabase/supabase-js";
import { SignInForm } from "../tracking/SignInForm";
import { getSupabaseClient } from "../tracking/supabaseClient";
import { Interstitial } from "./Interstitial";
import { useSession } from "./useSession";

interface ConfiguredAuthGateProps {
  supabase: SupabaseClient;
  children: React.ReactNode;
}

function ConfiguredAuthGate({ supabase, children }: ConfiguredAuthGateProps) {
  const session = useSession(supabase);

  if (session === undefined) {
    return <Interstitial line="checking session…" />;
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
    return <Interstitial error={message} />;
  }
}
