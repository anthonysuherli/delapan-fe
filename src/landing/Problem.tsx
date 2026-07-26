/**
 * The gap core/memory/ exists to close. Every claim here describes the
 * status quo delapan is arguing against, not a delapan feature.
 */
export function Problem({ index }: { index: number }) {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">{String(index).padStart(2, "0")} — the problem</p>
      <h2>agent memory is append-only</h2>
      <p className="lp-body">
        Ingest the same domain twice and you get two copies of the same fact. Correct something and
        you either overwrite the old version — losing the history of what you believed and when — or
        leave the contradiction sitting in the store for a retrieval to pick at random.
      </p>
      <p className="lp-body">
        And when an agent finally answers, nothing tells you which stored fact it leaned on, where
        that fact came from, or whether it was still true.
      </p>
    </section>
  );
}
