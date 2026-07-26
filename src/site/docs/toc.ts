import { createElement, type ReactNode } from "react";
import { Quickstart } from "./Quickstart";
import { Findings } from "./Findings";
import { Resolution } from "./Resolution";
import { Coverage } from "./Coverage";
import { Graph } from "./Graph";
import { Deploy } from "./Deploy";

export interface DocsTocEntry {
  slug: string;
  title: string;
  element: ReactNode;
}

/**
 * The docs table of contents — left-rail nav order and reading order.
 */
export const DOCS_TOC: DocsTocEntry[] = [
  { slug: "quickstart", title: "quickstart", element: createElement(Quickstart) },
  { slug: "findings", title: "findings & grounding", element: createElement(Findings) },
  { slug: "resolution", title: "resolution & history", element: createElement(Resolution) },
  { slug: "coverage", title: "coverage & preamble", element: createElement(Coverage) },
  { slug: "graph", title: "knowledge graph & schema", element: createElement(Graph) },
  { slug: "deploy", title: "deploy surfaces", element: createElement(Deploy) },
];
