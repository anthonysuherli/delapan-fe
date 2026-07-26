/**
 * The public landing page — the only fully public surface in the app.
 * One component per section, no shared state, composed top to bottom.
 */
import { Hero } from "./Hero";
import { Pillars } from "./Pillars";
import { Problem } from "./Problem";

export function LandingApp() {
  return (
    <div className="lp">
      <Hero />
      <Problem />
      <Pillars />
    </div>
  );
}
