/**
 * v2 footer. Prototype lines 199-212: mark + "delapan · mit" left, links
 * right. Real hrefs per spec Deviation 2 (docs README's own prototype
 * pointed everything at "#top" — a placeholder, not a spec).
 *
 * The link list carries every destination SiteShell's four-column footer
 * still reaches on the other public surfaces — including about and the two
 * legal pages, which /signup's consent copy links to and so must be
 * reachable from the page that sends visitors there. The copyright line is
 * SiteShell's `.ss-footer-bottom`, kept verbatim.
 */
import { Logomark } from "../panels/Logomark";

export function SiteFooter() {
  return (
    <footer className="lpv2-footer">
      <div className="lpv2-footer-row">
        <div className="lpv2-footer-mark">
          <Logomark size={18} />
          <span>delapan · mit</span>
        </div>
        <nav className="lpv2-footer-links" aria-label="footer">
          <a href="/docs">docs</a>
          <a href="/docs/quickstart">mcp</a>
          <a href="/changelog">changelog</a>
          <a href="/about">about</a>
          <a href="https://github.com/anthonysuherli/delapan">github</a>
          <a href="/terms">terms</a>
          <a href="/privacy">privacy</a>
        </nav>
      </div>
      <p className="lpv2-footer-bottom">© 2026 delapan · agent memory you can audit</p>
    </footer>
  );
}
