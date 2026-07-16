/**
 * Pure derivations over the findings list projection — no side effects, no DOM
 * (vitest runs node-env). Mirrors src/state/derive.ts.
 */

import type { FindingRow } from "../api/types";

/** Confidence at or above which a finding is treated as adversarially verified.
 *  Calibrated to the two writers in play: the deep-research ingest scores
 *  0.95/0.70, the explore pipeline ~0.2-0.4. A writer on a different scale would
 *  make the accent misleading — change it here, not at call sites. */
export const VERIFIED_MIN = 0.9;

export type Tier = "verified" | "unverified";

export function tierOf(confidence: number): Tier {
  return confidence >= VERIFIED_MIN ? "verified" : "unverified";
}

export interface Bin {
  lo: number;
  hi: number;
  count: number;
}

/** Histogram over confidence in [0, 1]. `binCount` buckets of equal width;
 *  confidence 1.0 lands in the last bin rather than falling off the end. */
export function bin(rows: FindingRow[], binCount: number): Bin[] {
  const width = 1 / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    lo: i * width,
    hi: (i + 1) * width,
    count: 0,
  }));
  for (const r of rows) {
    const c = Math.min(Math.max(r.confidence, 0), 1);
    const idx = Math.min(Math.floor(c / width), binCount - 1);
    bins[idx]!.count += 1;
  }
  return bins;
}

/** Inclusive on both ends — a brush that ends exactly on 0.9 must include the
 *  0.9 rows, else the verified tier can vanish at its own boundary. */
export function inRange(rows: FindingRow[], range: [number, number] | null): FindingRow[] {
  if (!range) return rows;
  const [lo, hi] = range;
  return rows.filter((r) => r.confidence >= lo && r.confidence <= hi);
}
