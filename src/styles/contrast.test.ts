/**
 * WCAG contrast gate for the moss-on-parchment brand tokens. The suite that
 * shipped this branch only read CSS as a string, so a 2.65:1 moss-on-ink
 * border (site-docs.css finding 2) slipped through undetected. This parses
 * the actual hexes out of site.css and checks the pairings that matter.
 */
import { describe, expect, it } from "vitest";
import siteCss from "./site.css?raw";

function tokenHex(name: string): string {
  const match = siteCss.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token ${name} not found in site.css`);
  return match[1];
}

function relLuminance(hex: string): number {
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(1 + i, 3 + i), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [rl, gl, bl] = [r, g, b].map(lin);
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

function contrastRatio(hexA: string, hexB: string): number {
  const [l1, l2] = [relLuminance(hexA), relLuminance(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

const ink = tokenHex("--p8-ink");
const bone = tokenHex("--p8-bone");
const accent = tokenHex("--p8-accent");
const accentD = tokenHex("--p8-accent-d");
const mutedD = tokenHex("--p8-muted-d");
const muted = tokenHex("--p8-muted");

describe("brand token pairings meet WCAG contrast floors", () => {
  it("--p8-accent on --p8-bone >= 4.5:1 (moss links/underlines on parchment)", () => {
    expect(contrastRatio(accent, bone)).toBeGreaterThanOrEqual(4.5);
  });

  it("--p8-accent-d on --p8-ink >= 4.5:1 (the on-ink moss variant)", () => {
    expect(contrastRatio(accentD, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("--p8-muted-d on --p8-ink >= 4.5:1 (secondary text on ink surfaces)", () => {
    expect(contrastRatio(mutedD, ink)).toBeGreaterThanOrEqual(4.5);
  });

  it("--p8-muted on --p8-bone >= 4.5:1 (secondary text on parchment)", () => {
    expect(contrastRatio(muted, bone)).toBeGreaterThanOrEqual(4.5);
  });

  it("--p8-accent on --p8-ink is BELOW 3:1 — moss is never legible on ink", () => {
    // This is exactly why --p8-accent-d exists: the base moss accent reads
    // fine on parchment (bone) but is too dark to use directly on the ink
    // surface. Any rule painting --p8-accent onto --p8-ink (or an ink-family
    // panel) is the finding-2 bug class — it should use --p8-accent-d.
    expect(contrastRatio(accent, ink)).toBeLessThan(3);
  });
});
