import type { ReactNode } from "react";
import { Logomark } from "../panels/Logomark";
import { Wordmark } from "../panels/Wordmark";

type ActiveSurface = "docs" | "changelog" | "about";

interface SiteShellProps {
  children: ReactNode;
  active?: ActiveSurface;
}

const NAV_LINKS: { key: ActiveSurface; href: string; label: string }[] = [
  { key: "docs", href: "/docs", label: "docs" },
  { key: "changelog", href: "/changelog", label: "changelog" },
  { key: "about", href: "/about", label: "about" },
];

/**
 * The public-site chrome: skip link, nav (brand, section links, sign in +
 * create account), the page's own content, and the four-column footer.
 * Marketing pages render as `<SiteShell active="docs">…</SiteShell>`.
 */
export function SiteShell({ children, active }: SiteShellProps) {
  return (
    <div className="site">
      <a className="ss-skip" href="#main">
        skip to content
      </a>

      <nav className="ss-nav">
        <a className="ss-brand" href="/">
          <Logomark size={32} />
          <Wordmark form="lower" />
        </a>

        <ul className="ss-links">
          {NAV_LINKS.map((link) => (
            <li key={link.key}>
              <a href={link.href} aria-current={active === link.key ? "page" : undefined}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ss-nav-actions">
          <a className="ss-signin" href="/login">
            sign in
          </a>
          <a className="ss-cta" href="/signup">
            create account
          </a>
        </div>

        <details className="ss-menu">
          <summary>menu</summary>
          <ul>
            {NAV_LINKS.map((link) => (
              <li key={link.key}>
                <a href={link.href} aria-current={active === link.key ? "page" : undefined}>
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a href="/login">sign in</a>
            </li>
            <li>
              <a className="ss-cta" href="/signup">
                create account
              </a>
            </li>
          </ul>
        </details>
      </nav>

      <main id="main" tabIndex={-1}>
        {children}
      </main>

      <footer className="ss-footer">
        <div className="ss-footer-col">
          <h2>product</h2>
          <ul>
            <li>
              <a href="/">home</a>
            </li>
            <li>
              <a href="/changelog">changelog</a>
            </li>
            <li>
              <a href="/about">about</a>
            </li>
          </ul>
        </div>

        <div className="ss-footer-col">
          <h2>docs</h2>
          <ul>
            <li>
              <a href="/docs">docs</a>
            </li>
            <li>
              <a href="/docs#quickstart">quickstart</a>
            </li>
            <li>
              <a href="/docs#concepts">concepts</a>
            </li>
          </ul>
        </div>

        <div className="ss-footer-col">
          <h2>legal</h2>
          <ul>
            <li>
              <a href="/terms">terms</a>
            </li>
            <li>
              <a href="/privacy">privacy</a>
            </li>
          </ul>
        </div>

        <div className="ss-footer-col">
          <h2>contact</h2>
          <ul>
            <li>
              <a href="https://github.com/anthonysuherli/delapan">
                github.com/anthonysuherli/delapan
              </a>
            </li>
          </ul>
        </div>

        <p className="ss-footer-bottom">© 2026 delapan · agent memory you can audit</p>
      </footer>
    </div>
  );
}
