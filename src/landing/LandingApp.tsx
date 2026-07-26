/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 */
import { ClosingCta } from "./ClosingCta";
import { Coverage } from "./Coverage";
import { Footer } from "./Footer";
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";
import { WhatItIsnt } from "./WhatItIsnt";
import { WhereItPlugsIn } from "./WhereItPlugsIn";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
      <Problem />
      <Pillars />
      <Coverage />
      <WhereItPlugsIn />
      <WhatItIsnt />
      <ClosingCta />
      <Footer />
    </div>
  );
}
