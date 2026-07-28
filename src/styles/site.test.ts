/**
 * site.css is the public-site brand source of truth (moss-on-parchment).
 * A rebrand must fail here loudly, not drift silently. (The deprecated
 * delapan-ai-site/docs/branding/ describes the retired coral system.)
 */
import { describe, expect, it } from "vitest";
import siteCss from "./site.css?raw";

const BRAND: Record<string, string> = {
  "--p8-ink": "#1B1E18",
  "--p8-bone": "#FAF8F1",
  "--p8-accent": "#4C6640",
  "--p8-accent-deep": "#3B5233",
  "--p8-accent-d": "#A9BF97",
  "--p8-muted-d": "#9AA08E",
  "--p8-positive": "#1F9D6B",
  "--p8-warning": "#D98A2B",
  "--p8-critical": "#C2453B",
  "--p8-info": "#3D7BFF",
};

describe("site.css defines the moss-on-parchment brand", () => {
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

  it("keeps accent out of body text color declarations", () => {
    // accent may fill CTAs/accents; `.site` base color must be ink
    expect(/\.site\s*\{[^}]*color:\s*var\(--p8-ink\)/s.test(siteCss)).toBe(true);
  });

  it("declares the serif accent register", () => {
    expect(siteCss).toContain('"Lora"');
  });

  it("carries no coral tokens after the moss rebrand", () => {
    expect(siteCss).not.toMatch(/--p8-coral/);
  });
});

describe("the :where() zero-specificity contract (see file header)", () => {
  // `.site` base element rules must stay inside :where() — that's what
  // keeps them at zero specificity so any class rule anywhere (including
  // the app's own sheets) can beat them. A bare `.site h1` etc sits at
  // (0,1,1), which ties or beats a plain single-class surface rule and
  // wins on stylesheet import order instead of cascade intent — exactly
  // the auth.css h1 regression this branch's review caught.
  it("targets bare element names only inside :where(), never as `.site <elem>`", () => {
    // strip comments first — the file's own header/prose quotes the bad
    // pattern (`.site h1`) as an example, which would otherwise self-match.
    const code = siteCss.replace(/\/\*[\s\S]*?\*\//g, "");
    const unwrapped = /\.site\s+(h[1-6]|a|code|pre|p|ul|li)\b/g;
    const hits: string[] = [];
    for (const match of code.matchAll(unwrapped)) {
      const before = code.slice(0, match.index);
      const openWhere = before.lastIndexOf(":where(");
      const closeWhere = before.lastIndexOf(")");
      const insideWhere = openWhere > -1 && openWhere > closeWhere;
      if (!insideWhere) hits.push(match[0]);
    }
    expect(hits, `found un-:where()'d element rules: ${hits.join(", ")}`).toEqual([]);
  });
});
