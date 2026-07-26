import { CodeBlock } from "./CodeBlock";

/**
 * findings & grounding — the finding as the atomic unit, embedded +
 * deduplicated, and the grounded_in provenance chain carried on every
 * finding, node, and edge.
 */
export function Findings() {
  return (
    <article className="docs-article">
      <h1>findings &amp; grounding</h1>
      <p>
        a finding is the smallest unit of knowledge delapan works with: one claim, embedded, and
        stored against a knowledge base. everything else the engine builds — the synopsis, the
        knowledge graph, an answer to a query — is assembled from findings, not from raw source
        text. when you search, explore, or ask for a resume, you are always operating one layer
        above this table.
      </p>

      <h2>embedded, so it can be compared</h2>
      <p>
        each finding is stored with a vector embedding alongside its text, on whichever store is
        active — SQLite with <code>sqlite-vec</code> locally, or the Supabase/pgvector backend in
        the cloud tier. the embedding is what lets the engine find "the top-k similar findings
        already in this KB" for a new candidate, which is the comparison the write-time resolver
        runs before anything is persisted (covered in the next section). it is also what
        <code>delapan_search</code> uses for semantic recall: a query is embedded the same way and
        matched against the table, not string-matched against it.
      </p>

      <h2>nothing is asserted without a source</h2>
      <p>
        every finding carries a <code>grounded_in</code> citation back to where it came from —
        and that provenance does not stop at the finding. nodes and edges in the knowledge graph
        are extracted from findings, and they carry their own <code>grounded_in</code> pointer
        back to the finding(s) that support them. there is no step in the pipeline where a claim
        is asserted without something underneath it to point to. in the frontend graph, if the
        underlying finding is later deleted, the node or edge keeps its citation and the UI shows
        it as unavailable, rather than silently dropping the link.
      </p>

      <h2>a finding, shown plainly</h2>
      <p>
        the shape below is illustrative — the actual embedding vector is far longer than fits on
        a page — but the fields are the ones that matter: the claim itself, its source, and the
        KB it belongs to.
      </p>
      <CodeBlock lang="json">{`{
  "id": "fnd_9a2e",
  "kb_id": "engine/knowledge-graph",
  "text": "the resolver compares a candidate against its top-k similar findings before persisting.",
  "embedding": [0.0132, -0.0087, 0.0219, "…"],
  "grounded_in": {
    "source_type": "doc",
    "source_url": "backend/README.md#architecture-the-storage-seam",
    "quote": "Every write to findings goes through core/memory/persist.py::resolve_and_persist"
  }
}`}</CodeBlock>
      <p>
        this same <code>grounded_in</code> shape is what you will see attached to graph nodes and
        edges once you get to the knowledge-graph section — the citation format does not change
        as findings turn into graph structure.
      </p>
    </article>
  );
}
