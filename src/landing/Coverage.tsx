/**
 * 03 — coverage banding. Uses the SAME glyphs and --state-* tokens the app
 * renders, so the marketing and the product agree rather than merely resembling
 * each other. Dual-encoded: glyph AND name AND colour, never colour alone.
 */
const VERDICTS = [
  {
    glyph: "●",
    name: "rich",
    token: "var(--state-rich)",
    note: "the base already covers this. answered from what it knows, no research run.",
  },
  {
    glyph: "▲",
    name: "sparse",
    token: "var(--state-sparse)",
    note: "thin coverage. it answers what it has and tells you the grounding is partial.",
  },
  {
    glyph: "■",
    name: "gap",
    token: "var(--state-gap)",
    note: "not covered. it says so instead of guessing, and can go research it.",
  },
];

export function Coverage() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">03 — coverage</p>
      <h2>it tells you what it doesn't know</h2>
      <p className="lp-body">
        Every read is scored against the base before any work happens, and comes back banded. An
        agent that knows its grounding is thin can say so — which is the difference between a
        confident answer and a trustworthy one.
      </p>

      <div className="lp-verdicts">
        {VERDICTS.map((v) => (
          <div className="lp-verdict" key={v.name}>
            <span className="lp-verdict-glyph" style={{ color: v.token }}>
              {v.glyph}
            </span>
            <span className="lp-verdict-name" style={{ color: v.token }}>
              {v.name}
            </span>
            <span className="lp-verdict-note">{v.note}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
