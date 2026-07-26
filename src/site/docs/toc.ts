import { createElement, type ReactNode } from "react";
import { Quickstart } from "./Quickstart";

export interface DocsTocEntry {
  slug: string;
  title: string;
  element: ReactNode;
}

/**
 * The docs table of contents — left-rail nav order and reading order.
 * This task registers only `quickstart`. Task 8 appends the five concept
 * entries (findings, resolution, coverage, graph, deploy) below it, in
 * that order.
 */
export const DOCS_TOC: DocsTocEntry[] = [
  { slug: "quickstart", title: "quickstart", element: createElement(Quickstart) },
  // Task 8 inserts here: findings, resolution, coverage, graph, deploy
];
