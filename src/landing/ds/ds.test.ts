import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Logomark } from "./Logomark";
import { DsButton } from "./Button";
import { TypeChip } from "./TypeChip";
import { ConfidenceBar } from "./ConfidenceBar";
import { VerdictBand } from "./VerdictBand";

// Raw hex is only allowed where the bundle source computes a color from a
// prop (TypeChip's hashed fallback hue, Logomark's fixed table-facet amber).
// Everything else must resolve through a --dlpv2- token.
const HEX = /#[0-9a-fA-F]{3,8}\b/g;

describe("Logomark", () => {
  it("is decorative (aria-hidden) without a title", () => {
    const html = renderToStaticMarkup(createElement(Logomark, {}));
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('role="img"');
  });

  it("exposes role=img + <title> when given a title", () => {
    const html = renderToStaticMarkup(createElement(Logomark, { title: "delapan" }));
    expect(html).toContain('role="img"');
    expect(html).toContain("<title>delapan</title>");
    expect(html).not.toContain('aria-hidden="true"');
  });

  it("keeps the amber table-facet fill across variants — never recolored", () => {
    for (const variant of ["light", "dark"] as const) {
      const html = renderToStaticMarkup(createElement(Logomark, { variant }));
      expect(html).toContain("#f59e0b");
    }
  });

  it("mono variant inherits currentColor instead of the fixed palette", () => {
    const html = renderToStaticMarkup(createElement(Logomark, { variant: "mono" }));
    expect(html).not.toMatch(HEX);
    expect(html).toContain("currentColor");
  });
});

describe("DsButton", () => {
  it("renders an <a href> carrying the label", () => {
    const html = renderToStaticMarkup(
      createElement(DsButton, { href: "/docs", kind: "nav", children: "read the docs" }),
    );
    expect(html).toContain('href="/docs"');
    expect(html).toContain("read the docs");
    expect(html.startsWith("<a ")).toBe(true);
  });

  it("nav vs hero kinds apply different override sets", () => {
    const nav = renderToStaticMarkup(createElement(DsButton, { href: "#", kind: "nav", children: "x" }));
    const hero = renderToStaticMarkup(createElement(DsButton, { href: "#", kind: "hero", children: "x" }));
    expect(nav).toContain("7px 14px");
    expect(hero).toContain("13px 26px");
    expect(hero).toContain(".03em");
    expect(nav).not.toContain(".03em");
  });

  it("carries no raw hex — colors resolve through --dlpv2- tokens", () => {
    const html = renderToStaticMarkup(createElement(DsButton, { href: "#", kind: "hero", children: "x" }));
    expect(html).not.toMatch(HEX);
    expect(html).toContain("--dlpv2-accent");
  });
});

describe("TypeChip", () => {
  it("lowercases and displays the type name", () => {
    const html = renderToStaticMarkup(createElement(TypeChip, { type: "Concept" }));
    expect(html).toContain(">concept<");
  });

  it("colors the chip from the fixed type palette via tokens", () => {
    const html = renderToStaticMarkup(createElement(TypeChip, { type: "concept" }));
    expect(html).toContain("var(--dlpv2-type-concept)");
  });

  it("falls back to a hashed hue for unknown types — prop-derived, allowed as raw hex", () => {
    const html = renderToStaticMarkup(createElement(TypeChip, { type: "obscure-type" }));
    expect(html).toMatch(HEX);
  });
});

describe("ConfidenceBar", () => {
  it("clamps value into [0,1] as the decorative bar width", () => {
    const over = renderToStaticMarkup(createElement(ConfidenceBar, { value: 4 }));
    const under = renderToStaticMarkup(createElement(ConfidenceBar, { value: -2 }));
    expect(over).toContain("width:100%");
    expect(under).toContain("width:0%");
  });

  it("is decorative (aria-hidden)", () => {
    const html = renderToStaticMarkup(createElement(ConfidenceBar, { value: 0.5 }));
    expect(html).toContain('aria-hidden="true"');
  });

  it("never prints a value — matches the bundle's default (showValue=false)", () => {
    const html = renderToStaticMarkup(createElement(ConfidenceBar, { value: 0.91 }));
    expect(html).not.toContain("0.91");
  });

  it("carries no raw hex — fill resolves through --dlpv2- tokens", () => {
    const html = renderToStaticMarkup(createElement(ConfidenceBar, { value: 0.5 }));
    expect(html).not.toMatch(HEX);
  });
});

describe("VerdictBand", () => {
  it("prints the coverage word and note", () => {
    const html = renderToStaticMarkup(
      createElement(VerdictBand, { coverage: "rich", note: "kb can answer", children: "preamble text" }),
    );
    expect(html).toContain(">rich<");
    expect(html).toContain("kb can answer");
    expect(html).toContain("preamble text");
  });

  it("carries no raw hex — verdict hue resolves through --dlpv2- tokens", () => {
    const html = renderToStaticMarkup(
      createElement(VerdictBand, { coverage: "gap", note: "needs exploration", children: "x" }),
    );
    expect(html).not.toMatch(HEX);
    expect(html).toContain("--dlpv2-gap");
  });
});
