/**
 * delapan faceted-8 logomark: an eight-faceted amber octagon (eight → delapan)
 * with a beveled instrument-gem read. The amber trio mirrors the token accent
 * table (--accent / --accent-bright) — a brand asset, deliberately not themed.
 */

// octagon vertices (flat-top, R=44 about center 50,50) — 8 sides = eight
const V = [
  [90.65, 66.84],
  [66.84, 90.65],
  [33.16, 90.65],
  [9.35, 66.84],
  [9.35, 33.16],
  [33.16, 9.35],
  [66.84, 9.35],
  [90.65, 33.16],
] as const;

const AMBER = "#b45309";
const AMBER_BRIGHT = "#d97706";
const AMBER_DARK = "#92400e";

export function Logomark({ size = 34 }: { size?: number }) {
  const facets = V.map((v, i) => {
    const next = V[(i + 1) % V.length]!;
    return (
      <polygon
        key={i}
        points={`50,50 ${v[0]},${v[1]} ${next[0]},${next[1]}`}
        fill={i % 2 === 0 ? AMBER_BRIGHT : AMBER}
        opacity={0.92}
      />
    );
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="delapan"
      style={{ display: "block", flex: "none" }}
    >
      <g stroke="rgba(255,255,255,0.5)" strokeWidth={1.2} strokeLinejoin="round">
        {facets}
      </g>
      {/* dark faceted core */}
      <polygon
        points="65,50 57.5,62.99 42.5,62.99 35,50 42.5,37.01 57.5,37.01"
        fill={AMBER_DARK}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
      {/* octagon outline */}
      <polygon
        points={V.map((v) => v.join(",")).join(" ")}
        fill="none"
        stroke={AMBER_DARK}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
    </svg>
  );
}
