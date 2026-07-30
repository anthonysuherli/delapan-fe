/**
 * The public landing page — v2 instrument-panel rebuild. Carries its own
 * frame (SiteHeader/SiteFooter) rather than SiteShell's site.css chrome; see
 * docs/truenorth/specs/2026-07-29-landing-v2-instrument-design.md decision 1.
 * `scroll-behavior: smooth` is applied imperatively (not via `html:has()`,
 * per the task's global constraints) so hash-anchor nav (#how, #faq) scrolls
 * smoothly only while this page is mounted.
 */
import { useEffect, type JSX } from "react";
import { ClosingCta } from "./ClosingCta";
import { Hero } from "./Hero";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

// SECTIONS: Tasks 3-4 slot the graph island and content sections here, in
// order, between Hero and ClosingCta.
const SECTIONS: Array<() => JSX.Element> = [];

export function LandingApp() {
  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "smooth";
    return () => {
      html.style.scrollBehavior = prev;
    };
  }, []);

  return (
    <div className="lpv2">
      <SiteHeader />
      <main>
        <Hero />
        {SECTIONS.map((Section, i) => (
          <Section key={i} />
        ))}
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
