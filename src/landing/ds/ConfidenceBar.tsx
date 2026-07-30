// Ported from docs/handoff/landing-v2/_ds/.../_ds_bundle.js — components/data/ConfidenceBar.jsx.
// A thin confidence meter (0..1). This task's interface drops `verified` and
// `showValue` (unused by the landing prototype — it only ever passes
// value/width), so the fill is always the default unverified --text-faint
// hue and no printed value renders, matching the bundle's default behavior.
// Marked aria-hidden: it's a decorative meter with no accessible text form.
import type { CSSProperties, JSX } from "react";

export interface ConfidenceBarProps {
  value: number;
  width?: number;
}

export function ConfidenceBar({ value, width = 46 }: ConfidenceBarProps): JSX.Element {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  const trackStyle: CSSProperties = {
    position: "relative",
    width,
    height: 4,
    background: "var(--dlpv2-bg3)",
    borderRadius: 2,
    overflow: "hidden",
    display: "block",
  };
  const fillStyle: CSSProperties = {
    position: "absolute",
    inset: "0 auto 0 0",
    width: `${pct}%`,
    background: "var(--dlpv2-text-faint)",
    borderRadius: 2,
  };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }} aria-hidden="true">
      <span style={trackStyle}>
        <i style={fillStyle} />
      </span>
    </span>
  );
}
