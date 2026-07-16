import { describe, expect, it } from "vitest";
import type { FindingRow } from "../api/types";
import { bin, inRange, tierOf, VERIFIED_MIN } from "./derive";

const row = (id: string, confidence: number): FindingRow => ({
  id,
  title: `t-${id}`,
  category: "research",
  confidence,
  tags: [],
  created_at: "2026-07-16T00:00:00Z",
});

describe("tierOf", () => {
  it("cuts at VERIFIED_MIN inclusively", () => {
    expect(VERIFIED_MIN).toBe(0.9);
    expect(tierOf(0.95)).toBe("verified");
    expect(tierOf(0.9)).toBe("verified");
    expect(tierOf(0.899)).toBe("unverified");
    expect(tierOf(0.24)).toBe("unverified");
  });
});

describe("bin", () => {
  it("returns empty bins for no rows", () => {
    const bins = bin([], 4);
    expect(bins).toHaveLength(4);
    expect(bins.every((b) => b.count === 0)).toBe(true);
  });

  it("places confidences in the right bucket and covers 0..1", () => {
    const bins = bin([row("a", 0), row("b", 0.24), row("c", 0.95), row("d", 1)], 4);
    expect(bins).toHaveLength(4);
    expect(bins[0]!.lo).toBe(0);
    expect(bins[3]!.hi).toBe(1);
    expect(bins[0]!.count).toBe(2); // 0 and 0.24 → [0, 0.25)
    expect(bins[3]!.count).toBe(2); // 0.95 and 1.0 → last bin, 1.0 clamped in
  });

  it("counts every row exactly once", () => {
    const rows = [row("a", 0.2), row("b", 0.5), row("c", 0.9), row("d", 1)];
    const bins = bin(rows, 20);
    expect(bins.reduce((n, b) => n + b.count, 0)).toBe(rows.length);
  });
});

describe("inRange", () => {
  it("returns all rows when range is null", () => {
    const rows = [row("a", 0.1), row("b", 0.9)];
    expect(inRange(rows, null)).toHaveLength(2);
  });

  it("filters inclusively on both ends", () => {
    const rows = [row("a", 0.1), row("b", 0.5), row("c", 0.9)];
    expect(inRange(rows, [0.5, 0.9]).map((r) => r.id)).toEqual(["b", "c"]);
  });
});
