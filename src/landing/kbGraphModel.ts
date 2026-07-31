// Pure derivations for the hero graph proof — no React import, so these are
// unit-testable in a plain node environment. Mirrors the prototype's inline
// closures (docs/handoff/landing-v2/Landing Page v2.dc.html lines 298-330):
// `visible()`, the `deg` accumulator, the `nb` neighbor set, and `lit()`.
import { EDGES, NODES } from "./graphData";
import type { GraphEdge, GraphNode } from "./graphData";

export type Density = "full" | "core";

export function visible(density: Density): { ns: GraphNode[]; es: GraphEdge[] } {
  const ns = density === "core" ? NODES.filter((n) => n.core) : NODES;
  const ids = new Set(ns.map((n) => n.id));
  return { ns, es: EDGES.filter((e) => ids.has(e.source) && ids.has(e.target)) };
}

export function degrees(es: GraphEdge[]): Record<string, number> {
  const deg: Record<string, number> = {};
  es.forEach((e) => {
    deg[e.source] = (deg[e.source] || 0) + 1;
    deg[e.target] = (deg[e.target] || 0) + 1;
  });
  return deg;
}

export function neighborsOf(sel: string | null, es: GraphEdge[]): Set<string> {
  const nb = new Set<string>();
  if (sel) {
    es.forEach((e) => {
      if (e.source === sel) nb.add(e.target);
      if (e.target === sel) nb.add(e.source);
    });
  }
  return nb;
}

export function diameter(degree: number): number {
  return 2 * (5.5 + Math.min(degree, 8) * 1.25);
}

export function isLit(id: string, sel: string | null, neighbors: Set<string>): boolean {
  return !sel || id === sel || neighbors.has(id);
}

// Labels render in IBM Plex Mono at 10px (--dlpv2-text-xs), whose fixed glyph
// advance is 0.6em = 6px, plus 0.02em letter-spacing → 6.2px per character.
export const LABEL_CHAR_W = 6.2;
export const LABEL_EDGE_PAD = 4;

/** Horizontal px offset that keeps a centered label inside [0, canvasW]. */
export function labelShift(centerPx: number, label: string, canvasW: number): number {
  if (canvasW <= 0) return 0;
  const half = (label.length * LABEL_CHAR_W) / 2;
  if (centerPx - half < LABEL_EDGE_PAD) return LABEL_EDGE_PAD - (centerPx - half);
  if (centerPx + half > canvasW - LABEL_EDGE_PAD) return canvasW - LABEL_EDGE_PAD - (centerPx + half);
  return 0;
}
