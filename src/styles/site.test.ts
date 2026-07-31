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
    // Newsreader replaced Space Grotesk 2026-07-31 under the delapan-design
    // language: one serif announces AND argues, and Inter is demoted to chrome.
    expect(siteCss).toContain('"Newsreader"');
    expect(siteCss).toContain('"Inter"');
    expect(siteCss).toContain('"JetBrains Mono"');
  });

  it("gives prose its own family and its own size", () => {
    // The signature move: body prose is the serif, not the UI grotesque. Prose
    // also gets 17px rather than a step off the sans ramp, because a serif
    // reads roughly one step smaller at the same nominal size.
    expect(siteCss).toMatch(/--p8-font-prose:\s*"Newsreader"/);
    expect(siteCss).toMatch(/--p8-text-prose:\s*17px/);
    expect(siteCss).toMatch(/:where\(\.site\) :where\(p\)/);
  });

  it("is flat: no anchored element casts a shadow", () => {
    // Depth is a paper-stock change. Only --p8-shadow-lg survives, and it
    // belongs to floating overlays (menus, modals, toasts) exclusively.
    expect(siteCss).toMatch(/--p8-shadow-sm:\s*none/);
    expect(siteCss).toMatch(/--p8-shadow:\s*none/);
  });

  it("never paints a card pure white", () => {
    expect(siteCss).not.toMatch(/--p8-panel:\s*#FFFFFF/i);
  });

  it("keeps accent out of body text color declarations", () => {
    // accent may fill CTAs/accents; `.site` base color must be ink
    expect(/\.site\s*\{[^}]*color:\s*var\(--p8-ink\)/s.test(siteCss)).toBe(true);
  });

  it("declares the serif accent register", () => {
    // Was Lora, annotated "never body". Newsreader now carries both prose and
    // the italic statement register, so Lora is gone rather than demoted.
    expect(siteCss).toMatch(/--p8-font-serif:\s*"Newsreader"/);
    expect(siteCss).not.toContain('"Lora"');
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
