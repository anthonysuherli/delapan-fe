/**
 * Generative pixel-8 mark field — the hero's background texture. A deterministic
 * per-cell noise field: ~12% of cells render as faint "ink" grain, and a thin
 * horizontal band echoing the mark's own intersection row (derived from
 * Logomark's `P8_CELLS`/`ROWS`, not hardcoded) carries a further ~2% "coral"
 * grain. Every choice is driven by an FNV-1a hash of `${seed}:${x}:${y}` — the
 * same algorithm `graph/layout.ts` uses to seed node positions — so a given
 * seed always paints byte-identical output. No Math.random() anywhere.
 */
import { P8_CELLS, ROWS as MARK_ROWS } from "../panels/Logomark";

export type FieldCellKind = "ink" | "coral";

export interface FieldCell {
  x: number;
  y: number;
  kind: FieldCellKind;
}

const INK_RATE = 0.12;
const CORAL_RATE = 0.02;

/** FNV-1a, 32-bit — same algorithm as graph/layout.ts's seed hash. */
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** `hash(str)` normalized to [0, 1). Exported so the component can derive the
 *  same per-cell value for animation stagger without re-deciding cell kind. */
export function cellUnit(seed: string, x: number, y: number): number {
  return hash(`${seed}:${x}:${y}`) / 4294967296;
}

/** Row band (inclusive) where the mark's own intersection sits, proportionally
 *  mapped from Logomark's 5x9 grid onto the field's actual `rows`. */
function intersectionBand(rows: number): [number, number] {
  const intersectionRows = P8_CELLS.filter(([, , isIntersection]) => isIntersection).map(
    ([, r]) => r,
  );
  const markCenter = intersectionRows.reduce((a, b) => a + b, 0) / intersectionRows.length;
  const center = Math.round((markCenter / (MARK_ROWS - 1)) * (rows - 1));
  const halfWidth = Math.max(0, Math.round(rows / MARK_ROWS / 2));
  return [Math.max(0, center - halfWidth), Math.min(rows - 1, center + halfWidth)];
}

/** Deterministic ambient field for the hero background. Same (cols, rows, seed)
 *  always returns the same array; different seeds diverge. */
export function fieldCells(cols: number, rows: number, seed: string): FieldCell[] {
  const cells: FieldCell[] = [];
  const [bandLo, bandHi] = intersectionBand(rows);

  for (let y = 0; y < rows; y += 1) {
    const inBand = y >= bandLo && y <= bandHi;
    for (let x = 0; x < cols; x += 1) {
      const u = cellUnit(seed, x, y);
      if (inBand && u < CORAL_RATE) {
        cells.push({ x, y, kind: "coral" });
      } else if (u < INK_RATE) {
        cells.push({ x, y, kind: "ink" });
      }
    }
  }

  return cells;
}
