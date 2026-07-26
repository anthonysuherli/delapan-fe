/**
 * Signed in, but not beta approved — the backend's require_beta answered 403.
 * This exists so that state has somewhere to land: without it a waitlisted
 * user reaches the console and meets raw errors with no explanation.
 */
import type { Session } from "@supabase/supabase-js";
import { Wordmark } from "../panels/Wordmark";
import { getSupabaseClient } from "../tracking/supabaseClient";

export function PendingApp({ session }: { session: Session }) {
  const email = session.user.email ?? null;

  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Wordmark form="display" className="auth-wm" />
        <h1>you're on the list</h1>
        <p className="pending-note">
          your account exists, but delapan is in a closed beta and this address hasn't been let in
          yet. we'll email you when it is — nothing else to do.
        </p>
        {email && <p className="pending-email">{email}</p>}
        <button className="btn" onClick={signOut}>
          sign out
        </button>
      </div>
    </main>
  );
}
