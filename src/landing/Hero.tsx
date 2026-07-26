/**
 * Hero. Problem-first, and the promise is one the shipped code keeps: findings
 * carry grounded_in, and the write-time resolver retires rather than deletes.
 * Nav lives in SiteShell now — this is just the header + cta.
 */
import { CtaRow } from "../site/CtaRow";
import { MarkField } from "../site/MarkField";

export function Hero() {
  return (
    <header className="lp-inner lp-hero">
      <MarkField />
      <div className="lp-hero-copy">
        <h1>where did your agent learn that?</h1>
        <p className="lp-lede">
          delapan researches a domain once, keeps every fact with the source it came from, and
          corrects itself when the facts move — without ever losing what it knew before.
        </p>
        <CtaRow />
      </div>
    </header>
  );
}
