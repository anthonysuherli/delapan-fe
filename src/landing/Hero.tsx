/**
 * Hero. Prototype lines 44-52: eyebrow, headline (max 17ch — forces the
 * three-line break, preserve it), subhead, CTA row. Copy verbatim except
 * spec Deviation 1 (install line — see InstallLine below).
 */
import { DsButton } from "./ds/Button";

/**
 * `or git clone https://github.com/anthonysuherli/delapan` — spec Deviation 1.
 * The prototype's `npx delapan init` does not exist (npm 404; the engine is
 * Python/uv). Shared by Hero and ClosingCta so the string can't drift.
 */
export function InstallLine() {
  return (
    <span className="lpv2-install">
      <span className="lpv2-install-or">or </span>
      <span className="lpv2-install-cmd">git clone https://github.com/anthonysuherli/delapan</span>
    </span>
  );
}

export function Hero() {
  return (
    <section id="top" className="lpv2-hero">
      <span className="lpv2-eyebrow">grounding engine</span>
      <h1 className="lpv2-headline">design an agent memory you can audit</h1>
      <p className="lpv2-subhead">
        delapan grounds a domain once and keeps every fact with the source it came from. when
        something is missing it goes and gets it. every answer arrives cited.
      </p>
      <div className="lpv2-cta-row">
        <DsButton href="/docs" kind="hero">
          read the docs
        </DsButton>
        <InstallLine />
      </div>
    </section>
  );
}
