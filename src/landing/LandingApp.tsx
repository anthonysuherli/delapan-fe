/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 * SiteShell owns the nav and footer. The numbered sections are composed
 * from an array so their kicker index (derived from array position, not
 * hardcoded per component) can't desync.
 */
import { SiteShell } from "../site/SiteShell";
import { ClosingCta } from "./ClosingCta";
import { Coverage } from "./Coverage";
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";
import { Resolution } from "./Resolution";
import { WhatItIsnt } from "./WhatItIsnt";
import { WhereItPlugsIn } from "./WhereItPlugsIn";

const SECTIONS = [Problem, Pillars, Resolution, Coverage, WhereItPlugsIn, WhatItIsnt];

export function LandingApp() {
  return (
    <SiteShell>
      <div className="lp">
        <Hero />
        {SECTIONS.map((Section, i) => (
          <Section key={i} index={i + 1} />
        ))}
        <ClosingCta />
      </div>
    </SiteShell>
  );
}
