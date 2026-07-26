import { describe, expect, it } from "vitest";
import { TILES } from "./tiles";

describe("console tiles", () => {
  it("offers the four destinations that exist today", () => {
    expect(TILES.map((t) => t.label)).toEqual([
      "knowledge graph", "findings", "tracking", "dua",
    ]);
  });

  it("gives every tile a non-empty href and description", () => {
    for (const t of TILES) {
      expect(t.href.length, `${t.label} needs an href`).toBeGreaterThan(0);
      expect(t.description.length, `${t.label} needs a description`).toBeGreaterThan(0);
    }
  });

  it("marks only the off-site destination external", () => {
    const external = TILES.filter((t) => t.external);
    expect(external.map((t) => t.label)).toEqual(["dua"]);
    for (const t of external) expect(t.href).toMatch(/^https:\/\//);
  });

  it("keeps every in-app tile on a path this app serves", () => {
    for (const t of TILES.filter((t) => !t.external)) {
      expect(t.href.startsWith("/"), `${t.label} must be a root-relative path`).toBe(true);
    }
  });
});
