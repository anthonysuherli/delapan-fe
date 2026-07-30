// Ported from docs/handoff/landing-v2/_ds/.../_ds_bundle.js — components/graph/TypeChip.jsx,
// with its typeColor()/TypeDot dependency (components/graph/TypeDot.jsx) inlined
// since only TypeChip is in this task's component list. The fixed-palette hues
// resolve through --dlpv2-type-* tokens; the hashed fallback for off-schema
// types is prop-derived (computed from `type`) and stays a raw hex ring, same
// as the bundle source.
import type { CSSProperties, JSX } from "react";

const TYPE_COLORS: Record<string, string> = {
  concept: "var(--dlpv2-type-concept)",
  technology: "var(--dlpv2-type-technology)",
  person: "var(--dlpv2-type-person)",
  company: "var(--dlpv2-type-company)",
  project: "var(--dlpv2-type-project)",
};

const RING = ["#0d9488", "#a16207", "#ea580c", "#4f46e5", "#65a30d", "#c026d3"];

function typeColor(type: string): string {
  if (TYPE_COLORS[type]) return TYPE_COLORS[type];
  let h = 0;
  for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) >>> 0;
  return RING[h % RING.length];
}

export interface TypeChipProps {
  type: string;
}

export function TypeChip({ type }: TypeChipProps): JSX.Element {
  const t = type.toLowerCase();
  const color = typeColor(t);
  const chipStyle: CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 5,
    padding: "1px 7px",
    fontFamily: "var(--dlpv2-font-mono)",
    fontSize: 10,
    letterSpacing: "0.05em",
    textTransform: "uppercase",
    border: "1px solid",
    borderColor: color,
    color,
    borderRadius: 999,
    background: "rgba(255,255,255,0.6)",
  };
  const dotStyle: CSSProperties = {
    display: "inline-block",
    width: 8,
    height: 8,
    borderRadius: 2,
    flex: "none",
    background: color,
  };
  return (
    <span style={chipStyle}>
      <span style={dotStyle} />
      {t}
    </span>
  );
}
