import { describe, expect, it } from "vitest";
import { fieldCells } from "./markFieldCells";

describe("fieldCells", () => {
  it("is deterministic: same (cols, rows, seed) → byte-identical output", () => {
    const a = fieldCells(24, 16, "delapan");
    const b = fieldCells(24, 16, "delapan");
    expect(a).toEqual(b);
  });

  it("differs for a different seed", () => {
    const a = fieldCells(24, 16, "delapan");
    const b = fieldCells(24, 16, "other-seed");
    expect(a).not.toEqual(b);
  });

  it("every cell falls within grid bounds", () => {
    for (const [cols, rows, seed] of [
      [24, 16, "delapan"] as const,
      [12, 8, "delapan"] as const,
      [40, 30, "another"] as const,
    ]) {
      const cells = fieldCells(cols, rows, seed);
      for (const cell of cells) {
        expect(cell.x).toBeGreaterThanOrEqual(0);
        expect(cell.x).toBeLessThan(cols);
        expect(cell.y).toBeGreaterThanOrEqual(0);
        expect(cell.y).toBeLessThan(rows);
      }
    }
  });

  it("ink density is roughly 12% of the grid (tolerance band, not exact)", () => {
    const cols = 40;
    const rows = 30;
    const cells = fieldCells(cols, rows, "delapan");
    const ink = cells.filter((c) => c.kind === "ink").length;
    const frac = ink / (cols * rows);
    expect(frac).toBeGreaterThan(0.06);
    expect(frac).toBeLessThan(0.2);
  });

  it("coral fraction is bounded and small — a sparse accent, not a dominant color", () => {
    const cols = 40;
    const rows = 30;
    const cells = fieldCells(cols, rows, "delapan");
    const coral = cells.filter((c) => c.kind === "coral").length;
    const frac = coral / (cols * rows);
    expect(frac).toBeGreaterThan(0);
    expect(frac).toBeLessThan(0.05);
  });

  it("coral only ever falls on the mark's intersection band rows", () => {
    const cols = 40;
    const rows = 30;
    const cells = fieldCells(cols, rows, "delapan");
    const coralRows = new Set(cells.filter((c) => c.kind === "coral").map((c) => c.y));
    // the band should be a thin cluster of adjacent rows, not scattered
    // across the whole grid
    expect(coralRows.size).toBeGreaterThan(0);
    const rowsArr = [...coralRows].sort((a, b) => a - b);
    expect(rowsArr[rowsArr.length - 1] - rowsArr[0]).toBeLessThan(rows / 4);
  });

  it("no cell kind is ever outside the declared union", () => {
    const cells = fieldCells(24, 16, "delapan");
    for (const cell of cells) {
      expect(["ink", "coral"]).toContain(cell.kind);
    }
  });
});
