import { COLS as MARK_COLS, ROWS as MARK_ROWS } from "../panels/Logomark";
import { cellUnit, fieldCells } from "./markFieldCells";

const FIELD_COLS = MARK_COLS * 5; // 25 — scaled off the mark's own 5-wide grid
const FIELD_ROWS = MARK_ROWS * 2; // 18 — scaled off the mark's own 9-tall grid
const CELL = 1;
const GAP = 0.18;
const S = CELL - GAP;
const RX = CELL * 0.16; // same ratio Logomark uses for its own corner radius
const MAX_DELAY_MS = 900;

interface MarkFieldProps {
  seed?: string;
}

/**
 * The hero's generative background: a deterministic scatter of tiny pixel-8
 * cells behind the h1, right half only. Purely decorative (aria-hidden) —
 * `fieldCells` (markField.ts) decides which cells appear; this just draws
 * them. Fill + opacity resolve through the `.mf-ink`/`.mf-coral` classes in
 * landing.css so the literal-scan governs the colors; the only inline value
 * here is the per-cell animation delay, itself derived from the same
 * deterministic hash that picked the cell's kind.
 */
export function MarkField({ seed = "delapan" }: MarkFieldProps) {
  const cells = fieldCells(FIELD_COLS, FIELD_ROWS, seed);
  return (
    <svg
      className="mf-field"
      aria-hidden="true"
      viewBox={`0 0 ${FIELD_COLS} ${FIELD_ROWS}`}
      preserveAspectRatio="xMidYMid slice"
    >
      {cells.map(({ x, y, kind }) => (
        <rect
          key={`${x}-${y}`}
          className={`mf-cell ${kind === "coral" ? "mf-coral" : "mf-ink"}`}
          x={x + GAP / 2}
          y={y + GAP / 2}
          width={S}
          height={S}
          rx={RX}
          style={{ animationDelay: `${Math.round(cellUnit(seed, x, y) * MAX_DELAY_MS)}ms` }}
        />
      ))}
    </svg>
  );
}
