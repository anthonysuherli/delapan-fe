/**
 * 05 — positioning, then the part that earns it: what is NOT built yet.
 * The three planned items are Planned Detours in docs/truenorth/vision.md.
 * A page arguing for auditability cannot hide its own roadmap.
 */
const CONTRASTS = [
  {
    title: "not a memory layer",
    body: "Stores of facts hand your agent raw material it still has to reason over. delapan keeps the reasoning already distilled, scored, and attributed.",
  },
  {
    title: "not a vector database",
    body: "A vector store holds embeddings and returns neighbours. It has no opinion about whether a fact superseded another, or where either came from.",
  },
  {
    title: "not a RAG framework",
    body: "Frameworks hand you parts to assemble. This is an engine that researches, resolves and serves — with the storage seam already behind it.",
  },
];

const PLANNED = [
  "watching the graph build itself live, as an ingest runs",
  "previewing the consequence of a graph edit before you commit it",
  "elasticsearch as an alternative retrieval backend",
];

export function WhatItIsnt() {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">05 — where it fits</p>
      <h2>what delapan isn't</h2>

      <div className="lp-contrasts">
        {CONTRASTS.map((c) => (
          <div className="lp-contrast" key={c.title}>
            <b>{c.title}</b>
            <span>{c.body}</span>
          </div>
        ))}
      </div>

      <div className="lp-planned">
        <p className="lp-kicker">and what isn't built yet</p>
        {PLANNED.map((p) => (
          <div className="lp-planned-row" key={p}>
            <span className="lp-planned-tag">planned</span>
            <span>{p}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
