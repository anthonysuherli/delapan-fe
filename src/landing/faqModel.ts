// FAQ data + pure state helper. Copy verbatim from
// docs/handoff/landing-v2/"Landing Page v2.dc.html" lines 155-186.
// Named faqModel.ts, not faq.ts, to avoid an unavoidable TS1149 basename
// collision with ./Faq.tsx on case-insensitive filesystems (confirmed on
// this checkout: reading "FAQ.TS" resolves "faq.ts"'s content) — same
// naming convention as kbGraphModel.ts / KbGraph.tsx in this directory.

export interface FaqItem {
  q: string;
  a: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    q: "is this just a vector database?",
    a: "no. embeddings are only the retrieval layer. the unit of storage is a finding — text with a category, a confidence, and its provenance — and a typed graph sits over the top of it.",
  },
  {
    q: "self-hosted or hosted?",
    a: "both. sqlite and sqlite-vec give you a knowledge base in a single file, with no infrastructure. point it at supabase and pgvector when it needs to be shared. same engine, same api.",
  },
  {
    q: "how are stale facts corrected?",
    a: "re-ground the topic. new findings are merged against the old ones rather than overwriting them, so the correction and what it replaced both stay inspectable.",
  },
  {
    q: "how do i plug it into my agent?",
    a: "mcp. the engine ships an mcp server — tap a knowledge base for a preamble, or trigger explore when coverage comes back gap. an http api sits underneath if you prefer it.",
  },
  {
    q: "license and pricing",
    a: "the engine is mit and self-hostable, permanently. the hosted control panel is in private beta; pricing arrives with it.",
  },
];

/**
 * Flips the open/closed state of index i only, leaving every other index
 * untouched. Pure — never mutates `state`. The Faq component seeds its
 * useState with `{ 0: true }` (item 0 open on load, README §7).
 */
export function toggleFaq(
  state: Record<number, boolean>,
  i: number,
): Record<number, boolean> {
  return { ...state, [i]: !state[i] };
}
