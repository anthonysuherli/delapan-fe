/* @ds-bundle: {"format":4,"namespace":"DelapanDesignSystem_a684d2","components":[{"name":"Logomark","sourcePath":"components/brand/Logomark.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Kbd","sourcePath":"components/core/Kbd.jsx"},{"name":"SectionTitle","sourcePath":"components/core/SectionTitle.jsx"},{"name":"ConfidenceBar","sourcePath":"components/data/ConfidenceBar.jsx"},{"name":"Counter","sourcePath":"components/data/Counter.jsx"},{"name":"EvidenceItem","sourcePath":"components/data/EvidenceItem.jsx"},{"name":"PhaseStep","sourcePath":"components/feedback/PhaseStep.jsx"},{"name":"Spinner","sourcePath":"components/feedback/Spinner.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"VerdictBand","sourcePath":"components/feedback/VerdictBand.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"LegendRow","sourcePath":"components/graph/LegendRow.jsx"},{"name":"Relation","sourcePath":"components/graph/Relation.jsx"},{"name":"TypeChip","sourcePath":"components/graph/TypeChip.jsx"},{"name":"TYPE_COLORS","sourcePath":"components/graph/TypeDot.jsx"},{"name":"TypeDot","sourcePath":"components/graph/TypeDot.jsx"}],"sourceHashes":{"components/brand/Logomark.jsx":"527ca2e68f82","components/core/Button.jsx":"b80d17f4556a","components/core/Kbd.jsx":"2b948746c54d","components/core/SectionTitle.jsx":"62a4d52da0b1","components/data/ConfidenceBar.jsx":"81f335eeb4c8","components/data/Counter.jsx":"100fcc3736ef","components/data/EvidenceItem.jsx":"d4616b8bc1a0","components/feedback/PhaseStep.jsx":"72e5f840ae0a","components/feedback/Spinner.jsx":"b148f84eabb3","components/feedback/Toast.jsx":"8dce1fedd488","components/feedback/VerdictBand.jsx":"5339fa8c2197","components/forms/Input.jsx":"b8cc5c4d44cb","components/forms/Select.jsx":"3e5aecaa7538","components/graph/LegendRow.jsx":"330e48c20cc9","components/graph/Relation.jsx":"4bca234d7266","components/graph/TypeChip.jsx":"37870c1f043d","components/graph/TypeDot.jsx":"d1c47db35a0b","ui_kits/control-panel/ControlPanel.jsx":"4d5fcd0a2b60","ui_kits/control-panel/FindingDrawer.jsx":"c53e9a801b2f","ui_kits/control-panel/GraphCanvas.jsx":"9a5f61fb1f65","ui_kits/control-panel/Inspector.jsx":"2253fcc76278","ui_kits/control-panel/LeftRail.jsx":"dd9550dad003","ui_kits/control-panel/data.js":"fab91b9a5d60"},"inlinedExternals":[],"unexposedExports":[{"name":"typeColor","sourcePath":"components/graph/TypeDot.jsx"}]} */

(() => {

const __ds_ns = (window.DelapanDesignSystem_a684d2 = window.DelapanDesignSystem_a684d2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/brand/Logomark.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
// Brilliant-cut faceted "8" — the delapan mark. Table + four bevels per lobe,
// lit from upper-left. Amber table core is the brand accent.
const PAL = {
  light: {
    tl: "#eef1f6",
    tr: "#dbe2ec",
    bl: "#c9d2de",
    br: "#a7b4c6",
    table: "#f59e0b",
    stroke: "#93a1b6",
    ink: "#1f2b3a",
    sub: "#8595a9"
  },
  dark: {
    tl: "#4a5f7d",
    tr: "#3a4d68",
    bl: "#33455c",
    br: "#18212f",
    table: "#f59e0b",
    stroke: "#5a6f8d",
    ink: "#f5f7fa",
    sub: "#8595a9"
  },
  mono: {
    tl: "currentColor",
    tr: "currentColor",
    bl: "currentColor",
    br: "currentColor",
    table: "currentColor",
    stroke: "none",
    ink: "currentColor",
    sub: "currentColor"
  }
};
function Mark({
  p
}) {
  return /*#__PURE__*/React.createElement("g", null, /*#__PURE__*/React.createElement("polygon", {
    points: "28,41 60,12 60,26 46,41",
    fill: p.tl
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,12 92,41 74,41 60,26",
    fill: p.tr
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "46,41 60,56 60,70 28,41",
    fill: p.bl
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "74,41 92,41 60,70 60,56",
    fill: p.br
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,26 74,41 60,56 46,41",
    fill: p.table
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "28,99 60,70 60,84 46,99",
    fill: p.tl
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,70 92,99 74,99 60,84",
    fill: p.tr
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "46,99 60,114 60,128 28,99",
    fill: p.bl
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "74,99 92,99 60,128 60,114",
    fill: p.br
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,84 74,99 60,114 46,99",
    fill: p.table
  }), p.stroke !== "none" && /*#__PURE__*/React.createElement("g", {
    fill: "none",
    stroke: p.stroke,
    strokeWidth: "1.25",
    strokeLinejoin: "miter"
  }, /*#__PURE__*/React.createElement("polygon", {
    points: "60,12 92,41 60,70 28,41"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,70 92,99 60,128 28,99"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "28",
    y1: "41",
    x2: "92",
    y2: "41"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "28",
    y1: "99",
    x2: "92",
    y2: "99"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,26 74,41 60,56 46,41"
  }), /*#__PURE__*/React.createElement("polygon", {
    points: "60,84 74,99 60,114 46,99"
  })));
}

/**
 * The delapan logo. `mark` = the faceted 8 alone; `lockup` = mark + wordmark
 * + descriptor. variant light (default) / dark / mono (inherits currentColor).
 */
function Logomark({
  variant = "light",
  lockup = false,
  size = 48,
  descriptor = "grounding engine",
  style,
  ...rest
}) {
  const p = PAL[variant] || PAL.light;
  if (!lockup) {
    const w = size * (120 / 140);
    return /*#__PURE__*/React.createElement("svg", _extends({
      viewBox: "0 0 120 140",
      width: w,
      height: size,
      style: style,
      role: "img",
      "aria-label": "delapan"
    }, rest), /*#__PURE__*/React.createElement(Mark, {
      p: p
    }));
  }
  const h = size;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: h * 0.34,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("svg", {
    viewBox: "0 0 120 140",
    width: h * (120 / 140),
    height: h,
    role: "img",
    "aria-label": "delapan"
  }, /*#__PURE__*/React.createElement(Mark, {
    p: p
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      lineHeight: 1
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-display)",
      fontWeight: 700,
      fontSize: h * 0.82,
      letterSpacing: "0.06em",
      color: p.ink
    }
  }, "delapan"), descriptor && /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-mono)",
      fontSize: Math.max(9, h * 0.16),
      letterSpacing: "0.3em",
      textTransform: "uppercase",
      color: p.sub,
      marginTop: h * 0.13
    }
  }, descriptor)));
}
Object.assign(__ds_scope, { Logomark });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/brand/Logomark.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "5px 10px",
  fontFamily: "var(--font-mono)",
  fontSize: 11,
  letterSpacing: "0.04em",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  background: "var(--bg2)",
  color: "var(--text-dim)",
  whiteSpace: "nowrap",
  cursor: "pointer",
  transition: "color var(--t-fast), border-color var(--t-fast), background var(--t-fast), box-shadow var(--t-fast)"
};
const variants = {
  default: {},
  accent: {
    color: "var(--accent)",
    borderColor: "rgba(180,83,9,0.35)"
  },
  active: {
    color: "var(--accent)",
    background: "var(--accent-dim)",
    borderColor: "var(--accent)",
    boxShadow: "0 0 14px rgba(180,83,9,0.16), inset 0 0 8px rgba(180,83,9,0.06)"
  },
  danger: {
    color: "var(--text-dim)"
  },
  ghost: {
    background: "transparent",
    borderColor: "transparent"
  }
};

/**
 * The delapan control button — a monospace, uppercase-tracked instrument key.
 * Variants: default, accent (amber annunciator), active (lit/toggled),
 * danger (destructive), ghost (borderless until hover).
 */
function Button({
  variant = "default",
  active = false,
  disabled = false,
  children,
  style,
  ...rest
}) {
  const v = active ? variants.active : variants[variant] || variants.default;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    disabled: disabled,
    style: {
      ...base,
      ...v,
      ...(disabled ? {
        opacity: 0.4,
        cursor: "default"
      } : null),
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/Kbd.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A keycap — small mono glyph for keyboard shortcut hints. */
function Kbd({
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-block",
      padding: "0 5px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      lineHeight: "16px",
      color: "var(--text-dim)",
      background: "var(--bg3)",
      border: "1px solid var(--line-bright)",
      borderBottomWidth: 2,
      borderRadius: 3,
      verticalAlign: "middle",
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Kbd });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Kbd.jsx", error: String((e && e.message) || e) }); }

// components/core/SectionTitle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Uppercase display section title with an optional right-aligned mono aux note.
 * The header pattern that opens every panel section.
 */
function SectionTitle({
  children,
  aux,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h2", _extends({
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      margin: "0 0 8px",
      fontFamily: "var(--font-display)",
      fontSize: 14,
      fontWeight: 600,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-dim)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", null, children), aux != null && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: 0,
      textTransform: "none",
      color: "var(--text-faint)"
    }
  }, aux));
}
Object.assign(__ds_scope, { SectionTitle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SectionTitle.jsx", error: String((e && e.message) || e) }); }

// components/data/ConfidenceBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A thin confidence meter (0..1). Amber when verified, faint otherwise. */
function ConfidenceBar({
  value = 0,
  verified = false,
  width = 46,
  showValue = false,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width,
      height: 4,
      background: "var(--bg3)",
      borderRadius: 2,
      overflow: "hidden",
      display: "block"
    }
  }, /*#__PURE__*/React.createElement("i", {
    style: {
      position: "absolute",
      inset: "0 auto 0 0",
      width: `${pct}%`,
      background: verified ? "var(--accent)" : "var(--text-faint)",
      borderRadius: 2
    }
  })), showValue && /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--text-dim)"
    }
  }, value.toFixed(2)));
}
Object.assign(__ds_scope, { ConfidenceBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/ConfidenceBar.jsx", error: String((e && e.message) || e) }); }

// components/data/Counter.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A big tabular stat readout: value over an uppercase label. */
function Counter({
  value,
  label,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      padding: "8px 10px",
      background: "var(--bg0)",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("b", {
    style: {
      display: "block",
      fontFamily: "var(--font-mono)",
      fontSize: 20,
      fontWeight: 600,
      color: "var(--text)",
      fontVariantNumeric: "tabular-nums",
      lineHeight: 1.1
    }
  }, value), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, label));
}
Object.assign(__ds_scope, { Counter });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/Counter.jsx", error: String((e && e.message) || e) }); }

// components/data/EvidenceItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * An evidence card in the inspector — a finding's title, category, confidence,
 * and source count. Hover lights the amber border.
 */
function EvidenceItem({
  title,
  category,
  confidence = 0,
  sources,
  verified = false,
  style,
  ...rest
}) {
  const [h, setH] = React.useState(false);
  return /*#__PURE__*/React.createElement("button", _extends({
    onMouseEnter: () => setH(true),
    onMouseLeave: () => setH(false),
    style: {
      display: "block",
      width: "100%",
      textAlign: "left",
      padding: "8px 9px",
      marginBottom: 6,
      background: "var(--bg0)",
      border: `1px solid ${h ? "var(--accent)" : "var(--line)"}`,
      borderRadius: "var(--radius)",
      cursor: "pointer",
      transition: "border-color var(--t-fast)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 11.5,
      fontWeight: 500,
      color: "var(--text)",
      marginBottom: 4
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--text-faint)"
    }
  }, category && /*#__PURE__*/React.createElement("span", {
    style: {
      textTransform: "uppercase",
      letterSpacing: "0.08em"
    }
  }, category), /*#__PURE__*/React.createElement(__ds_scope.ConfidenceBar, {
    value: confidence,
    verified: verified,
    width: 46
  }), sources != null && /*#__PURE__*/React.createElement("span", null, sources, " src")));
}
Object.assign(__ds_scope, { EvidenceItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/EvidenceItem.jsx", error: String((e && e.message) || e) }); }

// components/feedback/PhaseStep.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const STATE = {
  pending: {
    tick: "·",
    color: "var(--text-dim)"
  },
  active: {
    tick: "▸",
    color: "var(--accent)"
  },
  done: {
    tick: "✓",
    color: "var(--text-faint)"
  },
  error: {
    tick: "✕",
    color: "var(--red)"
  }
};

/** One step of the explore pipeline log: planning → searching → … → completed. */
function PhaseStep({
  label,
  state = "pending",
  message,
  style,
  ...rest
}) {
  const s = STATE[state] || STATE.pending;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: s.color,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      textAlign: "center"
    }
  }, s.tick), label, state === "active" && message ? ` — ${message}` : "");
}
Object.assign(__ds_scope, { PhaseStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/PhaseStep.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Spinner.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A thin amber spinner ring. */
function Spinner({
  size = 10,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-block",
      width: size,
      height: size,
      border: "1.5px solid var(--line-bright)",
      borderTopColor: "var(--accent)",
      borderRadius: "50%",
      animation: "dlpn-spin 0.8s linear infinite",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("style", null, "@keyframes dlpn-spin{to{transform:rotate(360deg)}}"));
}
Object.assign(__ds_scope, { Spinner });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Spinner.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ACCENT = {
  info: "var(--cyan)",
  success: "var(--green)",
  error: "var(--red)"
};

/** Auto-dismiss-style notification chip with a colored left edge. */
function Toast({
  kind = "info",
  children,
  onDismiss,
  action,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 12px",
      fontSize: 12,
      color: "var(--text)",
      background: "var(--bg2)",
      border: "1px solid var(--line-bright)",
      borderLeft: `3px solid ${ACCENT[kind] || "var(--text-faint)"}`,
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow-pop)",
      maxWidth: 360,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1
    }
  }, children), action, onDismiss && /*#__PURE__*/React.createElement("button", {
    onClick: onDismiss,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-faint)",
      fontFamily: "var(--font-mono)"
    }
  }, "\xD7"));
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/VerdictBand.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const COPY = {
  rich: "KB can answer",
  sparse: "partial grounding",
  gap: "needs exploration"
};
const HUE = {
  rich: "var(--rich)",
  sparse: "var(--sparse)",
  gap: "var(--gap)"
};

/**
 * Coverage verdict band — the big colored rich/sparse/gap readout, optionally
 * wrapping a preamble block below it.
 */
function VerdictBand({
  coverage = "rich",
  note,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      borderRadius: "var(--radius)",
      overflow: "hidden",
      border: "1px solid var(--line)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "5px 10px",
      fontFamily: "var(--font-display)",
      fontSize: 15,
      fontWeight: 700,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: "var(--bg0)",
      background: HUE[coverage]
    }
  }, coverage, /*#__PURE__*/React.createElement("small", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.05em",
      fontWeight: 500
    }
  }, note != null ? note : COPY[coverage])), children != null && /*#__PURE__*/React.createElement("pre", {
    style: {
      maxHeight: 140,
      overflowY: "auto",
      margin: 0,
      padding: "8px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      lineHeight: 1.55,
      color: "var(--text-dim)",
      background: "var(--bg0)",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word"
    }
  }, children));
}
Object.assign(__ds_scope, { VerdictBand });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/VerdictBand.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const base = {
  width: "100%",
  padding: "5px 8px",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text)",
  background: "var(--bg0)",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color var(--t-fast), box-shadow var(--t-fast)"
};

/**
 * Monospace field input. Amber focus ring. Full-width by default.
 */
function Input({
  style,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("input", _extends({
    style: {
      ...base,
      ...(f ? {
        borderColor: "var(--accent)",
        boxShadow: "0 0 0 1px rgba(180,83,9,0.25)"
      } : null),
      ...style
    },
    onFocus: e => {
      setF(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setF(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const caret = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='6'%3E%3Cpath d='M0 0l4 6 4-6z' fill='%2355677c'/%3E%3C/svg%3E\")";
const base = {
  width: "100%",
  padding: "5px 22px 5px 8px",
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--text)",
  background: "var(--bg0)",
  backgroundImage: caret,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 8px center",
  border: "1px solid var(--line)",
  borderRadius: "var(--radius)",
  outline: "none",
  appearance: "none",
  boxSizing: "border-box",
  transition: "border-color var(--t-fast), box-shadow var(--t-fast)"
};

/** Monospace dropdown with a custom caret and amber focus ring. */
function Select({
  style,
  children,
  ...rest
}) {
  const [f, setF] = React.useState(false);
  return /*#__PURE__*/React.createElement("select", _extends({
    style: {
      ...base,
      ...(f ? {
        borderColor: "var(--accent)",
        boxShadow: "0 0 0 1px rgba(180,83,9,0.25)"
      } : null),
      ...style
    },
    onFocus: e => {
      setF(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setF(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/graph/Relation.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A relation pill: "renders ×5" — verb-phrase relation with its edge count. */
function Relation({
  relation,
  count,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      padding: "1px 6px",
      fontFamily: "var(--font-mono)",
      fontSize: 9.5,
      color: "var(--text-dim)",
      background: "var(--bg2)",
      border: "1px solid var(--line)",
      borderRadius: 999,
      ...style
    }
  }, rest), relation, count != null && /*#__PURE__*/React.createElement("i", {
    style: {
      color: "var(--text-faint)",
      fontStyle: "normal"
    }
  }, " \xD7", count));
}
Object.assign(__ds_scope, { Relation });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/graph/Relation.jsx", error: String((e && e.message) || e) }); }

// components/graph/TypeDot.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TYPE_COLORS = {
  concept: "var(--type-concept)",
  technology: "var(--type-technology)",
  person: "var(--type-person)",
  company: "var(--type-company)",
  project: "var(--type-project)"
};
const RING = ["#0d9488", "#a16207", "#ea580c", "#4f46e5", "#65a30d", "#c026d3"];

/** Resolve an entity type to its instrument hue (stable fallback for unknown types). */
function typeColor(type) {
  if (TYPE_COLORS[type]) return TYPE_COLORS[type];
  let h = 0;
  for (let i = 0; i < type.length; i++) h = h * 31 + type.charCodeAt(i) >>> 0;
  return RING[h % RING.length];
}

/** A small square swatch marking an entity type. */
function TypeDot({
  type = "concept",
  color,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-block",
      width: 8,
      height: 8,
      borderRadius: 2,
      flex: "none",
      background: color || typeColor(type),
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { TYPE_COLORS, typeColor, TypeDot });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/graph/TypeDot.jsx", error: String((e && e.message) || e) }); }

// components/graph/LegendRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** One row of the type legend: dot, label, count, and a proportional value bar. */
function LegendRow({
  type = "concept",
  count = 0,
  max = count || 1,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7,
      fontSize: 12,
      color: "var(--text-dim)"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.TypeDot, {
    type: type
  }), type, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      color: "var(--text-faint)",
      fontVariantNumeric: "tabular-nums"
    }
  }, count)), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      borderRadius: 2,
      marginTop: 1,
      opacity: 0.55,
      width: `${Math.min(100, count / max * 100)}%`,
      background: __ds_scope.typeColor(type)
    }
  }));
}
Object.assign(__ds_scope, { LegendRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/graph/LegendRow.jsx", error: String((e && e.message) || e) }); }

// components/graph/TypeChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** A pill chip naming an entity type, tinted to its hue. Set drift to flag off-schema types. */
function TypeChip({
  type = "concept",
  drift = false,
  style,
  ...rest
}) {
  const color = drift ? "var(--red)" : __ds_scope.typeColor(type);
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      padding: "1px 7px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.05em",
      textTransform: "uppercase",
      border: "1px solid",
      borderColor: color,
      color,
      borderRadius: 999,
      background: "rgba(255,255,255,0.6)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.TypeDot, {
    type: type,
    color: drift ? "var(--red)" : undefined
  }), type);
}
Object.assign(__ds_scope, { TypeChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/graph/TypeChip.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/ControlPanel.jsx
try { (() => {
// Top bar (wordmark, view switch, search, actions) + status bar + the shell.
const {
  useState: useStateApp
} = React;
function TopBar({
  view,
  setView,
  travel,
  setTravel,
  connecting,
  setConnecting,
  onAddNode
}) {
  const {
    Button,
    Input,
    Kbd,
    TypeDot
  } = window.DelapanDesignSystem_a684d2;
  const D = window.DLPN_DATA;
  const [q, setQ] = useStateApp("");
  const matches = q.trim() ? D.nodes.filter(n => n.label.toLowerCase().includes(q.toLowerCase())).slice(0, 6) : [];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "0 12px",
      background: "linear-gradient(180deg, var(--bg2), var(--bg1))",
      borderBottom: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      marginRight: 4,
      userSelect: "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 24,
      fontWeight: 700,
      letterSpacing: "0.1em",
      color: "var(--text)"
    }
  }, "DELAPAN", /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--accent)"
    }
  }, "_8")), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.22em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, "knowledge graph control")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius)",
      overflow: "hidden"
    }
  }, ["graph", "findings"].map(v => /*#__PURE__*/React.createElement("button", {
    key: v,
    onClick: () => setView(v),
    style: {
      padding: "4px 10px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.08em",
      cursor: "pointer",
      border: "none",
      color: view === v ? "var(--accent)" : "var(--text-dim)",
      background: view === v ? "var(--accent-dim)" : "var(--bg2)"
    }
  }, v))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      flex: 1,
      maxWidth: 420,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      left: 9,
      top: "50%",
      transform: "translateY(-50%)",
      color: "var(--text-faint)",
      fontSize: 11,
      pointerEvents: "none"
    }
  }, "\u2315"), /*#__PURE__*/React.createElement(Input, {
    placeholder: "search labels\u2026  ( / )",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      paddingLeft: 26
    }
  }), matches.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "calc(100% + 4px)",
      left: 0,
      right: 0,
      zIndex: 60,
      background: "var(--bg2)",
      border: "1px solid var(--line-bright)",
      borderRadius: "var(--radius)",
      boxShadow: "var(--shadow-pop)",
      overflow: "hidden"
    }
  }, matches.map(m => /*#__PURE__*/React.createElement("button", {
    key: m.id,
    onClick: () => setQ(""),
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "6px 10px",
      textAlign: "left",
      fontSize: 12,
      color: "var(--text)",
      border: "none",
      background: "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(TypeDot, {
    type: m.type
  }), m.label, /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, m.type))))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Button, {
    onClick: onAddNode
  }, "+ node"), /*#__PURE__*/React.createElement(Button, {
    active: connecting,
    onClick: () => setConnecting(c => !c)
  }, "\u2301 connect ", /*#__PURE__*/React.createElement(Kbd, null, "E")), /*#__PURE__*/React.createElement(Button, {
    variant: "ghost"
  }, "\u27F2 layout"), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 20,
      background: "var(--line)",
      margin: "0 4px"
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    active: travel,
    onClick: () => setTravel(t => !t)
  }, "\u27A4 travel ", /*#__PURE__*/React.createElement(Kbd, null, "T"))));
}
function StatusBar({
  lastAction
}) {
  const {
    Button
  } = window.DelapanDesignSystem_a684d2;
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 12px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--text-dim)",
      background: "var(--bg1)",
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      letterSpacing: "0.08em",
      textTransform: "uppercase"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--accent)",
      boxShadow: "0 0 6px var(--accent)"
    }
  }), "offline"), /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "0 6px",
      border: "1px solid var(--accent)",
      borderRadius: 3,
      color: "var(--accent)",
      letterSpacing: "0.12em",
      background: "var(--accent-dim)"
    }
  }, "MOCK DATA"), /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      color: "var(--text-faint)"
    }
  }, "last: ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--text-dim)",
      fontWeight: 500
    }
  }, lastAction)), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 4
    }
  }, /*#__PURE__*/React.createElement(Button, {
    style: {
      padding: "1px 7px",
      fontSize: 10
    },
    disabled: true
  }, "\u293A undo"), /*#__PURE__*/React.createElement(Button, {
    style: {
      padding: "1px 7px",
      fontSize: 10
    },
    disabled: true
  }, "\u293B redo")));
}
function ControlPanel() {
  const [view, setView] = useStateApp("graph");
  const [selected, setSelected] = useStateApp("j_delapan");
  const [finding, setFinding] = useStateApp(null);
  const [travel, setTravel] = useStateApp(false);
  const [connecting, setConnecting] = useStateApp(false);
  const [kb, setKb] = useStateApp("rag-ecosystem");
  const [last, setLast] = useStateApp("booted — loaded rag-ecosystem (mock)");
  const [toast, setToast] = useStateApp(null);
  const {
    Toast
  } = window.DelapanDesignSystem_a684d2;
  const select = id => {
    if (connecting && id && id !== selected) {
      setConnecting(false);
      setToast({
        kind: "success",
        msg: `connected ${selected} → ${id}`
      });
      setLast(`created edge from ${selected}`);
      setTimeout(() => setToast(null), 2600);
      return;
    }
    setSelected(id);
    if (id) setLast(`selected ${id}`);
  };
  const del = id => {
    setSelected(null);
    setLast(`deleted node ${id}`);
    setToast({
      kind: "info",
      msg: "node deleted"
    });
    setTimeout(() => setToast(null), 2600);
  };
  const addNode = () => {
    setToast({
      kind: "success",
      msg: "new node created"
    });
    setLast("added node");
    setTimeout(() => setToast(null), 2600);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateRows: "var(--topbar-h) 1fr var(--statusbar-h)",
      height: "100vh"
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    view: view,
    setView: setView,
    travel: travel,
    setTravel: setTravel,
    connecting: connecting,
    setConnecting: setConnecting,
    onAddNode: addNode
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "var(--rail-w) 1fr var(--inspector-w)",
      minHeight: 0,
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement(LeftRail, {
    project: "delapan",
    kb: kb,
    setKb: setKb
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      minWidth: 0
    }
  }, view === "graph" ? /*#__PURE__*/React.createElement(GraphCanvas, {
    selected: selected,
    onSelect: select,
    connecting: connecting
  }) : /*#__PURE__*/React.createElement(FindingsView, {
    onOpen: setFinding
  })), /*#__PURE__*/React.createElement(Inspector, {
    selected: selected,
    onOpenFinding: setFinding,
    onDelete: del
  }), /*#__PURE__*/React.createElement(FindingDrawer, {
    findingId: finding,
    onClose: () => setFinding(null)
  })), /*#__PURE__*/React.createElement(StatusBar, {
    lastAction: last
  }), toast && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 14,
      bottom: "calc(var(--statusbar-h) + 12px)",
      zIndex: 200
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    kind: toast.kind,
    onDismiss: () => setToast(null)
  }, toast.msg)));
}

// simple findings table view
function FindingsView({
  onOpen
}) {
  const D = window.DLPN_DATA;
  const {
    SectionTitle,
    ConfidenceBar
  } = window.DelapanDesignSystem_a684d2;
  const rows = Object.entries(D.findings);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      height: "100%",
      overflow: "hidden",
      background: "var(--bg0)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 12px 6px"
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    aux: `${rows.length} findings`
  }, "Findings")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, rows.map(([id, f]) => /*#__PURE__*/React.createElement("button", {
    key: id,
    onClick: () => onOpen(id),
    style: {
      display: "grid",
      gridTemplateColumns: "54px 40px 1fr auto",
      alignItems: "center",
      gap: 8,
      width: "100%",
      padding: "6px 12px",
      textAlign: "left",
      fontSize: 12,
      color: "var(--text)",
      border: "none",
      borderBottom: "1px solid var(--line)",
      background: "none",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(ConfidenceBar, {
    value: f.confidence,
    verified: f.confidence >= 0.85
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--text-dim)"
    }
  }, f.confidence.toFixed(2)), /*#__PURE__*/React.createElement("span", {
    style: {
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, f.title), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "var(--text-faint)"
    }
  }, f.category)))));
}
window.ControlPanel = ControlPanel;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/ControlPanel.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/FindingDrawer.jsx
try { (() => {
// Finding drawer: full content + provenance, slides in from the right.
function FindingDrawer({
  findingId,
  onClose
}) {
  const D = window.DLPN_DATA;
  const {
    Button
  } = window.DelapanDesignSystem_a684d2;
  if (!findingId) return null;
  const f = D.findings[findingId];
  if (!f) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "absolute",
      inset: 0,
      top: "var(--topbar-h)",
      bottom: "var(--statusbar-h)",
      zIndex: 70,
      background: "rgba(31,43,58,.28)",
      backdropFilter: "blur(1px)"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: "var(--topbar-h)",
      right: 0,
      bottom: "var(--statusbar-h)",
      zIndex: 71,
      width: "min(430px,92%)",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg1)",
      borderLeft: "1px solid var(--line-bright)",
      boxShadow: "-18px 0 50px rgba(31,43,58,.2)",
      animation: "dlpn-drawer 180ms cubic-bezier(.2,.9,.3,1)"
    }
  }, /*#__PURE__*/React.createElement("style", null, "@keyframes dlpn-drawer{from{transform:translateX(40px);opacity:0}}"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      padding: 14,
      borderBottom: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      margin: 0,
      fontSize: 15,
      fontWeight: 600,
      color: "var(--text)",
      flex: 1
    }
  }, f.title), /*#__PURE__*/React.createElement("button", {
    onClick: onClose,
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-mono)",
      color: "var(--text-faint)",
      fontSize: 14
    }
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto",
      padding: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
      marginBottom: 12,
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--text-dim)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "0 6px",
      border: "1px solid var(--line)",
      borderRadius: 999,
      color: "var(--text-faint)"
    }
  }, f.category), /*#__PURE__*/React.createElement("span", null, "conf ", f.confidence.toFixed(2)), f.tags.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    style: {
      padding: "0 6px",
      border: "1px solid var(--line)",
      borderRadius: 999,
      color: "var(--text-faint)"
    }
  }, t))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      lineHeight: 1.65,
      color: "var(--text)",
      whiteSpace: "pre-wrap"
    }
  }, f.content), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("h4", {
    style: {
      margin: "0 0 8px",
      fontFamily: "var(--font-display)",
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: "0.16em",
      textTransform: "uppercase",
      color: "var(--text-dim)"
    }
  }, "Provenance"), f.prov.map((p, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "block",
      padding: "7px 9px",
      marginBottom: 6,
      background: "var(--bg0)",
      border: "1px solid var(--line)",
      borderRadius: "var(--radius)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 12,
      fontWeight: 500,
      color: "var(--cyan)"
    }
  }, p[1]), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--text-faint)"
    }
  }, p[2]))))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px",
      borderTop: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "danger"
  }, "delete finding"))));
}
window.FindingDrawer = FindingDrawer;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/FindingDrawer.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/GraphCanvas.jsx
try { (() => {
// The center canvas: viewfinder chrome, SVG edges, DOM nodes, selection reticle.
const {
  useState,
  useRef,
  useEffect
} = React;
const TC = window.DLPN_TC;
function GraphCanvas({
  selected,
  onSelect,
  connecting
}) {
  const {
    nodes,
    edges
  } = window.DLPN_DATA;
  const nodeById = Object.fromEntries(nodes.map(n => [n.id, n]));
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({
    w: 1000,
    h: 600
  });
  const [hover, setHover] = useState(null);

  // fit the 1000×600 model space into the actual canvas
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({
      w: el.clientWidth,
      h: el.clientHeight
    }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const MW = 1040,
    MH = 660;
  const sx = dims.w / MW,
    sy = dims.h / MH;
  const s = Math.min(sx, sy);
  const ox = (dims.w - MW * s) / 2,
    oy = (dims.h - MH * s) / 2;
  const px = x => ox + x * s,
    py = y => oy + y * s;
  const neighbors = new Set();
  if (selected) {
    edges.forEach(e => {
      if (e.source === selected) neighbors.add(e.target);
      if (e.target === selected) neighbors.add(e.source);
    });
  }
  const isLit = id => !selected || id === selected || neighbors.has(id);
  return /*#__PURE__*/React.createElement("div", {
    ref: wrapRef,
    className: "cv" + (connecting ? " cv--connecting" : ""),
    onClick: () => onSelect(null),
    style: {
      position: "relative",
      height: "100%",
      overflow: "hidden",
      background: "radial-gradient(ellipse at center, rgba(255,255,255,.55), transparent 70%), repeating-linear-gradient(0deg, transparent 0 39px, rgba(38,58,84,.07) 39px 40px), repeating-linear-gradient(90deg, transparent 0 39px, rgba(38,58,84,.07) 39px 40px), var(--bg0)"
    }
  }, ["tl", "tr", "bl", "br"].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      position: "absolute",
      width: 18,
      height: 18,
      border: "1px solid var(--line-bright)",
      opacity: 0.8,
      zIndex: 5,
      top: c[0] === "t" ? 8 : "auto",
      bottom: c[0] === "b" ? 8 : "auto",
      left: c[1] === "l" ? 8 : "auto",
      right: c[1] === "r" ? 8 : "auto",
      borderRight: c[1] === "r" ? undefined : "none",
      borderLeft: c[1] === "l" ? undefined : "none",
      borderTop: c[0] === "t" ? undefined : "none",
      borderBottom: c[0] === "b" ? undefined : "none"
    }
  })), connecting && /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      top: 10,
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 20,
      padding: "4px 12px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.06em",
      color: "var(--accent)",
      background: "rgba(255,255,255,.94)",
      border: "1px solid var(--accent)",
      borderRadius: 999,
      boxShadow: "0 0 16px rgba(180,83,9,.15)",
      whiteSpace: "nowrap"
    }
  }, "pick a target node to connect"), /*#__PURE__*/React.createElement("svg", {
    width: dims.w,
    height: dims.h,
    style: {
      position: "absolute",
      inset: 0,
      pointerEvents: "none"
    }
  }, edges.map(e => {
    const a = nodeById[e.source],
      b = nodeById[e.target];
    const lit = isLit(e.source) && isLit(e.target);
    return /*#__PURE__*/React.createElement("line", {
      key: e.id,
      x1: px(a.x),
      y1: py(a.y),
      x2: px(b.x),
      y2: py(b.y),
      stroke: lit ? "#b3bfcf" : "#e6ebf2",
      strokeWidth: lit ? 1.2 : 1
    });
  })), nodes.map(n => {
    const lit = isLit(n.id);
    const sel = n.id === selected;
    const deg = edges.filter(e => e.source === n.id || e.target === n.id).length;
    const r = 5 + Math.min(deg, 8) * 1.3;
    return /*#__PURE__*/React.createElement("div", {
      key: n.id,
      onClick: ev => {
        ev.stopPropagation();
        onSelect(n.id);
      },
      onMouseEnter: () => setHover(n.id),
      onMouseLeave: () => setHover(null),
      style: {
        position: "absolute",
        left: px(n.x),
        top: py(n.y),
        transform: "translate(-50%,-50%)",
        cursor: "pointer",
        zIndex: sel ? 12 : 10,
        opacity: lit ? 1 : 0.28,
        transition: "opacity 200ms"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "block",
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        background: TC(n.type),
        border: "1.5px solid rgba(255,255,255,.85)",
        boxShadow: sel ? "0 0 0 2px var(--accent), 0 0 12px rgba(180,83,9,.4)" : "0 1px 3px rgba(31,43,58,.25)"
      }
    }), (lit || hover === n.id) && /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: "50%",
        top: r * 2 + 3,
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        color: sel ? "var(--accent)" : "var(--text-dim)",
        fontWeight: sel ? 600 : 400,
        background: "rgba(245,247,250,.7)",
        padding: "0 3px",
        borderRadius: 2
      }
    }, n.label));
  }));
}
window.GraphCanvas = GraphCanvas;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/GraphCanvas.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/Inspector.jsx
try { (() => {
// Right inspector: node header, label, type, properties, grounded evidence.
function Inspector({
  selected,
  onOpenFinding,
  onDelete
}) {
  const D = window.DLPN_DATA;
  const {
    SectionTitle,
    Input,
    Select,
    Button,
    TypeDot,
    EvidenceItem,
    Kbd
  } = window.DelapanDesignSystem_a684d2;
  const TC = window.DLPN_TC;
  if (!selected) {
    const keys = [["click", "select a node"], ["E", "connect edge"], ["T", "travel mode"], ["/", "search"], ["Del", "delete"]];
    return /*#__PURE__*/React.createElement("aside", {
      style: insWrap
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "28px 18px",
        color: "var(--text-faint)"
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: "0 0 12px",
        fontFamily: "var(--font-display)",
        fontSize: 16,
        fontWeight: 600,
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--text-dim)"
      }
    }, "Inspector"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 12,
        lineHeight: 1.6
      }
    }, "Select a node on the canvas to inspect and edit it, or trace the evidence that grounds it."), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 7,
        marginTop: 14
      }
    }, keys.map(([k, d]) => /*#__PURE__*/React.createElement("div", {
      key: k,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 11
      }
    }, /*#__PURE__*/React.createElement(Kbd, null, k), /*#__PURE__*/React.createElement("span", {
      style: {
        color: "var(--text-dim)"
      }
    }, d))))));
  }
  const node = D.nodes.find(n => n.id === selected);
  const props = nodeProps(node);
  return /*#__PURE__*/React.createElement("aside", {
    style: insWrap
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      overflowY: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: 12,
      borderBottom: "1px solid var(--line)",
      background: "linear-gradient(180deg, var(--bg2), transparent)"
    }
  }, /*#__PURE__*/React.createElement(TypeDot, {
    type: node.type
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase",
      color: "var(--text-faint)"
    }
  }, node.type), /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: "auto",
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--text-faint)",
      maxWidth: 120,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, node.id)), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 12
    }
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: node.label,
    style: {
      fontSize: 15,
      fontFamily: "var(--font-body)",
      fontWeight: 600,
      padding: "7px 9px"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "64px 1fr",
      alignItems: "center",
      gap: 8,
      margin: "12px 0 8px"
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lblIns
  }, "type"), /*#__PURE__*/React.createElement(Select, {
    defaultValue: node.type
  }, ["concept", "technology", "person", "company", "project"].map(t => /*#__PURE__*/React.createElement("option", {
    key: t
  }, t)))), props.length > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    style: {
      ...lblIns,
      margin: "12px 0 6px"
    }
  }, "properties"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, props.map(([k, v]) => /*#__PURE__*/React.createElement("div", {
    key: k,
    style: {
      display: "grid",
      gridTemplateColumns: "90px 1fr",
      gap: 4,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: k,
    style: {
      fontSize: 11,
      padding: "3px 6px"
    }
  }), /*#__PURE__*/React.createElement(Input, {
    defaultValue: String(v),
    style: {
      fontSize: 11,
      padding: "3px 6px"
    }
  }))))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...lblIns,
      margin: "16px 0 6px"
    }
  }, "grounded in \xB7 ", node.grounded.length), node.grounded.map(fid => {
    const f = D.findings[fid];
    if (!f) return null;
    return /*#__PURE__*/React.createElement(EvidenceItem, {
      key: fid,
      title: f.title,
      category: f.category,
      confidence: f.confidence,
      verified: f.confidence >= 0.85,
      sources: f.prov.length,
      onClick: () => onOpenFinding(fid)
    });
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6,
      padding: 12,
      borderTop: "1px solid var(--line)",
      background: "var(--bg1)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    style: {
      flex: 1
    }
  }, "synthesize doc"), /*#__PURE__*/React.createElement(Button, {
    variant: "danger",
    onClick: () => onDelete(node.id)
  }, "delete")));
}
function nodeProps(node) {
  const map = {
    j_delapan: [["meaning", "Indonesian for eight"]],
    c_finding: [["definition", "atomic unit of evidence"], ["plural", "findings"]],
    c_coverage: [["verdicts", "rich | sparse | gap"]],
    c_kg: [["kind", "typed property graph"]],
    t_sigma: [["version", "v3"], ["renderer", "WebGL"]],
    t_pgvector: [["language", "C"], ["indexes", "ivfflat, hnsw"]],
    j_br8n: [["focus", "dev context capture"]],
    p_ajacomy: [["affiliation", "OuestWare"]]
  };
  return map[node.id] || [];
}
const insWrap = {
  position: "relative",
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  background: "var(--bg1)",
  borderLeft: "1px solid var(--line)"
};
const lblIns = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: "var(--text-faint)"
};
window.Inspector = Inspector;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/Inspector.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/LeftRail.jsx
try { (() => {
// Left rail: scope, live stats + legend, schema (intent vs emergent + drift),
// synopsis, coverage probe, explore launcher.
const {
  useState: useStateLR
} = React;
function Sect({
  title,
  aux,
  children,
  last
}) {
  const {
    SectionTitle
  } = window.DelapanDesignSystem_a684d2;
  return /*#__PURE__*/React.createElement("section", {
    style: {
      borderBottom: last ? "none" : "1px solid var(--line)",
      padding: "10px 12px 12px"
    }
  }, /*#__PURE__*/React.createElement(SectionTitle, {
    aux: aux
  }, title), children);
}
function LeftRail({
  project,
  kb,
  setKb
}) {
  const D = window.DLPN_DATA;
  const {
    Select,
    Input,
    Button,
    Counter,
    LegendRow,
    Relation,
    TypeChip,
    VerdictBand,
    PhaseStep,
    Spinner
  } = window.DelapanDesignSystem_a684d2;
  const byType = {};
  D.nodes.forEach(n => byType[n.type] = (byType[n.type] || 0) + 1);
  const typeEntries = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const maxType = typeEntries[0][1];
  const byRel = {};
  D.edges.forEach(e => byRel[e.relation] = (byRel[e.relation] || 0) + 1);
  const relEntries = Object.entries(byRel).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const observed = [...new Set(D.nodes.map(n => n.type))];
  const drifted = observed.filter(t => !D.intent.includes(t));

  // coverage probe
  const [q, setQ] = useStateLR("");
  const [probe, setProbe] = useStateLR(null);
  const [probing, setProbing] = useStateLR(false);
  const runProbe = () => {
    if (!q.trim()) return;
    setProbing(true);
    setTimeout(() => {
      const toks = q.toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 2);
      const matched = Object.values(D.findings).filter(f => {
        const hay = (f.title + " " + f.content + " " + f.tags.join(" ")).toLowerCase();
        return toks.some(t => hay.includes(t));
      });
      const coverage = matched.length >= 5 ? "rich" : matched.length >= 2 ? "sparse" : "gap";
      const pre = [`<preamble kb="${project}/${kb}" coverage="${coverage}">`, ...D.synopsis.slice(0, 3).map(t => `• ${t.topic} — ${t.gloss}`), ...(matched.length ? ["", "Matched findings:"] : []), ...matched.slice(0, 4).map(f => `[${f.confidence.toFixed(2)}] ${f.title}`), "</preamble>"].join("\n");
      setProbe({
        coverage,
        pre
      });
      setProbing(false);
    }, 650);
  };

  // explore
  const PHASES = ["planning", "searching", "crawling", "extracting", "merging", "completed"];
  const [prompt, setPrompt] = useStateLR("");
  const [phase, setPhase] = useStateLR(-1);
  const [running, setRunning] = useStateLR(false);
  const runExplore = () => {
    if (!prompt.trim() || running) return;
    setRunning(true);
    setPhase(0);
    let i = 0;
    const tick = () => {
      i += 1;
      if (i < PHASES.length) {
        setPhase(i);
        setTimeout(tick, 620);
      } else {
        setRunning(false);
      }
    };
    setTimeout(tick, 620);
  };
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      display: "flex",
      flexDirection: "column",
      overflowY: "auto",
      background: "var(--bg1)",
      borderRight: "1px solid var(--line)"
    }
  }, /*#__PURE__*/React.createElement(Sect, {
    title: "Scope"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "52px 1fr",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "project"), /*#__PURE__*/React.createElement(Select, {
    value: project,
    onChange: () => {}
  }, /*#__PURE__*/React.createElement("option", null, "delapan"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "52px 1fr",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: lbl
  }, "kb"), /*#__PURE__*/React.createElement(Select, {
    value: kb,
    onChange: e => setKb(e.target.value)
  }, /*#__PURE__*/React.createElement("option", {
    value: "rag-ecosystem"
  }, "rag-ecosystem"))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      color: "var(--text-faint)"
    }
  }, "last activity 6/10/2026, 6:42 PM"))), /*#__PURE__*/React.createElement(Sect, {
    title: "Graph",
    aux: "live"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 8,
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement(Counter, {
    value: D.nodes.length,
    label: "nodes"
  }), /*#__PURE__*/React.createElement(Counter, {
    value: D.edges.length,
    label: "edges"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gap: 4
    }
  }, typeEntries.map(([t, c]) => /*#__PURE__*/React.createElement(LegendRow, {
    key: t,
    type: t,
    count: c,
    max: maxType
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 10,
      display: "flex",
      flexWrap: "wrap",
      gap: 4
    }
  }, relEntries.map(([r, c]) => /*#__PURE__*/React.createElement(Relation, {
    key: r,
    relation: r,
    count: c
  })))), /*#__PURE__*/React.createElement(Sect, {
    title: "Schema",
    aux: "intent vs emergent"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginBottom: 4
    }
  }, "intent"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4,
      marginBottom: 8
    }
  }, D.intent.map(t => /*#__PURE__*/React.createElement(TypeChip, {
    key: t,
    type: t
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 9,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      color: "var(--text-faint)",
      marginBottom: 4
    }
  }, "emergent"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: 4
    }
  }, observed.map(t => /*#__PURE__*/React.createElement(TypeChip, {
    key: t,
    type: t,
    drift: drifted.includes(t)
  }))), drifted.length > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      padding: "5px 8px",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--red)",
      background: "rgba(220,38,38,.06)",
      border: "1px dashed rgba(220,38,38,.4)",
      borderRadius: "var(--radius)"
    }
  }, "\u26A0 drift: ", drifted.join(", "), " in graph but not in intent schema")), /*#__PURE__*/React.createElement(Sect, {
    title: "Synopsis",
    aux: `${Object.keys(D.findings).length} findings`
  }, D.synopsis.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.topic,
    style: {
      padding: "5px 0",
      borderBottom: "1px dashed var(--line)"
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      display: "block",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--text)"
    }
  }, t.topic), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 11,
      color: "var(--text-dim)"
    }
  }, t.gloss)))), /*#__PURE__*/React.createElement(Sect, {
    title: "Coverage probe"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "can the KB answer\u2026?",
    value: q,
    onChange: e => setQ(e.target.value),
    onKeyDown: e => e.key === "Enter" && runProbe()
  }), /*#__PURE__*/React.createElement(Button, {
    onClick: runProbe,
    disabled: probing
  }, probing ? /*#__PURE__*/React.createElement(Spinner, null) : "probe")), probe && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8
    }
  }, /*#__PURE__*/React.createElement(VerdictBand, {
    coverage: probe.coverage
  }, probe.pre))), /*#__PURE__*/React.createElement(Sect, {
    title: "Explore",
    last: true
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "gap-fill from the web\u2026",
    value: prompt,
    onChange: e => setPrompt(e.target.value),
    onKeyDown: e => e.key === "Enter" && runExplore()
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "accent",
    onClick: runExplore,
    disabled: running
  }, running ? /*#__PURE__*/React.createElement(Spinner, null) : "run")), phase >= 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      display: "grid",
      gap: 2
    }
  }, PHASES.map((p, i) => {
    if (p === "completed" && phase < i) return null;
    const state = phase > i || !running && phase >= i ? "done" : phase === i && running ? "active" : "pending";
    return /*#__PURE__*/React.createElement(PhaseStep, {
      key: p,
      label: p,
      state: state,
      message: p === "crawling" ? "5 pages" : ""
    });
  }))));
}
const lbl = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "var(--text-faint)"
};
window.LeftRail = LeftRail;
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/LeftRail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/control-panel/data.js
try { (() => {
// Curated subset of the delapan mock KB — enough for a believable graph.
// Positions are hand-laid in a 1000×600 space for a clean force-atlas-like spread.
window.DLPN_DATA = function () {
  const nodes = [{
    id: "j_delapan",
    type: "project",
    label: "delapan",
    x: 500,
    y: 300,
    grounded: ["f01", "f09"]
  }, {
    id: "c_finding",
    type: "concept",
    label: "Finding",
    x: 360,
    y: 210,
    grounded: ["f01", "f25"]
  }, {
    id: "c_preamble",
    type: "concept",
    label: "Preamble",
    x: 300,
    y: 330,
    grounded: ["f03"]
  }, {
    id: "c_coverage",
    type: "concept",
    label: "Coverage banding",
    x: 350,
    y: 440,
    grounded: ["f04"]
  }, {
    id: "c_kg",
    type: "concept",
    label: "Knowledge graph",
    x: 620,
    y: 400,
    grounded: ["f10"]
  }, {
    id: "c_embedding",
    type: "concept",
    label: "Vector embedding",
    x: 210,
    y: 160,
    grounded: ["f05"]
  }, {
    id: "c_agentic",
    type: "concept",
    label: "Agentic exploration",
    x: 470,
    y: 470,
    grounded: ["f09"]
  }, {
    id: "c_synopsis",
    type: "concept",
    label: "Synopsis",
    x: 560,
    y: 190,
    grounded: ["f12"]
  }, {
    id: "c_drift",
    type: "concept",
    label: "Schema drift",
    x: 700,
    y: 300,
    grounded: ["f11"]
  }, {
    id: "t_pgvector",
    type: "technology",
    label: "pgvector",
    x: 160,
    y: 260,
    grounded: ["f05"]
  }, {
    id: "t_supabase",
    type: "technology",
    label: "Supabase",
    x: 200,
    y: 380,
    grounded: ["f06"]
  }, {
    id: "t_fastapi",
    type: "technology",
    label: "FastAPI",
    x: 330,
    y: 540,
    grounded: ["f07"]
  }, {
    id: "t_tavily",
    type: "technology",
    label: "Tavily",
    x: 520,
    y: 560,
    grounded: ["f08"]
  }, {
    id: "t_sigma",
    type: "technology",
    label: "sigma.js",
    x: 780,
    y: 420,
    grounded: ["f13"]
  }, {
    id: "t_graphology",
    type: "technology",
    label: "graphology",
    x: 840,
    y: 320,
    grounded: ["f14"]
  }, {
    id: "t_fa2",
    type: "technology",
    label: "ForceAtlas2",
    x: 800,
    y: 520,
    grounded: ["f15"]
  }, {
    id: "t_claude",
    type: "technology",
    label: "Claude Code",
    x: 640,
    y: 540,
    grounded: ["f20", "f21"]
  }, {
    id: "j_br8n",
    type: "project",
    label: "br8n",
    x: 660,
    y: 130,
    grounded: ["f22"]
  }, {
    id: "t_sqlitevec",
    type: "technology",
    label: "sqlite-vec",
    x: 790,
    y: 150,
    grounded: ["f23"]
  }, {
    id: "p_ajacomy",
    type: "person",
    label: "Alexis Jacomy",
    x: 900,
    y: 450,
    grounded: ["f16"]
  }, {
    id: "o_ouestware",
    type: "company",
    label: "OuestWare",
    x: 910,
    y: 540,
    grounded: ["f16"]
  }, {
    id: "o_anthropic",
    type: "company",
    label: "Anthropic",
    x: 720,
    y: 620,
    grounded: ["f21"]
  }];
  const edges = [["j_delapan", "builds", "c_kg"], ["j_delapan", "normalizes into", "c_finding"], ["j_delapan", "persists with", "t_pgvector"], ["j_delapan", "deploys on", "t_supabase"], ["j_delapan", "serves via", "t_fastapi"], ["j_delapan", "searches with", "t_tavily"], ["j_delapan", "assembles", "c_preamble"], ["j_delapan", "grades with", "c_coverage"], ["j_delapan", "distills", "c_synopsis"], ["j_delapan", "runs", "c_agentic"], ["j_delapan", "watches for", "c_drift"], ["c_finding", "embedded as", "c_embedding"], ["c_preamble", "summarizes", "c_finding"], ["c_coverage", "grades", "c_preamble"], ["c_kg", "grounds into", "c_finding"], ["c_agentic", "crawls via", "t_tavily"], ["c_agentic", "feeds", "c_finding"], ["t_pgvector", "stores", "c_embedding"], ["t_supabase", "bundles", "t_pgvector"], ["t_fastapi", "emits SSE for", "c_agentic"], ["t_sigma", "renders", "c_kg"], ["t_sigma", "reads state from", "t_graphology"], ["t_fa2", "positions", "c_kg"], ["t_fa2", "ships with", "t_graphology"], ["j_br8n", "forked from", "j_delapan"], ["j_br8n", "adds", "t_sqlitevec"], ["p_ajacomy", "created", "t_sigma"], ["p_ajacomy", "co-founded", "o_ouestware"], ["o_ouestware", "maintains", "t_sigma"], ["o_anthropic", "ships", "t_claude"], ["t_claude", "taps into", "j_delapan"]].map((e, i) => ({
    id: "e" + i,
    source: e[0],
    relation: e[1],
    target: e[2]
  }));
  const findings = {
    f01: {
      title: "Findings are the atomic unit of delapan knowledge",
      category: "architecture",
      confidence: 0.95,
      content: "Every piece of ingested knowledge in delapan is normalized into a 'finding': a titled, categorized chunk of text with a confidence score, tags, and provenance back to source URLs. Graph nodes and edges never store raw evidence — they reference finding ids via grounded_in.",
      tags: ["findings", "grounding", "schema"],
      prov: [["technical-overview.md", "github.com", "delapan finding unit of knowledge"]]
    },
    f03: {
      title: "Preamble assembly is the always-on read path",
      category: "architecture",
      confidence: 0.92,
      content: "Tapping a KB assembles a preamble block: synopsis topics plus the findings most relevant to the query, ordered by similarity and confidence. The preamble is what downstream agents actually consume.",
      tags: ["preamble", "resume"],
      prov: [["vision.md", "github.com", "preamble assembly coverage"]]
    },
    f04: {
      title: "Coverage banding grades every resume as rich, sparse, or gap",
      category: "architecture",
      confidence: 0.9,
      content: "Each /resume call returns a coverage verdict computed from match counts and similarity bands: 'rich' means the KB can answer, 'sparse' means partial grounding, 'gap' means exploration is needed.",
      tags: ["coverage", "banding"],
      prov: [["technical-overview.md", "github.com", "coverage rich sparse gap"]]
    },
    f05: {
      title: "pgvector stores embeddings inside Postgres",
      category: "retrieval",
      confidence: 0.97,
      content: "pgvector adds a vector column type plus ivfflat/hnsw indexes to PostgreSQL, letting similarity search live next to relational data. delapan uses it through Supabase.",
      tags: ["pgvector", "postgres"],
      prov: [["pgvector", "github.com", "pgvector postgres hnsw"]]
    },
    f09: {
      title: "Agentic exploration runs plan → search → crawl → extract → merge",
      category: "architecture",
      confidence: 0.94,
      content: "When coverage comes back 'gap', the explore pipeline plans sub-queries, fans out web searches, crawls the best hits, extracts candidate findings with an LLM, and merges them through dedup. Progress streams as SSE.",
      tags: ["explore", "pipeline"],
      prov: [["technical-overview.md", "github.com", "explore pipeline"]]
    },
    f10: {
      title: "The knowledge graph is grounded, typed, and verb-phrased",
      category: "architecture",
      confidence: 0.93,
      content: "delapan's reasoning layer is a typed property graph: nodes carry a type and label, edges carry free verb-phrase relations. Every node and edge lists the finding ids that ground it.",
      tags: ["knowledge-graph", "relations"],
      prov: [["technical-overview.md", "github.com", "typed nodes verb phrase"]]
    },
    f11: {
      title: "Schema drift is detected by diffing intent vs emergent ontology",
      category: "architecture",
      confidence: 0.86,
      content: "The engine records the schema the user intended and derives the emergent schema from what the graph contains. Types in the graph but absent from intent are flagged as drift.",
      tags: ["schema", "drift"],
      prov: [["technical-overview.md", "github.com", "schema drift intent emergent"]]
    },
    f12: {
      title: "The synopsis is a compact topic index rebuilt after ingest",
      category: "architecture",
      confidence: 0.88,
      content: "After explore merges, delapan distills the corpus into a synopsis: topics with one-line glosses, stamped with the finding count at build time.",
      tags: ["synopsis", "topics"],
      prov: [["technical-overview.md", "github.com", "synopsis topics"]]
    },
    f13: {
      title: "sigma.js renders large graphs on WebGL",
      category: "graph-viz",
      confidence: 0.96,
      content: "sigma.js v3 draws nodes and edges as WebGL programs, handling tens of thousands of elements. It reads from a graphology Graph instance.",
      tags: ["sigma.js", "webgl"],
      prov: [["sigmajs.org", "sigmajs.org", "sigma webgl rendering"]]
    },
    f14: {
      title: "graphology is the data layer beneath sigma",
      category: "graph-viz",
      confidence: 0.95,
      content: "graphology provides the Graph data structure — typed multigraphs, attribute storage, an event emitter — plus algorithms and layouts.",
      tags: ["graphology"],
      prov: [["graphology.github.io", "graphology.github.io", "graphology data structure"]]
    },
    f15: {
      title: "ForceAtlas2 is a continuous force-directed layout from Gephi",
      category: "graph-viz",
      confidence: 0.94,
      content: "ForceAtlas2 balances attraction along edges against degree-weighted repulsion, with LinLog and gravity options.",
      tags: ["forceatlas2", "layout"],
      prov: [["plos", "journals.plos.org", "forceatlas2 layout paper"]]
    },
    f16: {
      title: "Gephi Lite is the reference sigma + graphology application",
      category: "graph-viz",
      confidence: 0.9,
      content: "Gephi Lite, maintained by OuestWare, is a browser-based network exploration tool built on sigma.js and graphology.",
      tags: ["gephi-lite", "ouestware"],
      prov: [["gephi.org", "gephi.org", "gephi lite sigma graphology"]]
    },
    f06: {
      title: "Supabase bundles Postgres, pgvector, and an API gateway",
      category: "ecosystem",
      confidence: 0.93,
      content: "Supabase ships managed PostgreSQL with pgvector enabled by default, plus auth and PostgREST.",
      tags: ["supabase", "postgres"],
      prov: [["supabase.com", "supabase.com", "supabase pgvector"]]
    },
    f07: {
      title: "FastAPI serves delapan's deploy surface",
      category: "architecture",
      confidence: 0.91,
      content: "The engine exposes KB read/write as a FastAPI app: typed pydantic models, async handlers, and SSE streaming for exploration.",
      tags: ["fastapi", "sse"],
      prov: [["fastapi", "fastapi.tiangolo.com", "fastapi async sse"]]
    },
    f08: {
      title: "Tavily is a search API purpose-built for agents",
      category: "ecosystem",
      confidence: 0.89,
      content: "Tavily exposes web search and page extraction tuned for LLM consumption — cleaned content, source scoring, agent-sized rate limits.",
      tags: ["tavily", "search"],
      prov: [["tavily.com", "tavily.com", "tavily search api"]]
    },
    f20: {
      title: "Claude Code consumes delapan through MCP skills",
      category: "ecosystem",
      confidence: 0.92,
      content: "delapan ships as a Claude Code plugin: skills markdown drives slash commands which call an in-process MCP server.",
      tags: ["claude-code", "mcp"],
      prov: [["docs.anthropic.com", "docs.anthropic.com", "claude code mcp"]]
    },
    f21: {
      title: "Anthropic positions Claude Code as an agentic coding harness",
      category: "ecosystem",
      confidence: 0.9,
      content: "Claude Code is Anthropic's CLI agent for software work: tool use, MCP client support, and plugin skills.",
      tags: ["anthropic", "agents"],
      prov: [["anthropic.com", "anthropic.com", "claude code agentic cli"]]
    },
    f22: {
      title: "br8n is a hard fork of the delapan engine",
      category: "architecture",
      confidence: 0.96,
      content: "br8n copies delapan's core engine modules with imports renamed, then repurposes them for dev-context capture. Adds a free local SQLite tier.",
      tags: ["br8n", "fork"],
      prov: [["br8n CLAUDE.md", "github.com", "br8n fork delapan"]]
    },
    f23: {
      title: "sqlite-vec brings vector search to embedded SQLite",
      category: "retrieval",
      confidence: 0.87,
      content: "sqlite-vec is a small C extension adding vector storage and brute-force KNN to SQLite — the zero-infra local tier.",
      tags: ["sqlite-vec", "local-first"],
      prov: [["sqlite-vec", "github.com", "sqlite-vec knn"]]
    },
    f25: {
      title: "Provenance keeps every claim one click from its source",
      category: "architecture",
      confidence: 0.91,
      content: "Each finding records the URLs it was extracted from, the domain, and the search query that surfaced it.",
      tags: ["provenance", "audit"],
      prov: [["vision.md", "github.com", "provenance url domain query"]]
    }
  };
  const synopsis = [{
    topic: "Findings & grounding",
    gloss: "Evidence-first units with provenance; the graph cites them."
  }, {
    topic: "Preamble & coverage",
    gloss: "Always-on read path graded rich / sparse / gap per query."
  }, {
    topic: "Explore pipeline",
    gloss: "Plan → search → crawl → extract → merge, streamed over SSE."
  }, {
    topic: "Graph viz stack",
    gloss: "sigma.js v3 + graphology + ForceAtlas2."
  }];
  const intent = ["concept", "technology", "person", "company"];
  return {
    nodes,
    edges,
    findings,
    synopsis,
    intent
  };
}();
window.DLPN_TC = function (type) {
  return {
    concept: "#0284c7",
    technology: "#d97706",
    person: "#db2777",
    company: "#059669",
    project: "#7c3aed"
  }[type] || "#0d9488";
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/control-panel/data.js", error: String((e && e.message) || e) }); }

__ds_ns.Logomark = __ds_scope.Logomark;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Kbd = __ds_scope.Kbd;

__ds_ns.SectionTitle = __ds_scope.SectionTitle;

__ds_ns.ConfidenceBar = __ds_scope.ConfidenceBar;

__ds_ns.Counter = __ds_scope.Counter;

__ds_ns.EvidenceItem = __ds_scope.EvidenceItem;

__ds_ns.PhaseStep = __ds_scope.PhaseStep;

__ds_ns.Spinner = __ds_scope.Spinner;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.VerdictBand = __ds_scope.VerdictBand;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.LegendRow = __ds_scope.LegendRow;

__ds_ns.Relation = __ds_scope.Relation;

__ds_ns.TypeChip = __ds_scope.TypeChip;

__ds_ns.TYPE_COLORS = __ds_scope.TYPE_COLORS;

__ds_ns.TypeDot = __ds_scope.TypeDot;

})();
