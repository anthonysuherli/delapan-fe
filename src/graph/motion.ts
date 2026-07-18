/**
 * Sigma-driven graph motion: a one-shot boot "settle" (nodes fly in from a
 * shrunken layout) and a continuous low-amplitude ambient "drift".
 *
 *   base positions ──▶ per-frame base+offset ──▶ graph x/y ──▶ sigma re-renders
 *
 * sigma v3 node reducers cannot reposition nodes (x/y returned from a reducer
 * are ignored), so motion is applied by writing back to the graphology instance
 * each frame via updateEachNodeAttributes — sigma re-renders on that event.
 * Captured base positions are the source of truth; offsets are tiny, transient,
 * and never persisted (layout is client-side). External position changes (the
 * layout button, mutations) re-sync the base so drift never fights them. A
 * single rAF loop drives it and stops when idle. Respects reduced-motion.
 */

import { graph } from "./graphStore";

// three low-amplitude drift directions so nodes don't move in lockstep
const DRIFT_VARIANTS = [
  { dx: 4, dy: -5 },
  { dx: -5, dy: 3 },
  { dx: 3, dy: 5 },
] as const;

interface NodeMotion {
  base: { x: number; y: number };
  index: number;
  phase: number; // radians
  omega: number; // rad/ms → 5–8s period
  variant: number; // 0..2
}

const SETTLE_MS = 800;
const STAGGER_MS = 28;
const DRIFT_FRACTION = 0.0015; // amplitude as a fraction of the layout diagonal
const FRAME_MS = 40; // ~25fps paint throttle during drift
const SETTLE_FLOOR = 0.15; // never fully collapse (keeps a non-zero extent)

// ambient drift default-on; no settings UI (spec) — reduced-motion still wins
let ambientDrift = true;

let motionMap = new Map<string, NodeMotion>();
let centroid = { x: 0, y: 0 };
let amp = 0;
let settleStart = 0;
let settleDone = true;
let clock = 0;
let lastPaint = 0;
let raf = 0;
let running = false;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);

function reducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** The drift offset a node currently has applied (0 during settle / when off). */
function driftOffset(m: NodeMotion): { x: number; y: number } {
  if (!settleDone || !ambientDrift || reducedMotion()) return { x: 0, y: 0 };
  const v = DRIFT_VARIANTS[m.variant]!;
  const s = Math.sin(clock * m.omega + m.phase);
  return { x: v.dx * amp * s, y: v.dy * amp * s };
}

/**
 * (Re)capture base positions from the current graph. `strip` removes the drift
 * offset a node already carries so repeated re-syncs don't accumulate; `fresh`
 * assigns new per-node drift params (used on first init / scope change).
 */
function capture(strip: boolean, fresh: boolean): void {
  const ids = graph.nodes();
  const next = new Map<string, NodeMotion>();
  let sx = 0;
  let sy = 0;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  ids.forEach((id, i) => {
    const a = graph.getNodeAttributes(id);
    const prev = motionMap.get(id);
    let bx = a.x;
    let by = a.y;
    if (strip && prev) {
      const o = driftOffset(prev);
      bx -= o.x;
      by -= o.y;
    }
    next.set(id, {
      base: { x: bx, y: by },
      index: prev && !fresh ? prev.index : i,
      phase: prev && !fresh ? prev.phase : (i * 0.17 * Math.PI) % (Math.PI * 2),
      omega: prev && !fresh ? prev.omega : (2 * Math.PI) / ((5 + (i % 4)) * 1000),
      variant: prev && !fresh ? prev.variant : i % 3,
    });
    sx += bx;
    sy += by;
    minX = Math.min(minX, bx);
    maxX = Math.max(maxX, bx);
    minY = Math.min(minY, by);
    maxY = Math.max(maxY, by);
  });
  motionMap = next;
  if (ids.length > 0) {
    centroid = { x: sx / ids.length, y: sy / ids.length };
    amp = (Math.hypot(maxX - minX, maxY - minY) || 1) * DRIFT_FRACTION;
  }
}

/** Capture base positions + drift params, then begin the settle window. */
export function initGraphMotion(): void {
  capture(false, true);
  if (motionMap.size === 0) {
    settleDone = true;
    return;
  }
  if (reducedMotion()) {
    settleDone = true;
    return; // leave nodes at their base positions
  }
  settleStart = performance.now();
  settleDone = false;
  ensureRunning();
}

/** Re-sync base positions after an external graph change so drift never fights
 *  the layout button or mutations. Does not restart the settle. */
export function resyncGraphMotion(): void {
  if (!running || reducedMotion()) return;
  capture(true, false);
}

/** Cancel the loop and restore base positions (sigma teardown). */
export function stopGraphMotion(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  running = false;
  restoreBase();
}

// ---------------------------------------------------------------------------

function restoreBase(): void {
  if (motionMap.size === 0) return;
  graph.updateEachNodeAttributes(
    (id, attr) => {
      const m = motionMap.get(id);
      return m ? { ...attr, x: m.base.x, y: m.base.y } : attr;
    },
    { attributes: ["x", "y"] },
  );
}

function applyFrame(): void {
  const now = clock;
  graph.updateEachNodeAttributes(
    (id, attr) => {
      const m = motionMap.get(id);
      if (!m) return attr;
      if (!settleDone) {
        const p = easeOutCubic(clamp01((now - settleStart - m.index * STAGGER_MS) / SETTLE_MS));
        const f = SETTLE_FLOOR + (1 - SETTLE_FLOOR) * p;
        return {
          ...attr,
          x: centroid.x + (m.base.x - centroid.x) * f,
          y: centroid.y + (m.base.y - centroid.y) * f,
        };
      }
      const o = driftOffset(m);
      return { ...attr, x: m.base.x + o.x, y: m.base.y + o.y };
    },
    { attributes: ["x", "y"] },
  );
}

function tick(): void {
  clock = performance.now();
  if (!settleDone) {
    const maxDelay = (motionMap.size - 1) * STAGGER_MS;
    if (clock - settleStart > SETTLE_MS + maxDelay) settleDone = true;
  }
  // full-rate during settle; throttled once we're only drifting
  if (!settleDone || clock - lastPaint >= FRAME_MS) {
    lastPaint = clock;
    applyFrame();
  }
  const needMore = !settleDone || (ambientDrift && !reducedMotion());
  if (needMore) {
    raf = requestAnimationFrame(tick);
  } else {
    running = false;
    raf = 0;
    applyFrame(); // land exactly on base
  }
}

function ensureRunning(): void {
  if (running) return;
  running = true;
  lastPaint = 0;
  raf = requestAnimationFrame(tick);
}
