/**
 * v2 sticky header. Prototype lines 30-42: 60px, blurred veil, hairline
 * bottom border, logo lockup (dark Logomark + wordmark) left, nav + docs CTA
 * right. Always there — no scroll-state change, no shrink.
 */
import { DsButton } from "./ds/Button";
import { Logomark } from "./ds/Logomark";

export function SiteHeader() {
  return (
    <header className="lpv2-header">
      <div className="lpv2-header-row">
        <a href="#top" className="lpv2-brand">
          <Logomark variant="dark" size={26} title="delapan" />
          <span className="lpv2-wordmark">delapan</span>
        </a>
        <nav className="lpv2-nav">
          <a href="#how" className="lpv2-nav-link">
            how it works
          </a>
          <a href="#faq" className="lpv2-nav-link">
            faq
          </a>
          <DsButton href="/docs" kind="nav">
            read the docs
          </DsButton>
        </nav>
      </div>
    </header>
  );
}
