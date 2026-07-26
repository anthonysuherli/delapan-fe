/**
 * Pure math for the node-enter animation — planning, easing, staggering.
 * No DOM, no rAF, no graphology: the driver in ./motion.ts owns those.
 * Timings mirror motion.css: ENTER_MS = --t-rise, stagger matches settle.
 */

export const ENTER_MS = 500;
export const ENTER_STAGGER_MS = 28;
/** Above this many simultaneous enters, per-node staggers read as noise —
 *  the driver falls back to one full settle pass instead. */
export const ENTER_BATCH_MAX = 40;
const SIZE_FLOOR = 0.15;

export type EnterMode = "stagger" | "settle";

export interface EnterPlan {
  mode: EnterMode;
  ids: string[];
}

export function planEnter(ids: string[]): EnterPlan {
  return { mode: ids.length > ENTER_BATCH_MAX ? "settle" : "stagger", ids };
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

/** Eased 0..1 progress of the index-th entering node, `elapsed` ms in. */
export function enterProgress(elapsed: number, index: number): number {
  return easeOutCubic(clamp01((elapsed - index * ENTER_STAGGER_MS) / ENTER_MS));
}

export function lerpPos(
  from: { x: number; y: number },
  to: { x: number; y: number },
  p: number,
): { x: number; y: number } {
  return { x: from.x + (to.x - from.x) * p, y: from.y + (to.y - from.y) * p };
}

/** Node size during a sourceless (scale-in) enter. */
export function enterSize(target: number, p: number): number {
  return target * (SIZE_FLOOR + (1 - SIZE_FLOOR) * p);
}

export function enterDone(elapsed: number, count: number): boolean {
  return elapsed >= ENTER_MS + Math.max(0, count - 1) * ENTER_STAGGER_MS;
}
