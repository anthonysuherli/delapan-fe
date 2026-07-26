/**
 * The token scales exist and keep their contract shapes. Companion to
 * encoding.test.ts (which owns the data-palette mirror); this file owns the
 * effect/geometry/motion scales added by the 2026-07-26 UI-polish spec.
 */
import { describe, expect, it } from "vitest";
import tokensCss from "./tokens.css?raw";
import motionCss from "./motion.css?raw";

const has = (css: string, decl: RegExp) => decl.test(css);

describe("effect tokens", () => {
  it("declares the amber glow ladder as rgba colours", () => {
    for (const n of [1, 2, 3]) {
      expect(has(tokensCss, new RegExp(`--glow-${n}:\\s*rgba\\(180, 83, 9,`))).toBe(true);
    }
  });

  it("declares the four-step elevation scale plus the drawer directional", () => {
    for (const n of [1, 2, 3, 4]) {
      expect(has(tokensCss, new RegExp(`--shadow-${n}:`))).toBe(true);
    }
    expect(has(tokensCss, /--shadow-drawer:\s*-18px/)).toBe(true);
  });

  it("declares the card veil", () => {
    expect(has(tokensCss, /--card-veil:\s*rgba\(255, 255, 255, 0\.6\)/)).toBe(true);
  });
});

describe("geometry tokens", () => {
  it("declares the radius scale and aliases --radius onto it", () => {
    expect(has(tokensCss, /--r-1:\s*2px/)).toBe(true);
    expect(has(tokensCss, /--r-2:\s*4px/)).toBe(true);
    expect(has(tokensCss, /--r-3:\s*6px/)).toBe(true);
    expect(has(tokensCss, /--r-pill:\s*999px/)).toBe(true);
    expect(has(tokensCss, /--radius:\s*var\(--r-2\)/)).toBe(true);
  });

  it("declares the cross-surface z bands in ascending order", () => {
    const bands = ["--z-search", "--z-drawer", "--z-modal", "--z-toast", "--z-boot"];
    const values = bands.map((b) => {
      const m = tokensCss.match(new RegExp(`${b}:\\s*(\\d+);`));
      expect(m, `${b} must be declared as a bare integer`).not.toBeNull();
      return Number(m![1]);
    });
    for (let i = 1; i < values.length; i++) expect(values[i]!).toBeGreaterThan(values[i - 1]!);
  });
});

describe("motion tokens", () => {
  it("declares the micro/press/pop/enter/exit durations", () => {
    expect(has(motionCss, /--t-micro:\s*120ms/)).toBe(true);
    expect(has(motionCss, /--t-press:\s*90ms/)).toBe(true);
    expect(has(motionCss, /--t-pop:\s*160ms/)).toBe(true);
    expect(has(motionCss, /--t-enter:\s*240ms/)).toBe(true);
    expect(has(motionCss, /--t-exit:\s*180ms/)).toBe(true);
  });

  it("keeps enters longer than exits (spec invariant)", () => {
    const ms = (name: string) => Number(motionCss.match(new RegExp(`${name}:\\s*(\\d+)ms`))![1]);
    expect(ms("--t-enter")).toBeGreaterThan(ms("--t-exit"));
  });

  it("declares the standard ease-out", () => {
    expect(has(motionCss, /--ease-out:\s*cubic-bezier\(0\.16, 1, 0\.3, 1\)/)).toBe(true);
  });
});
