/**
 * Type → color mapping, consistent everywhere (canvas, legend, chips).
 * Known base types get fixed instrument hues; unknown types claim the next
 * free hue from the fallback ring, stable for the session.
 * Hues are mid-lightness/high-chroma so they hold on the light canvas.
 */

const BASE_COLORS: Record<string, string> = {
  concept: "#0284c7",
  technology: "#d97706",
  person: "#db2777",
  company: "#059669",
  project: "#7c3aed",
};

const FALLBACK_RING = ["#0d9488", "#a16207", "#ea580c", "#4f46e5", "#65a30d", "#c026d3"];

const assigned = new Map<string, string>();

export function typeColor(type: string): string {
  const base = BASE_COLORS[type];
  if (base) return base;
  let color = assigned.get(type);
  if (!color) {
    color = FALLBACK_RING[assigned.size % FALLBACK_RING.length];
    assigned.set(type, color);
  }
  return color;
}

export const DIM_NODE = "#d8e0ea";
export const DIM_EDGE = "#e6ebf2";
export const EDGE_COLOR = "#b3bfcf";
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
