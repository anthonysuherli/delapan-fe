/**
 * The engine is not answering. Says what happened, that it is not the user's
 * fault and nothing of theirs is lost, and offers the one action that helps.
 * Deliberately shows no raw error detail — that goes to PostHog, not the reader.
 */
import { probeEngine } from "../api/engineStatus";
import { Wordmark } from "../panels/Wordmark";
import { getSupabaseClient } from "../tracking/supabaseClient";

export function EngineDown() {
  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <main className="auth-wrap">
      <div className="auth-card">
        <Wordmark form="display" className="auth-wm" />
        <h1>the engine isn't responding</h1>
        <p className="engine-down-note">
          this is on our side, not yours — nothing you've saved is affected. we're retrying
          automatically, and this page will come back on its own once the engine answers.
        </p>
        <button className="btn btn--accent" onClick={() => void probeEngine()}>
          retry now
        </button>
        <button className="btn" onClick={signOut}>
          sign out
        </button>
      </div>
    </main>
  );
}
