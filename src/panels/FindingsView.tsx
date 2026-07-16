/**
 * Findings trust view: a brushable confidence histogram over a
 * confidence-sorted table. Read-only — no graphology, no commands.
 *
 *   store.findings ──▶ bin() ──▶ histogram ──brush──▶ confidenceRange
 *                  └──▶ inRange() ──▶ table ──click──▶ FindingDrawer
 */

import { useMemo, useState } from "react";
import { bin, inRange, tierOf, VERIFIED_MIN } from "../findings/derive";
import { useStore } from "../state/store";

const BIN_COUNT = 20;

export function FindingsView() {
  const findings = useStore((s) => s.findings);
  const total = useStore((s) => s.findingsTotal);
  const loading = useStore((s) => s.loadingFindings);
  const error = useStore((s) => s.findingsError);
  const range = useStore((s) => s.confidenceRange);
  const setRange = useStore((s) => s.setConfidenceRange);
  const openFinding = useStore((s) => s.openFinding);

  const rows = useMemo(
    () => [...(findings ?? [])].sort((a, b) => b.confidence - a.confidence),
    [findings],
  );
  const bins = useMemo(() => bin(rows, BIN_COUNT), [rows]);
  const shown = useMemo(() => inRange(rows, range), [rows, range]);
  const verified = useMemo(() => rows.filter((r) => tierOf(r.confidence) === "verified").length, [rows]);

  if (loading) {
    return (
      <div className="fv">
        <div className="cv-loading">
          <span className="spin" /> loading findings…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fv">
        <div className="fv-error">{error}</div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="fv">
        <div className="fv-empty placeholder">no findings in this KB yet</div>
      </div>
    );
  }

  const truncated = rows.length < total;

  return (
    <div className="fv">
      <div className="fv-head">
        <h2 className="sect-title">
          Findings{" "}
          <span className="sect-aux">
            {truncated ? `showing ${rows.length}/${total}` : `${total} total`} · {verified} verified
            {range ? ` · brush ${range[0].toFixed(2)}–${range[1].toFixed(2)}` : ""}
          </span>
        </h2>
        {range && (
          <button className="btn btn--ghost" onClick={() => setRange(null)}>
            clear brush
          </button>
        )}
      </div>

      <Histogram bins={bins} range={range} onBrush={setRange} />

      <div className="fv-table">
        {shown.map((f) => (
          <button key={f.id} className="fv-row" onClick={() => openFinding(f.id)}>
            <span className={`fv-conf fv-conf--${tierOf(f.confidence)}`}>
              <i style={{ width: `${Math.round(f.confidence * 100)}%` }} />
            </span>
            <span className="fv-conf-n mono">{f.confidence.toFixed(2)}</span>
            <span className="fv-title">{f.title}</span>
            <span className="fv-cat">{f.category}</span>
          </button>
        ))}
        {!shown.length && <div className="placeholder fv-empty">no findings in that confidence range</div>}
      </div>
    </div>
  );
}

function Histogram({
  bins,
  range,
  onBrush,
}: {
  bins: ReturnType<typeof bin>;
  range: [number, number] | null;
  onBrush: (r: [number, number] | null) => void;
}) {
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const max = Math.max(...bins.map((b) => b.count), 1);

  const commit = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) {
      onBrush(null); // plain click (mousedown+mouseup on the same bin) clears
      return;
    }
    const i0 = Math.min(fromIdx, toIdx);
    const i1 = Math.max(fromIdx, toIdx);
    onBrush([bins[i0]!.lo, bins[i1]!.hi]);
  };

  return (
    <div
      className="fv-hist"
      onMouseUp={() => setDragFromIdx(null)}
      onMouseLeave={() => setDragFromIdx(null)}
    >
      {bins.map((b, i) => {
        const active = !range || (b.hi > range[0] && b.lo < range[1]);
        const verified = b.lo >= VERIFIED_MIN;
        return (
          <button
            key={b.lo}
            className={`fv-bar${verified ? " fv-bar--verified" : ""}${active ? "" : " fv-bar--muted"}`}
            title={`${b.lo.toFixed(2)}–${b.hi.toFixed(2)}: ${b.count}`}
            onMouseDown={() => setDragFromIdx(i)}
            onMouseUp={(e) => {
              e.stopPropagation(); // handled here; the container's onMouseUp is only the dead-zone fallback
              if (dragFromIdx !== null) commit(dragFromIdx, i);
              setDragFromIdx(null);
            }}
          >
            <i style={{ height: `${(b.count / max) * 100}%` }} />
          </button>
        );
      })}
      <div className="fv-axis mono">
        <span>0.0</span>
        <span>confidence</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
