import { CodeBlock } from "./CodeBlock";

/**
 * knowledge graph & schema — LLM-extracted entities/relations over findings,
 * the intent-vs-emergent ontology split, and the propose → approve HITL
 * seam that governs it.
 */
export function Graph() {
  return (
    <article className="docs-article">
      <h1>knowledge graph &amp; schema</h1>
      <p>
        the knowledge graph is not a separate dataset you maintain by hand — it is entities and
        relations extracted from the findings already in the KB. an LLM reads the findings and
        proposes the nodes and edges; each one is extracted with, not before, the finding text
        that supports it, so the same <code>grounded_in</code> citation you saw on the finding
        carries through to the node or edge it produced.
      </p>

      <h2>intent schema vs. emergent ontology</h2>
      <p>
        you can shape what the graph looks like before it's built. <code>delapan_propose_kg_schema</code>{" "}
        drafts a target ontology — entity types, relation types — from the findings currently in
        the KB. that draft is a proposal, not a commitment: nothing is built from it until you
        call <code>delapan_set_kg_schema</code>, which validates and persists the version you
        approved. <code>delapan_build_graph</code> then builds the graph steered by that intent
        schema, and <code>delapan_get_kg_schema</code> reads back what's currently set. because
        extraction is LLM-driven, the graph that actually gets built can still diverge from the
        intent schema in places — an emergent ontology next to the intended one — and comparing
        the two is part of what these tools are for.
      </p>

      <h2>propose, then approve</h2>
      <p>
        this propose → approve step is the one human-in-the-loop seam in an otherwise
        self-maintaining pipeline. findings get written and resolved automatically; the graph
        does not get restructured without someone approving the schema it's built against first.
        extraction itself runs on a frontier-tier model rather than a cheaper one, deliberately —
        the graph is the trust artifact here: it is what a downstream reader looks at to judge the
        KB's shape, so the extraction step that produces it is not the place to cut cost.
      </p>

      <h2>a node, with its citation</h2>
      <CodeBlock lang="json">{`{
  "id": "node_42",
  "kb_id": "engine/knowledge-graph",
  "label": "resolve_and_persist",
  "nodeType": "function",
  "grounded_in": [
    { "finding_id": "fnd_9a2e", "quote": "Every write to findings goes through ...resolve_and_persist" }
  ]
}`}</CodeBlock>
      <p>
        edges carry the same <code>grounded_in</code> shape, pointing at whichever finding(s)
        established the relation. if that finding is later deleted, the node or edge keeps the
        citation and the graph UI shows it as unavailable rather than dropping the link silently.
      </p>
    </article>
  );
}
