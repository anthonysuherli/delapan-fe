// Ported from docs/handoff/landing-v2/_ds/.../_ds_bundle.js — components/brand/Logomark.jsx.
// Brilliant-cut faceted "8" — the delapan mark. Table + four bevels per lobe,
// lit from upper-left. Amber table core is the brand accent.
// SVG paths are copied EXACTLY from the bundle source — never redrawn, never
// recolored; the amber table core (#f59e0b) is the only brand color.
import type { JSX } from "react";

type LogomarkVariant = "light" | "dark" | "mono";

interface FacetPalette {
  tl: string;
  tr: string;
  bl: string;
  br: string;
  table: string;
  stroke: string;
}

const PAL: Record<LogomarkVariant, FacetPalette> = {
  light: { tl: "#eef1f6", tr: "#dbe2ec", bl: "#c9d2de", br: "#a7b4c6", table: "#f59e0b", stroke: "#93a1b6" },
  dark: { tl: "#4a5f7d", tr: "#3a4d68", bl: "#33455c", br: "#18212f", table: "#f59e0b", stroke: "#5a6f8d" },
  mono: {
    tl: "currentColor",
    tr: "currentColor",
    bl: "currentColor",
    br: "currentColor",
    table: "currentColor",
    stroke: "none",
  },
};

export interface LogomarkProps {
  variant?: LogomarkVariant;
  size?: number;
  title?: string;
}

export function Logomark({ variant = "light", size = 48, title }: LogomarkProps): JSX.Element {
  const p = PAL[variant];
  const w = size * (120 / 140);
  return (
    <svg
      viewBox="0 0 120 140"
      width={w}
      height={size}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : "true"}
    >
      {title ? <title>{title}</title> : null}
      <g>
        <polygon points="28,41 60,12 60,26 46,41" fill={p.tl} />
        <polygon points="60,12 92,41 74,41 60,26" fill={p.tr} />
        <polygon points="46,41 60,56 60,70 28,41" fill={p.bl} />
        <polygon points="74,41 92,41 60,70 60,56" fill={p.br} />
        <polygon points="60,26 74,41 60,56 46,41" fill={p.table} />
        <polygon points="28,99 60,70 60,84 46,99" fill={p.tl} />
        <polygon points="60,70 92,99 74,99 60,84" fill={p.tr} />
        <polygon points="46,99 60,114 60,128 28,99" fill={p.bl} />
        <polygon points="74,99 92,99 60,128 60,114" fill={p.br} />
        <polygon points="60,84 74,99 60,114 46,99" fill={p.table} />
        {p.stroke !== "none" ? (
          <g fill="none" stroke={p.stroke} strokeWidth="1.25" strokeLinejoin="miter">
            <polygon points="60,12 92,41 60,70 28,41" />
            <polygon points="60,70 92,99 60,128 28,99" />
            <line x1="28" y1="41" x2="92" y2="41" />
            <line x1="28" y1="99" x2="92" y2="99" />
            <polygon points="60,26 74,41 60,56 46,41" />
            <polygon points="60,84 74,99 60,114 46,99" />
          </g>
        ) : null}
      </g>
    </svg>
  );
}
