/**
 * v2 sticky header. Prototype lines 30-42: 60px, blurred veil, hairline
 * bottom border, logo lockup (pixel-8 Logomark + wordmark) left, nav + CTA
 * right. Always there — no scroll-state change, no shrink.
 *
 * The account pair (sign in + create account) is restored from SiteShell,
 * which still carries it on every other public surface — the landing page
 * was the only one that lost it in the v2 rebuild. The amber pill is the
 * account CTA rather than the prototype's "read the docs" because the header
 * is the only place an account can be reached; docs keeps the primary CTA in
 * both the hero and the closing section, so the page stays docs-first.
 */
import { Logomark } from "../panels/Logomark";
import { DsButton } from "./ds/Button";

export function SiteHeader() {
  return (
    <header className="lpv2-header">
      <div className="lpv2-header-row">
        <a href="#top" className="lpv2-brand">
          <Logomark size={26} />
          <span className="lpv2-wordmark">delapan</span>
        </a>
        <nav className="lpv2-nav" aria-label="primary">
          <a href="#how" className="lpv2-nav-link">
            how it works
          </a>
          <a href="#faq" className="lpv2-nav-link">
            faq
          </a>
          <a href="/docs" className="lpv2-nav-link">
            docs
          </a>
          <a href="/login" className="lpv2-signin">
            sign in
          </a>
          <DsButton href="/signup" kind="nav">
            create account
          </DsButton>
        </nav>
      </div>
    </header>
  );
}
