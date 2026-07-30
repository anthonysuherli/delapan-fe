// Ported from docs/handoff/landing-v2/_ds/.../_ds_bundle.js — components/core/Button.jsx
// (the `active` variant) composed with the two override sets from the
// "Landing Page v2" prototype (navCta / heroCta, lines 366-367), which pick
// between them via `style="{{ navCta }}"` / `style="{{ heroCta }}"` on the
// same DS Button. The prototype uses the pill as an <a> (nav CTA, hero CTA),
// so DsButton renders an anchor rather than Button's <button>.
import type { CSSProperties, JSX, ReactNode } from "react";

const base: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  fontFamily: "var(--dlpv2-font-mono)",
  fontSize: 11,
  letterSpacing: "0.04em",
  border: "1px solid var(--dlpv2-line)",
  borderRadius: "var(--dlpv2-radius)",
  background: "var(--dlpv2-bg2)",
  color: "var(--dlpv2-text-dim)",
  whiteSpace: "nowrap",
  cursor: "pointer",
  textDecoration: "none",
  transition:
    "color var(--dlpv2-t-fast), border-color var(--dlpv2-t-fast), background var(--dlpv2-t-fast), box-shadow var(--dlpv2-t-fast)",
};

// variant="active" — the lit/toggled amber pill.
const active: CSSProperties = {
  color: "var(--dlpv2-accent)",
  background: "var(--dlpv2-accent-dim)",
  borderColor: "var(--dlpv2-accent)",
  boxShadow: "0 0 14px rgba(180,83,9,0.16), inset 0 0 8px rgba(180,83,9,0.06)",
};

const navCta: CSSProperties = {
  fontFamily: "var(--dlpv2-font-mono)",
  fontSize: 11,
  padding: "7px 14px",
  borderRadius: "var(--dlpv2-radius-pill)",
};

const heroCta: CSSProperties = {
  fontSize: 13,
  padding: "13px 26px",
  borderRadius: "var(--dlpv2-radius-pill)",
  letterSpacing: ".03em",
};

const OVERRIDES: Record<"nav" | "hero", CSSProperties> = { nav: navCta, hero: heroCta };

export interface DsButtonProps {
  href: string;
  kind: "nav" | "hero";
  children: ReactNode;
}

export function DsButton({ href, kind, children }: DsButtonProps): JSX.Element {
  return (
    <a href={href} style={{ ...base, ...active, ...OVERRIDES[kind] }}>
      {children}
    </a>
  );
}
