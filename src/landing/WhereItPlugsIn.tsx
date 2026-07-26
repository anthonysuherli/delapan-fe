/**
 * The two shipped surfaces: the MCP server (6 tools) and the /api
 * surface. Both are in backend/README.md's "What's inside" table.
 */
export function WhereItPlugsIn({ index }: { index: number }) {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">{String(index).padStart(2, "0")} — where it plugs in</p>
      <h2>in your editor, or in your product</h2>

      <div className="lp-targets">
        <div className="lp-target">
          <h3>claude code</h3>
          <p>
            A plugin exposes the base over MCP — resume, search, explore, backlog, projects,
            archive. Your assistant reads the grounding as part of its normal context, and every
            answer can name the findings it used.
          </p>
        </div>

        <div className="lp-target">
          <h3>your product</h3>
          <p>
            The same engine serves an HTTP API behind your own key. One request returns a grounded
            context block and its coverage band, ready to drop into a prompt.
          </p>
        </div>

        <div className="lp-target">
          <h3>your machine</h3>
          <p>
            The local tier runs on SQLite with no credentials and no cloud. The hosted tier is the
            same engine behind the same storage protocol — the code cannot tell them apart.
          </p>
        </div>
      </div>
    </section>
  );
}
