/**
 * v2 footer. Prototype lines 199-212: mark + "delapan · mit" left, four
 * links right. Real hrefs per spec Deviation 2 (docs README's own
 * prototype pointed everything at "#top" — a placeholder, not a spec).
 */
import { Logomark } from "./ds/Logomark";

export function SiteFooter() {
  return (
    <footer className="lpv2-footer">
      <div className="lpv2-footer-row">
        <div className="lpv2-footer-mark">
          <Logomark size={18} />
          <span>delapan · mit</span>
        </div>
        <div className="lpv2-footer-links">
          <a href="/docs">docs</a>
          <a href="https://github.com/anthonysuherli/delapan">github</a>
          <a href="/docs/quickstart">mcp</a>
          <a href="/changelog">changelog</a>
        </div>
      </div>
    </footer>
  );
}
