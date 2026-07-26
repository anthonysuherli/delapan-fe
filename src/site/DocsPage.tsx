import { DOCS_TOC } from "./docs/toc";
import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

interface DocsPageProps {
  slug?: string;
}

/**
 * The docs shell — SiteShell-wrapped two-column layout. The left rail lists
 * DOCS_TOC (quickstart, then a "concepts" group for everything Task 8 adds
 * after it) with `aria-current` on the active slug; a missing slug falls
 * back to quickstart. An unknown slug renders inline not-found content —
 * deliberately not <NotFound/>, which wraps its own SiteShell and would
 * nest shells.
 *
 * The active content wrapper carries `id={activeSlug}` and the rail's
 * concepts group carries `id="concepts"`, so the SiteShell footer's
 * `/docs#quickstart` and `/docs#concepts` anchors resolve even though this
 * page isn't routed yet (Task 11 wires it).
 */
export function DocsPage({ slug }: DocsPageProps) {
  const activeSlug = slug ?? "quickstart";
  const entry = DOCS_TOC.find((item) => item.slug === activeSlug);
  const [quickstart, ...concepts] = DOCS_TOC;

  usePageTitle(entry ? `delapan docs — ${entry.title}` : "delapan docs — not found");

  return (
    <SiteShell active="docs">
      <div className="docs">
        <nav className="docs-rail" aria-label="docs sections">
          <ul>
            <li>
              <a
                href={`/docs/${quickstart.slug}`}
                aria-current={quickstart.slug === activeSlug ? "page" : undefined}
              >
                {quickstart.title}
              </a>
            </li>
          </ul>

          <div id="concepts" className="docs-rail-group">
            <h2>concepts</h2>
            <ul>
              {concepts.map((item) => (
                <li key={item.slug}>
                  <a
                    href={`/docs/${item.slug}`}
                    aria-current={item.slug === activeSlug ? "page" : undefined}
                  >
                    {item.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div id={activeSlug} className="docs-content">
          {entry ? (
            entry.element
          ) : (
            <div className="docs-not-found">
              <h1>this section doesn't exist</h1>
              <p>
                that doc page isn't here. <a href="/docs">back to docs</a>.
              </p>
            </div>
          )}
        </div>
      </div>
    </SiteShell>
  );
}
