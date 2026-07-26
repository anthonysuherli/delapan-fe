import { describe, expect, it } from "vitest";
import {
  ENTER_BATCH_MAX,
  ENTER_MS,
  ENTER_STAGGER_MS,
  enterDone,
  enterProgress,
  enterSize,
  lerpPos,
  planEnter,
} from "./enterMotion";

const ids = (n: number) => Array.from({ length: n }, (_, i) => `n-${i}`);

describe("planEnter batch guard", () => {
  it("staggers small batches", () => {
    expect(planEnter(ids(1)).mode).toBe("stagger");
    expect(planEnter(ids(ENTER_BATCH_MAX)).mode).toBe("stagger");
  });

  it("falls back to a full settle above the cap", () => {
    expect(planEnter(ids(ENTER_BATCH_MAX + 1)).mode).toBe("settle");
  });

  it("passes ids through untouched", () => {
    expect(planEnter(["a", "b"]).ids).toEqual(["a", "b"]);
  });
});

describe("enterProgress", () => {
  it("starts at 0 and ends at 1", () => {
    expect(enterProgress(0, 0)).toBe(0);
    expect(enterProgress(ENTER_MS, 0)).toBe(1);
  });

  it("holds a staggered node at 0 until its slot", () => {
    expect(enterProgress(ENTER_STAGGER_MS - 1, 1)).toBe(0);
    expect(enterProgress(ENTER_STAGGER_MS + ENTER_MS, 1)).toBe(1);
  });

  it("is monotonic", () => {
    let prev = -1;
    for (let t = 0; t <= ENTER_MS; t += 50) {
      const p = enterProgress(t, 0);
      expect(p).toBeGreaterThanOrEqual(prev);
      prev = p;
    }
  });
});

describe("lerpPos / enterSize", () => {
  it("lerp hits both endpoints", () => {
    const from = { x: 0, y: 10 };
    const to = { x: 100, y: -10 };
    expect(lerpPos(from, to, 0)).toEqual(from);
    expect(lerpPos(from, to, 1)).toEqual(to);
    expect(lerpPos(from, to, 0.5)).toEqual({ x: 50, y: 0 });
  });

  it("size scales from the floor to the target", () => {
    expect(enterSize(8, 0)).toBeCloseTo(1.2); // 0.15 × target
    expect(enterSize(8, 1)).toBe(8);
  });
});

describe("enterDone", () => {
  it("accounts for the last node's stagger", () => {
    expect(enterDone(ENTER_MS - 1, 1)).toBe(false);
    expect(enterDone(ENTER_MS, 1)).toBe(true);
    expect(enterDone(ENTER_MS + 2 * ENTER_STAGGER_MS - 1, 3)).toBe(false);
    expect(enterDone(ENTER_MS + 2 * ENTER_STAGGER_MS, 3)).toBe(true);
  });
});
