/**
 * The literal-scan gate: in-scope stylesheets may not carry raw colour,
 * z-index, or px border-radius literals — those resolve through tokens.css.
 * tokens.css itself is the definition site and is exempt. tracking.css,
 * landing.css, and public/duet-app.html are out of the 2026-07-26 polish
 * scope and deliberately unscanned.
 */
import { describe, expect, it } from "vitest";
import authCss from "./auth.css?raw";
import baseCss from "./base.css?raw";
import canvasCss from "./canvas.css?raw";
import consoleCss from "./console.css?raw";
import layoutCss from "./layout.css?raw";
import motionCss from "./motion.css?raw";
import panelsCss from "./panels.css?raw";

const SHEETS: Record<string, string> = {
  "auth.css": authCss,
  "base.css": baseCss,
  "canvas.css": canvasCss,
  "console.css": consoleCss,
  "layout.css": layoutCss,
  "motion.css": motionCss,
  "panels.css": panelsCss,
};

/** Deliberate exceptions, one line each. Grow this list consciously. */
const ALLOW: RegExp[] = [
  /url\("data:image\/svg\+xml[^"]*"\)/g, // inline SVG chevrons carry their own fill
  /rgba\(31, 43, 58, 0\.16\)/g, // canvas vignette gradient stop (canvas.css:73)
  /rgba\(217, 119, 6, [\d.]+\)/g, // boot scan gradient — one-shot, chrome-family
  /border-radius: 50%/g, // circles are geometry, not scale
  /border-radius: 1px 1px 0 0/g, // histogram bar cap (panels.css)
  /rgba\(255, 255, 255, 0\.55\)/g, // stage paper sheen gradient stop (canvas.css:12)
  /rgba\(38, 58, 84, 0\.07\)/g, // blueprint grid lines (canvas.css:13-14)
];

function strip(css: string): string {
  let out = css;
  for (const rule of ALLOW) out = out.replace(rule, "");
  return out;
}

describe("in-scope stylesheets carry no raw literals", () => {
  for (const [name, css] of Object.entries(SHEETS)) {
    const body = strip(css);

    it(`${name}: no hex colours`, () => {
      const hits = body.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
      expect(hits, `${name} has raw hex: ${hits.join(", ")}`).toEqual([]);
    });

    it(`${name}: no rgba() colours`, () => {
      const hits = body.match(/rgba?\([^)]*\)/g) ?? [];
      expect(hits, `${name} has raw rgba: ${hits.join(", ")}`).toEqual([]);
    });

    it(`${name}: no px border-radius`, () => {
      const hits = body.match(/border-radius:\s*[\d.]+px/g) ?? [];
      expect(hits, `${name} has raw radius: ${hits.join(", ")}`).toEqual([]);
    });

    if (name !== "canvas.css") {
      it(`${name}: no integer z-index`, () => {
        const hits = body.match(/z-index:\s*\d+/g) ?? [];
        expect(hits, `${name} has raw z-index: ${hits.join(", ")}`).toEqual([]);
      });
    }
  }
});
