// Ported from docs/handoff/landing-v2/_ds/.../_ds_bundle.js — components/feedback/VerdictBand.jsx.
// Coverage verdict band — the big colored rich/sparse/gap readout, wrapping a
// preamble block below it. `children` is required per this task's interface
// (the bundle source treats it as optional and skips the <pre> when absent).
import type { CSSProperties, JSX, ReactNode } from "react";

type Coverage = "rich" | "sparse" | "gap";

const COPY: Record<Coverage, string> = {
  rich: "KB can answer",
  sparse: "partial grounding",
  gap: "needs exploration",
};

const HUE: Record<Coverage, string> = {
  rich: "var(--dlpv2-rich)",
  sparse: "var(--dlpv2-sparse)",
  gap: "var(--dlpv2-gap)",
};

export interface VerdictBandProps {
  coverage: Coverage;
  note: string;
  children: ReactNode;
}

export function VerdictBand({ coverage, note, children }: VerdictBandProps): JSX.Element {
  const wrapStyle: CSSProperties = {
    borderRadius: "var(--dlpv2-radius)",
    overflow: "hidden",
    border: "1px solid var(--dlpv2-line)",
  };
  const headerStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 10px",
    fontFamily: "var(--dlpv2-font-display)",
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: "0.22em",
    textTransform: "uppercase",
    color: "var(--dlpv2-bg0)",
    background: HUE[coverage],
  };
  const noteStyle: CSSProperties = {
    fontFamily: "var(--dlpv2-font-mono)",
    fontSize: 9,
    letterSpacing: "0.05em",
    fontWeight: 500,
  };
  const bodyStyle: CSSProperties = {
    maxHeight: 140,
    overflowY: "auto",
    margin: 0,
    padding: "8px 10px",
    fontFamily: "var(--dlpv2-font-mono)",
    fontSize: 10,
    lineHeight: 1.55,
    color: "var(--dlpv2-text-dim)",
    background: "var(--dlpv2-bg0)",
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  };
  return (
    <div style={wrapStyle}>
      <div style={headerStyle}>
        {coverage}
        <small style={noteStyle}>{note != null ? note : COPY[coverage]}</small>
      </div>
      <pre style={bodyStyle}>{children}</pre>
    </div>
  );
}
