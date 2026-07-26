/**
 * Hero. Problem-first, and the promise is one the shipped code keeps: findings
 * carry grounded_in, and the write-time resolver retires rather than deletes.
 */
import { Logomark } from "../panels/Logomark";

export function Hero() {
  return (
    <>
      <nav className="lp-nav">
        <Logomark size={40} />
        <span className="lp-wordmark">delapan</span>
        <a className="lp-cta lp-nav-cta" href="/login">
          sign in
        </a>
      </nav>

      <header className="lp-inner lp-hero">
        <h1>your agent learns something. where did it come from, and what happens when it changes?</h1>
        <p className="lp-lede">
          delapan researches a domain once, keeps every fact with the source it came from, and
          corrects itself when the facts move — without ever losing what it knew before.
        </p>
        <div className="lp-cta-row">
          <a className="lp-cta" href="/login">
            request an invite
          </a>
          <span className="lp-cta-note">free · invite-gated beta</span>
        </div>
      </header>
    </>
  );
}
