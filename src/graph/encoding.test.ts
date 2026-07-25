import { beforeEach, describe, expect, it } from "vitest";
import tokensCss from "../styles/tokens.css?raw";
import {
  CHROME,
  GLYPHS,
  REST_COLOR,
  REST_GLYPH,
  REST_GLYPHS,
  RING,
  channelCount,
  isRemainder,
  resetAssignments,
  typeColor,
  typeGlyph,
} from "./encoding";

beforeEach(() => resetAssignments());

describe("chrome never encodes data", () => {
  it("shares no hue between the chrome and data palettes", () => {
    const lower = (s: string) => s.toLowerCase();
    const chrome = new Set(CHROME.map(lower));
    for (const hue of RING) expect(chrome.has(lower(hue))).toBe(false);
    expect(chrome.has(lower(REST_COLOR))).toBe(false);
  });

  it("never returns a chrome hue for any type, known or unknown", () => {
    const chrome = new Set(CHROME.map((s) => s.toLowerCase()));
    const types = ["concept", "technology", "person", "company", "project"];
    for (let i = 0; i < 40; i++) types.push(`unknown-${i}`);
    for (const t of types) expect(chrome.has(typeColor(t).toLowerCase())).toBe(false);
  });
});

describe("the ring is capped and reports its remainder", () => {
  it("stays within the 8-channel cap", () => {
    expect(channelCount()).toBeLessThanOrEqual(8);
  });

  it("pushes overflow types onto the shared remainder channel", () => {
    const overflow: string[] = [];
    for (let i = 0; i < RING.length + 5; i++) overflow.push(`t-${i}`);
    overflow.forEach((t) => typeColor(t));
    const rest = overflow.filter(isRemainder);
    expect(rest.length).toBeGreaterThan(0);
    for (const t of rest) {
      expect(typeColor(t)).toBe(REST_COLOR);
    }
  });

  it("gives two distinct overflow types different glyphs while sharing REST_COLOR", () => {
    const overflow: string[] = [];
    for (let i = 0; i < RING.length + 2; i++) overflow.push(`o-${i}`);
    overflow.forEach((t) => typeColor(t));
    const [a, b] = overflow.filter(isRemainder);
    expect(a).toBeDefined();
    expect(b).toBeDefined();
    expect(typeColor(a!)).toBe(REST_COLOR);
    expect(typeColor(b!)).toBe(REST_COLOR);
    expect(typeGlyph(a!)).not.toBe(typeGlyph(b!));
  });

  it("keeps an overflow type's glyph stable across repeated lookups", () => {
    const overflow: string[] = [];
    for (let i = 0; i < RING.length + 3; i++) overflow.push(`s-${i}`);
    overflow.forEach((t) => typeColor(t));
    const t = overflow.filter(isRemainder)[0]!;
    const glyph = typeGlyph(t);
    for (let i = 0; i < 5; i++) expect(typeGlyph(t)).toBe(glyph);
  });
});

describe("no channel is colour-only", () => {
  it("gives every ring slot a glyph", () => {
    expect(GLYPHS.length).toBe(RING.length);
  });

  it("uses a distinct glyph per channel, so none silently collapses", () => {
    const all = [...GLYPHS, REST_GLYPH];
    expect(new Set(all).size).toBe(all.length);
  });

  it("returns a non-empty glyph for every type", () => {
    for (const t of ["concept", "person", "wildcard", "another"]) {
      expect(typeGlyph(t).length).toBeGreaterThan(0);
    }
  });

  it("gives the overflow ring at least 6 glyphs, all distinct from GLYPHS", () => {
    expect(REST_GLYPHS.length).toBeGreaterThanOrEqual(6);
    expect(new Set([...GLYPHS, ...REST_GLYPHS]).size).toBe(GLYPHS.length + REST_GLYPHS.length);
    expect(REST_GLYPHS[0]).toBe(REST_GLYPH);
  });
});

describe("channel assignment is stable", () => {
  it("keeps a type on the same channel across repeated lookups", () => {
    const first = typeColor("technology");
    const glyph = typeGlyph("technology");
    for (let i = 0; i < 5; i++) {
      expect(typeColor("technology")).toBe(first);
      expect(typeGlyph("technology")).toBe(glyph);
    }
  });

  it("does not hand a known type's slot to an unknown one", () => {
    const known = new Set(
      ["concept", "technology", "person", "company", "project"].map(typeColor),
    );
    expect(known.has(typeColor("some-new-type"))).toBe(false);
  });

  it("memoizes dynamically assigned types across repeated lookups", () => {
    const type = "unknown-dynamic-type";
    const firstColor = typeColor(type);
    const firstGlyph = typeGlyph(type);

    // Verify it lands in a real ring slot, not remainder
    expect(firstColor).not.toBe(REST_COLOR);
    expect(firstGlyph).not.toBe(REST_GLYPH);

    // Verify repeated lookups return the same memoized values
    for (let i = 0; i < 5; i++) {
      expect(typeColor(type)).toBe(firstColor);
      expect(typeGlyph(type)).toBe(firstGlyph);
    }
  });
});

describe("tokens.css mirrors the module", () => {

  it("declares one --data-N token per ring slot, in order", () => {
    RING.forEach((hue, i) => {
      const declared = new RegExp(`--data-${i + 1}:\\s*${hue};`, "i").test(tokensCss);
      expect(declared, `--data-${i + 1} should be ${hue}`).toBe(true);
    });
  });

  it("declares the remainder channel", () => {
    expect(new RegExp(`--data-rest:\\s*${REST_COLOR};`, "i").test(tokensCss)).toBe(true);
  });

  it("keeps chrome amber out of every --data-* token", () => {
    const dataTokens = [...tokensCss.matchAll(/--data-[\w-]+:\s*([^;]+);/g)].map((m) =>
      m[1]!.trim().toLowerCase(),
    );
    expect(dataTokens.length).toBeGreaterThan(0);
    for (const hue of CHROME) expect(dataTokens).not.toContain(hue.toLowerCase());
  });

  it("gives every --data-* token a literal 6-digit hex colour, not an alias", () => {
    const dataTokens = [...tokensCss.matchAll(/--data-[\w-]+:\s*([^;]+);/g)].map((m) => m[1]!.trim());
    expect(dataTokens.length).toBeGreaterThan(0);
    for (const value of dataTokens) expect(value).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
