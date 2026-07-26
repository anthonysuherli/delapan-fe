/**
 * 02 — what delapan actually does. Three shipped capabilities:
 * grounded_in provenance, the write-time resolver, and bi-temporal retirement.
 * No claim in this file is aspirational.
 */
export function Pillars() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">02 — what delapan does</p>
      <h2>every fact keeps its source, and its history</h2>

      <div className="lp-pillars">
        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>grounded</h3>
          <p>
            Every finding carries <span className="lp-code">grounded_in</span> — the source it was
            extracted from. Graph nodes and edges keep it too, so a claim can be traced back to the
            page it came from rather than to a similarity score.
          </p>
        </div>

        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>self-correcting</h3>
          <p>
            A candidate fact is resolved against what the base already knows{" "}
            <em>before</em> it is written — add, update, no-op, or supersede. Re-ingesting
            overlapping material produces updates, not another copy.
          </p>
        </div>

        <div className="lp-pillar">
          <div className="lp-pillar-rule" />
          <h3>nothing is lost</h3>
          <p>
            Superseding retires a fact; it never deletes one. Each carries{" "}
            <span className="lp-code">valid_from</span>,{" "}
            <span className="lp-code">invalidated_at</span> and{" "}
            <span className="lp-code">superseded_by</span>, so you can ask what the base believed at
            any point. Archived bases come back with their counts intact.
          </p>
        </div>
      </div>
    </section>
  );
}
