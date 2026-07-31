import { describe, expect, it } from "vitest";
import { EDGES, NODES } from "./graphData";
import {
  LABEL_CHAR_W,
  LABEL_EDGE_PAD,
  degrees,
  diameter,
  isLit,
  labelShift,
  neighborsOf,
  visible,
} from "./kbGraphModel";

describe("degrees", () => {
  it("counts j_delapan's edges from the data, not a guessed number", () => {
    const expected = EDGES.filter((e) => e.source === "j_delapan" || e.target === "j_delapan").length;
    expect(degrees(EDGES).j_delapan).toBe(expected);
  });

  it("counts a leaf node's single edge", () => {
    const expected = EDGES.filter((e) => e.source === "o_anthropic" || e.target === "o_anthropic").length;
    expect(degrees(EDGES).o_anthropic).toBe(expected);
  });

  it("omits nodes with no edges in the given edge list", () => {
    const deg = degrees([]);
    expect(deg.j_delapan).toBeUndefined();
  });
});

describe("neighborsOf", () => {
  it("returns the neighbor set of c_finding derived from EDGES", () => {
    const expected = new Set<string>();
    EDGES.forEach((e) => {
      if (e.source === "c_finding") expected.add(e.target);
      if (e.target === "c_finding") expected.add(e.source);
    });
    expect(neighborsOf("c_finding", EDGES)).toEqual(expected);
  });

  it("returns an empty set when sel is null", () => {
    expect(neighborsOf(null, EDGES).size).toBe(0);
  });
});

describe("visible", () => {
  it("full density returns every node and edge unfiltered", () => {
    const { ns, es } = visible("full");
    expect(ns).toEqual(NODES);
    expect(es).toEqual(EDGES);
  });

  it("core density returns exactly the core-flagged nodes plus their induced edges", () => {
    const expectedNodes = NODES.filter((n) => n.core);
    const expectedIds = new Set(expectedNodes.map((n) => n.id));
    const expectedEdges = EDGES.filter((e) => expectedIds.has(e.source) && expectedIds.has(e.target));

    const { ns, es } = visible("core");
    expect(ns).toEqual(expectedNodes);
    expect(es).toEqual(expectedEdges);
    // sanity: core is a strict, non-trivial subset for this dataset
    expect(ns.length).toBeGreaterThan(0);
    expect(ns.length).toBeLessThan(NODES.length);
  });

  it("core edges never reference a non-core node", () => {
    const { ns, es } = visible("core");
    const ids = new Set(ns.map((n) => n.id));
    for (const e of es) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });
});

describe("diameter", () => {
  it("matches 2*(5.5 + min(degree,8)*1.25) below the clamp", () => {
    expect(diameter(0)).toBeCloseTo(2 * (5.5 + 0 * 1.25));
    expect(diameter(3)).toBeCloseTo(2 * (5.5 + 3 * 1.25));
    expect(diameter(8)).toBeCloseTo(2 * (5.5 + 8 * 1.25));
  });

  it("clamps at degree 8 — higher degrees produce the same diameter", () => {
    const atClamp = diameter(8);
    expect(diameter(9)).toBeCloseTo(atClamp);
    expect(diameter(20)).toBeCloseTo(atClamp);
  });
});

describe("isLit", () => {
  const neighbors = neighborsOf("c_finding", EDGES);

  it("no selection means every node is lit", () => {
    for (const n of NODES) {
      expect(isLit(n.id, null, new Set())).toBe(true);
    }
  });

  it("the selected node itself is lit", () => {
    expect(isLit("c_finding", "c_finding", neighbors)).toBe(true);
  });

  it("a neighbor of the selection is lit", () => {
    const [aNeighbor] = neighbors;
    expect(aNeighbor).toBeDefined();
    expect(isLit(aNeighbor, "c_finding", neighbors)).toBe(true);
  });

  it("a non-neighbor, non-selected node is not lit", () => {
    const nonNeighbor = NODES.find((n) => n.id !== "c_finding" && !neighbors.has(n.id));
    expect(nonNeighbor).toBeDefined();
    expect(isLit(nonNeighbor!.id, "c_finding", neighbors)).toBe(false);
  });
});

describe("labelShift", () => {
  const label = "Vector embedding"; // 16 chars — the node observed clipping at 375px
  const half = (label.length * LABEL_CHAR_W) / 2;

  it("returns 0 for a label comfortably inside the canvas", () => {
    expect(labelShift(187, label, 375)).toBe(0);
  });

  it("shifts a left-edge label right so its left edge sits at the pad", () => {
    const center = 20; // half (49.6) overflows the left edge
    const shift = labelShift(center, label, 375);
    expect(shift).toBeGreaterThan(0);
    expect(center - half + shift).toBeCloseTo(LABEL_EDGE_PAD);
  });

  it("shifts a right-edge label left so its right edge sits at canvasW - pad", () => {
    const center = 370;
    const shift = labelShift(center, label, 375);
    expect(shift).toBeLessThan(0);
    expect(center + half + shift).toBeCloseTo(375 - LABEL_EDGE_PAD);
  });

  it("returns 0 before the canvas has been measured (width 0)", () => {
    expect(labelShift(20, label, 0)).toBe(0);
  });
});
