/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 */
import { Coverage } from "./Coverage";
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";
import { WhereItPlugsIn } from "./WhereItPlugsIn";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
      <Problem />
      <Pillars />
      <Coverage />
      <WhereItPlugsIn />
    </div>
  );
}
