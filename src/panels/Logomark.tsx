/**
 * delapan brand mark — the locked pixel-8.
 *
 * Two square rings stacked share a middle bar; that intersection is the only
 * coral element and is what closes them into an 8. "Knowledge compounds where
 * things meet." The outer structure stays square — ordered, system-like.
 *
 * Geometry and palette are copied from the canonical source of truth,
 * `delapan-ai-site/frontend/components/brand/mark.tsx` + `docs/branding/`.
 * Brand rules: never recolor the figure, never drop the coral intersection,
 * never add shadows or effects. Full 5x9 mark holds down to 32px; below that
 * the brand calls for a compact 3x5 glyph, which this app does not need.
 */

/** [col, row, isIntersection] on a 5x9 grid. */
const P8_CELLS: [number, number, boolean][] = [
  // top ring — top bar
  [0, 0, false], [1, 0, false], [2, 0, false], [3, 0, false], [4, 0, false],
  // top ring — sides
  [0, 1, false], [4, 1, false],
  [0, 2, false], [4, 2, false],
  [0, 3, false], [4, 3, false],
  // the intersection: the only coral, the thing that makes it an 8
  [0, 4, true], [1, 4, true], [2, 4, true], [3, 4, true], [4, 4, true],
  // bottom ring — sides
  [0, 5, false], [4, 5, false],
  [0, 6, false], [4, 6, false],
  [0, 7, false], [4, 7, false],
  // bottom ring — bottom bar
  [0, 8, false], [1, 8, false], [2, 8, false], [3, 8, false], [4, 8, false],
];

const COLS = 5;
const ROWS = 9;
const GAP = 1.6;
const CELL = Math.min(100 / (COLS + 2), 100 / (ROWS + 2));
const GW = COLS * CELL;
const GH = ROWS * CELL;
const X0 = (100 - GW) / 2;
const Y0 = (100 - GH) / 2;
const S = CELL - GAP;
const RX = CELL * 0.16;

/**
 * `mode` picks the figure colour for the surface underneath: "ink" on light
 * (this app's daylight panel), "light" on dark. The bar is coral either way.
 */
export function Logomark({ size = 34, mode = "ink" }: { size?: number; mode?: "ink" | "light" }) {
  const figure = mode === "ink" ? "var(--brand-ink)" : "var(--brand-bone)";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="delapan"
      style={{ display: "block", flex: "none" }}
    >
      {P8_CELLS.map(([c, r, intersection]) => (
        <rect
          key={`${c}-${r}`}
          x={X0 + c * CELL + GAP / 2}
          y={Y0 + r * CELL + GAP / 2}
          width={S}
          height={S}
          rx={RX}
          fill={intersection ? "var(--brand-coral)" : figure}
        />
      ))}
    </svg>
  );
}
