/**
 * Type → visual channel mapping. Every type carries TWO channels: a hue and a
 * glyph. Hue alone fails the ~8% of men with a colour-vision deficiency, so the
 * glyph is the load-bearing channel and the hue is the fast one.
 *
 * The ring is CVD-safe and capped — any type past it falls onto a shared
 * remainder channel that the legend reports rather than silently truncating.
 *
 * Invariants live in encoding.test.ts. This module is the single source for the
 * pair; canvas, legend, and inspector all read it so they cannot drift apart.
 */

export interface TypeChannel {
  type: string;
  color: string;
  glyph: string;
}

/** Brand chrome. Illegal in a data channel — asserted in encoding.test.ts. */
export const CHROME: readonly string[] = ["#b45309", "#d97706"];

/**
 * CVD-safe categorical ring, Okabe-Ito where usable on light paper.
 * Okabe-Ito orange (#E69F00) and vermillion (#D55E00) are excluded: they
 * collide with chrome amber. Yellow (#F0E442) is excluded: illegible on #f5f7fa.
 */
export const RING: readonly string[] = [
  "#0072B2", // blue
  "#009E73", // bluish green
  "#CC79A7", // reddish purple
  "#762A83", // purple
  "#0E7490", // teal
  "#56B4E9", // sky blue
];

export const GLYPHS: readonly string[] = ["■", "▲", "●", "◆", "▬", "◇"];

/** The shared overflow channel. Reported by the legend, never silent. */
export const REST_COLOR = "#8595a9";
export const REST_GLYPH = "○";

/** Fixed slots, so the panel looks the same on every boot. */
const BASE_SLOT: Record<string, number> = {
  concept: 0,
  technology: 1,
  person: 2,
  company: 3,
  project: 4,
};

const REMAINDER = -1;

const assigned = new Map<string, number>();
let nextSlot = Object.keys(BASE_SLOT).length;

function slotOf(type: string): number {
  const base = BASE_SLOT[type];
  if (base !== undefined) return base;
  let slot = assigned.get(type);
  if (slot === undefined) {
    slot = nextSlot < RING.length ? nextSlot++ : REMAINDER;
    assigned.set(type, slot);
  }
  return slot;
}

export function typeColor(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_COLOR : RING[slot]!;
}

export function typeGlyph(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_GLYPH : GLYPHS[slot]!;
}

/** True when this type shares the overflow channel — the legend must say so. */
export function isRemainder(type: string): boolean {
  return slotOf(type) === REMAINDER;
}

/** Total distinct channels, remainder included. Capped at 8 by the guideline. */
export function channelCount(): number {
  return RING.length + 1;
}

/** Test-only: Vitest keeps module state across cases in a file. */
export function resetAssignments(): void {
  assigned.clear();
  nextSlot = Object.keys(BASE_SLOT).length;
}
