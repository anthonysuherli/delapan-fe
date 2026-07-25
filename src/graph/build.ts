/**
 * GraphResponse ──▶ graphology attributes (clear + rebuild on KB switch).
 */

import type { GraphResponse } from "../api/types";
import { typeColor, EDGE_COLOR } from "./colors";
import { primeChannels } from "./encoding";
import { graph, graphTouched, refreshNodeSizes } from "./graphStore";
import { runLayout } from "./layout";

export function buildGraph(data: GraphResponse): void {
  graph.clear();
  // Hand the colour ring to this KB's own types, most frequent first, before
  // anything looks one up. Without this the ring is spent on whichever types
  // happen to be seen first, and stale assignments leak across a KB switch.
  const typeCounts: Record<string, number> = {};
  for (const n of data.nodes) typeCounts[n.type] = (typeCounts[n.type] ?? 0) + 1;
  primeChannels(typeCounts);

  for (const n of data.nodes) {
    graph.addNode(n.id, {
      label: n.label,
      nodeType: n.type,
      properties: n.properties ?? {},
      grounded_in: n.grounded_in ?? [],
      created_at: n.created_at,
      x: NaN,
      y: NaN,
      size: 4,
      color: typeColor(n.type),
    });
  }
  for (const e of data.edges) {
    if (!graph.hasNode(e.source) || !graph.hasNode(e.target)) continue;
    graph.addEdgeWithKey(e.id, e.source, e.target, {
      label: e.relation,
      relation: e.relation,
      properties: e.properties ?? {},
      grounded_in: e.grounded_in ?? [],
      created_at: e.created_at,
      size: 1.4,
      color: EDGE_COLOR,
    });
  }
  refreshNodeSizes();
  runLayout();
  graphTouched();
}
