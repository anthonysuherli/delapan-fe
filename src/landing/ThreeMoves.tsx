/**
 * "Three moves, in order" (how it works) — id "how". Prototype lines 96-124.
 * The 01/02/03 grid is driven by MOVES; below it the VerdictBand sample
 * (lines 115-124) shows what a preamble read looks like.
 */
import type { JSX } from "react";
import { VerdictBand } from "./ds/VerdictBand";

interface Move {
  index: string;
  title: string;
  body: string;
}

const MOVES: Move[] = [
  {
    index: "01",
    title: "ground",
    body: "everything ingested becomes a finding — titled, scored, and stamped with the url it came from. nodes and edges hold no prose of their own; they cite findings.",
  },
  {
    index: "02",
    title: "grow",
    body: "a query that lands short is a signal, not a failure. the engine plans, searches, crawls, extracts, and merges — and the knowledge base is larger than it was.",
  },
  {
    index: "03",
    title: "answer",
    body: "a read assembles a preamble: only the findings that matter here, ordered by similarity and confidence, graded rich, sparse, or gap. that is what your agent consumes.",
  },
];

// Prototype lines 116-122, x-import children — preserve the line breaks
// exactly, they render inside VerdictBand's <pre>.
const PREAMBLE_SAMPLE = `preamble · 6 findings · 0.91 mean confidence

f01  findings are the atomic unit …
f25  provenance keeps every claim …
f10  the knowledge graph is typed …

grounded_in: 9 urls across 4 domains`;

export function ThreeMoves(): JSX.Element {
  return (
    <section id="how" className="lpv2-moves">
      <p className="lpv2-moves-title">Three moves, in order.</p>
      <div className="lpv2-moves-grid">
        {MOVES.map((m) => (
          <div key={m.index} className="lpv2-move">
            <span className="lpv2-move-index">{m.index}</span>
            <h3 className="lpv2-move-heading">{m.title}</h3>
            <p className="lpv2-move-body">{m.body}</p>
          </div>
        ))}
      </div>
      <div className="lpv2-verdict-sample">
        <VerdictBand coverage="rich" note="kb can answer">
          {PREAMBLE_SAMPLE}
        </VerdictBand>
        <p className="lpv2-verdict-caption">what an answer looks like</p>
      </div>
    </section>
  );
}
