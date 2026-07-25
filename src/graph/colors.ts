/**
 * Canvas colour constants. The type→channel mapping lives in ./encoding — this
 * module re-exports typeColor so existing import sites keep working, and owns
 * only the non-categorical canvas colours.
 */

export { typeColor, typeGlyph, isRemainder } from "./encoding";

export const DIM_NODE = "#d8e0ea";
export const DIM_EDGE = "#e6ebf2";
export const EDGE_COLOR = "#b3bfcf";

/** Chrome, used on canvas for the SELECTION RING only — never as a data hue. */
export const ACCENT = "#b45309";

export const VISITED_MIX = 0.45;

/** Mix a hex color toward white (amount 0..1) — used for the explored tint. */
export function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
