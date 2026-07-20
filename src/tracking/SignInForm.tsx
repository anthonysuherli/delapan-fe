import { type FormEvent, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SignInFormProps {
  supabase: SupabaseClient;
  title?: string;
  subtitle?: string;
}

export function SignInForm({
  supabase,
  title = "Project tracking",
  subtitle = "Sign in with the private tracker account.",
}: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
    }
    setSubmitting(false);
  };

  return (
    <main className="tracking-login">
      <form className="tracking-login__panel" onSubmit={(event) => void signIn(event)}>
        <div className="tracking-wordmark">
          DELAPAN<span>_8</span>
        </div>
        <h1>{title}</h1>
        <p>{subtitle}</p>

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
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {error && <p className="tracking-error">{error}</p>}
        <button className="btn btn--accent" type="submit" disabled={submitting}>
          {submitting ? "signing in…" : "sign in"}
        </button>
      </form>
    </main>
  );
}
