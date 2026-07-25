import { beforeEach, describe, expect, it } from "vitest";
import {
  CHROME,
  GLYPHS,
  REST_COLOR,
  REST_GLYPH,
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
      expect(typeGlyph(t)).toBe(REST_GLYPH);
    }
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
});
