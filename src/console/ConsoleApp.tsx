/**
 * The console — the first screen after signing in. Greeting, one obvious
 * resume action into the graph panel, the destinations this account can reach,
 * and an account block (email + sign out) rather than an account page: those
 * two facts are all the account data available without new API surface.
 */
import type { Session } from "@supabase/supabase-js";
import { Logomark } from "../panels/Logomark";
import { Wordmark } from "../panels/Wordmark";
import { getSupabaseClient } from "../tracking/supabaseClient";
import { TILES } from "./tiles";

export function ConsoleApp({ session }: { session: Session }) {
  const email = session.user.email ?? null;
  const handle = email?.split("@")[0] ?? "there";

  const signOut = () => {
    void getSupabaseClient().auth.signOut();
  };

  return (
    <div className="cons">
      <header className="cons-head">
        <Logomark size={40} />
        <div className="cons-brand-text">
          <Wordmark form="lower" className="cons-wordmark" />
          {email && <span className="cons-sub">signed in as {email}</span>}
        </div>
      </header>

      <main className="cons-body">
        <h1 className="cons-greet">welcome back, {handle}</h1>

        <a className="cons-resume" href="/kg">
          <span className="cons-resume-kicker">jump back in</span>
          <span className="cons-resume-title">knowledge graph control</span>
        </a>

        <h2 className="cons-section">everything else</h2>
        <div className="cons-grid">
          {TILES.map((tile) => (
            <a
              key={tile.href}
              className="cons-tile"
              href={tile.href}
              {...(tile.external ? { target: "_blank", rel: "noreferrer" } : {})}
            >
              <span className="cons-tile-label">
                {tile.label}
                {tile.external && <span className="cons-tile-ext"> ↗</span>}
              </span>
              <span className="cons-tile-desc">{tile.description}</span>
            </a>
          ))}
        </div>

        <section className="cons-account">
          <h2 className="cons-section">account</h2>
          {email && <p className="cons-account-email">{email}</p>}
          <button className="btn" onClick={signOut}>
            sign out
          </button>
        </section>
      </main>
    </div>
  );
}
