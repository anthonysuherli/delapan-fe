/**
 * The public landing page — v2 instrument-panel rebuild. Carries its own
 * frame (SiteHeader/SiteFooter) rather than SiteShell's site.css chrome; see
 * docs/truenorth/specs/2026-07-29-landing-v2-instrument-design.md decision 1.
 * The .lpv2 root is its own scroll container (body is overflow:hidden for the
 * graph app — see landing.css), so scroll-behavior lives there in CSS, not
 * on documentElement.
 */
import { useEffect, useState, type JSX } from "react";
import { ClosingCta } from "./ClosingCta";
import { Faq } from "./Faq";
import { Hero } from "./Hero";
import { KbGraph } from "./KbGraph";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { ThreeMoves } from "./ThreeMoves";
import { UseCases } from "./UseCases";

// SECTIONS: the remaining content sections, in order, between the graph
// island and ClosingCta. KbGraph itself is not part of this array — it
// belongs to the hero (64px top padding, not 132px) and is slotted directly
// after Hero below, per spec.
const SECTIONS: Array<() => JSX.Element> = [ThreeMoves, UseCases, Faq];

// Spec Deviation 4: below 720px the graph switches to density="core" and a
// shorter canvas (canvas height itself is a pure-CSS media query in landing.css).
const GRAPH_NARROW_BREAKPOINT_PX = 720;

function useIsNarrow(breakpointPx: number): boolean {
  const query = `(max-width: ${breakpointPx}px)`;
  const [narrow, setNarrow] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setNarrow(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);
  return narrow;
}

export function LandingApp() {
  const narrow = useIsNarrow(GRAPH_NARROW_BREAKPOINT_PX);

  return (
    <div className="lpv2">
      {/* Skip link, restored from SiteShell — the sticky header plus the graph
          island put a lot of tab stops before the content on the one public
          page that had no way past them. */}
      <a className="lpv2-skip" href="#main">
        skip to content
      </a>
      <SiteHeader />
      <main id="main" tabIndex={-1}>
        <Hero />
        <KbGraph density={narrow ? "core" : "full"} />
        {SECTIONS.map((Section, i) => (
          <Section key={i} />
        ))}
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
