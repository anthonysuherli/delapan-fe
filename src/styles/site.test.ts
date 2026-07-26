/**
 * The marketing token layer mirrors the brand source of truth
 * (delapan-ai-site/docs/branding/tokens.css). A rebrand upstream must fail
 * here loudly, not drift silently.
 */
import { describe, expect, it } from "vitest";
import siteCss from "./site.css?raw";

const BRAND: Record<string, string> = {
  "--p8-ink": "#0B0F14",
  "--p8-bone": "#F7F6F2",
  "--p8-coral": "#FF6B4A",
  "--p8-coral-deep": "#E8431F",
  "--p8-positive": "#1F9D6B",
  "--p8-warning": "#D98A2B",
  "--p8-critical": "#C2453B",
  "--p8-info": "#3D7BFF",
};

describe("site.css mirrors the pixel-8 brand", () => {
  it("declares every core brand hex verbatim", () => {
    for (const [token, hex] of Object.entries(BRAND)) {
      const re = new RegExp(`${token}:\\s*${hex};`, "i");
      expect(re.test(siteCss), `${token} should be ${hex}`).toBe(true);
    }
  });

  it("scopes the tokens to .site, not :root", () => {
    expect(/\.site\s*\{/.test(siteCss)).toBe(true);
    expect(/:root\s*\{/.test(siteCss)).toBe(false);
  });

  it("declares the brand type trio", () => {
    expect(siteCss).toContain('"Space Grotesk"');
    expect(siteCss).toContain('"Inter"');
    expect(siteCss).toContain('"JetBrains Mono"');
  });

  it("keeps coral out of body text color declarations", () => {
    // coral may fill CTAs/accents; `.site` base color must be ink
    expect(/\.site\s*\{[^}]*color:\s*var\(--p8-ink\)/s.test(siteCss)).toBe(true);
  });
});
