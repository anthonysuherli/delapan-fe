import { CodeBlock } from "./CodeBlock";

/**
 * coverage & preamble — the rich/sparse/gap verdict, the preamble that
 * grounds every resume, and the gap → backlog → explore loop that closes
 * coverage holes.
 */
export function Coverage() {
  return (
    <article className="docs-article">
      <h1>coverage &amp; preamble</h1>
      <p>
        before you trust an answer, you should know how well the KB actually covers the question
        behind it. every call to <code>delapan_resume</code> returns that judgment up front, as a
        band: <code>rich</code>, <code>sparse</code>, or <code>gap</code>. it is not a footnote —
        it is scored before the resume card is assembled, so you see the confidence level before
        you see the content it's attached to.
      </p>

      <h2>what a resume actually contains</h2>
      <p>
        the resume card is built from a preamble: the KB's synopsis — a standing summary of what
        the KB knows, kept up to date as findings are written — plus whatever findings are
        specifically relevant to the current query. the synopsis gives you the spine of the KB;
        the query-relevant findings give you the detail for the question you actually asked. the
        coverage band is a judgment about that combination, not about the KB in the abstract —
        a KB can be rich for one query and sparse for another.
      </p>

      <h2>gap feeds the backlog, the backlog feeds explore</h2>
      <p>
        a <code>gap</code> verdict is not a dead end. <code>delapan_backlog</code> returns the
        ranked list of gap and sparse queries the KB has been asked and couldn't answer well —
        a curation backlog built from what people actually wanted to know, not from a guess at
        what might be useful. <code>delapan_explore</code> is what consumes that backlog: given a
        query, it plans, searches the web, crawls, and extracts candidate findings, which then go
        through the same write-time resolver covered in the previous section before they land in
        the KB. the band thresholds themselves aren't fixed forever, either —
        <code>scripts/calibrate_bands.py</code> recalibrates them for whichever embedding model is
        currently active.
      </p>

      <h2>a resume card, banded</h2>
      <CodeBlock lang="json">{`{
  "kb_id": "engine/exploration",
  "band": "sparse",
  "synopsis": "gap-fill exploration plans, searches, crawls, and extracts...",
  "findings": [
    { "id": "fnd_88b1", "text": "explore requires TAVILY_API_KEY and an LLM key." }
  ],
  "backlog_hint": "no findings on explore's retry behavior on partial crawl failure"
}`}</CodeBlock>
      <p>
        a <code>rich</code> response would carry more findings and no backlog hint; a{" "}
        <code>gap</code> response would carry closer to none, and that query would be the kind of
        thing that shows up in <code>delapan_backlog</code> next.
      </p>
    </article>
  );
}
