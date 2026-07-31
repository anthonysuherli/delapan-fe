/**
 * Closing CTA. Prototype lines 190-197: "ground it once" + support line +
 * CTA row, mirroring the hero's. Support line copy per spec Deviation 1
 * ("one clone…", not the prototype's "one command…" — the command it named
 * doesn't exist).
 */
import { InstallLine } from "./Hero";
import { DsButton } from "./ds/Button";

export function ClosingCta() {
  return (
    <section className="lpv2-close">
      <p className="lpv2-close-title">Ground it once.</p>
      <p className="lpv2-close-support">
        One clone puts a knowledge base on your machine. Nothing to provision.
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
