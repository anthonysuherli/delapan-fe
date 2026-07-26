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

/**
 * Overflow glyphs. The colour ring is capped (distinct legible, CVD-safe hues
 * are scarce) but shapes are cheap, so every overflow type still gets its own
 * glyph even though it shares REST_COLOR for hue. REST_GLYPH is kept as the
 * first entry so existing callers of that export see unchanged behaviour for
 * the first overflow type. Distinct from each other and from all of GLYPHS.
 */
export const REST_GLYPHS: readonly string[] = ["○", "△", "□", "◈", "✦", "✚", "◌", "◐"];

/**
 * Preferred slots for delapan's default ontology, so a stock KB looks the same
 * on every boot. These are PREFERENCES, not reservations: a slot is only spent
 * when the type is actually present. Reserving them unconditionally starved
 * every domain KB — a schema of component/data_table/constraint/... would find
 * five of six hues already taken and render almost entirely in remainder grey.
 */
const BASE_SLOT: Record<string, number> = {
  concept: 0,
  technology: 1,
  person: 2,
  company: 3,
  project: 4,
};

const REMAINDER = -1;

const assigned = new Map<string, number>();
const takenSlots = new Set<number>();

const remainderAssigned = new Map<string, number>();
let nextRemainderSlot = 0;

function claim(type: string, slot: number): number {
  assigned.set(type, slot);
  if (slot !== REMAINDER) takenSlots.add(slot);
  return slot;
}

function slotOf(type: string): number {
  const existing = assigned.get(type);
  if (existing !== undefined) return existing;

  const preferred = BASE_SLOT[type];
  if (preferred !== undefined && !takenSlots.has(preferred)) return claim(type, preferred);

  for (let slot = 0; slot < RING.length; slot++) {
    if (!takenSlots.has(slot)) return claim(type, slot);
  }
  return claim(type, REMAINDER);
}

/**
 * Hand the colour ring to the types that actually exist, most frequent first,
 * so the scarce hues land on what dominates the graph and the remainder holds
 * the long tail. Types present in BASE_SLOT go first so a stock KB keeps its
 * canonical colours. Call once per graph load, before any typeColor lookup.
 */
export function primeChannels(typeCounts: Record<string, number>): void {
  resetAssignments();
  const types = Object.keys(typeCounts);
  const base = types
    .filter((t) => BASE_SLOT[t] !== undefined)
    .sort((a, b) => BASE_SLOT[a]! - BASE_SLOT[b]!);
  const rest = types
    .filter((t) => BASE_SLOT[t] === undefined)
    // count desc, then name asc so the assignment is stable across reloads
    .sort((a, b) => typeCounts[b]! - typeCounts[a]! || a.localeCompare(b));
  for (const t of [...base, ...rest]) slotOf(t);
}

/** Stable, wrapping glyph slot for a type that has overflowed the colour ring. */
function remainderGlyphSlot(type: string): number {
  let slot = remainderAssigned.get(type);
  if (slot === undefined) {
    slot = nextRemainderSlot % REST_GLYPHS.length;
    nextRemainderSlot++;
    remainderAssigned.set(type, slot);
  }
  return slot;
}

export function typeColor(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_COLOR : RING[slot]!;
}

export function typeGlyph(type: string): string {
  const slot = slotOf(type);
  return slot === REMAINDER ? REST_GLYPHS[remainderGlyphSlot(type)]! : GLYPHS[slot]!;
}

/** True when this type shares the overflow HUE. It may still have its own glyph. */
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
  takenSlots.clear();
  remainderAssigned.clear();
  nextRemainderSlot = 0;
}

/**
 * Non-categorical canvas palette (dim states, edge stroke, label ink, hover
 * card). WebGL/2D-canvas cannot read CSS custom properties, so this module is
 * the source of truth and tokens.css carries a --canvas-* mirror —
 * encoding.test.ts enforces the two never drift.
 */
export const CANVAS = {
  dimNode: "#d8e0ea",
  dimEdge: "#e6ebf2",
  edge: "#b3bfcf",
  edgeLabel: "#67788c",
  ink: "#465a70",
  inkStrong: "#1f2b3a",
  cardFill: "rgba(255, 255, 255, 0.95)",
} as const;
