/**
 * Use cases — three rows, one per audience. Prototype lines 127-149. Rows
 * stack (label above content) below 720px — spec Deviation 4, pure CSS in
 * landing.css.
 */
import type { JSX } from "react";

interface Case {
  label: string;
  heading: string;
  body: string;
}

const CASES: Case[] = [
  {
    label: "for agents",
    heading: "memory that survives a model swap",
    body: "the knowledge base is the durable layer. change the model and the facts, the scores, and the provenance all stay. tap it over mcp for a preamble instead of stuffing context and hoping.",
  },
  {
    label: "for research",
    heading: "a knowledge base you edit by hand",
    body: "nodes, edges, and findings are all editable in the control panel, with undo. a wrong relation is corrected once and stays corrected. it is a working document, not a build artifact.",
  },
  {
    label: "for audit",
    heading: "every claim, one click from its source",
    body: "grounded_in ties each node and edge to finding ids, and each finding to the urls and queries that surfaced it. drift is flagged by diffing the schema you intended against the one the graph grew.",
  },
];

export function UseCases(): JSX.Element {
  return (
    <section className="lpv2-cases">
      {CASES.map((c) => (
        <div key={c.label} className="lpv2-case">
          <span className="lpv2-case-label">{c.label}</span>
          <div className="lpv2-case-content">
            <h4 className="lpv2-case-heading">{c.heading}</h4>
            <p className="lpv2-case-body">{c.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
