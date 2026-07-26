/**
 * The app's single session read. Extracted from AuthGate so the root route can
 * branch on the session *before* deciding what to render — AuthGate gates one
 * subtree, but "/" has to choose between the console and the sign-in form.
 *
 * `undefined` means "still resolving" and is deliberately distinct from `null`
 * ("resolved, signed out"): rendering the signed-out branch during the initial
 * check would flash the sign-in form at every already-signed-in visitor.
 */
import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";

export function useSession(supabase: SupabaseClient): Session | null | undefined {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return session;
}
