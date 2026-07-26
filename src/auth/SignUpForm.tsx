/**
 * Create an account. Mirrors SignInForm's shape so the two read as one flow.
 *
 * The confirmation branch is not an edge case: when the Supabase project has
 * email confirmation enabled, signUp resolves with a user but NO session.
 * Rendering that as a failure would tell someone who just succeeded that
 * something went wrong, so it gets its own screen.
 */
import { useState, type FormEvent } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export function SignUpForm({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  const signUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(signUpError.message);
    } else if (!data.session) {
      // confirmation is on — the account exists but is not usable until the
      // emailed link is opened. Not an error.
      setConfirmSent(true);
    }
    // when a session DID arrive, Root re-renders on the auth change and takes
    // it from here; nothing more to do in this component.
    setSubmitting(false);
  };

  if (confirmSent) {
    return (
      <main className="tracking-login">
        <div className="tracking-login__panel">
          <div className="tracking-wordmark">
            DELAPAN<span>_8</span>
          </div>
          <h1>check your email</h1>
          <p className="pending-note">
            we sent a confirmation link to <span className="pending-email">{email}</span>. open it to
            finish creating your account.
          </p>
          <p className="pending-note">
            already have an account? <a href="/login">sign in</a> — if this address was already
            registered, no new mail is sent and that link will just sign you in instead.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="tracking-login">
      <form className="tracking-login__panel" onSubmit={(event) => void signUp(event)}>
        <div className="tracking-wordmark">
          DELAPAN<span>_8</span>
        </div>
        <h1>delapan</h1>
        <p>Create your delapan account.</p>

        <label>
          Email
          <input
            className="inp"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            className="inp"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className="tracking-error">{error}</p>}
        <button className="btn btn--accent" type="submit" disabled={submitting}>
          {submitting ? "creating account…" : "create account"}
        </button>
        <p className="pending-note">
          already have an account? <a href="/login">sign in</a>
        </p>
      </form>
    </main>
  );
}
