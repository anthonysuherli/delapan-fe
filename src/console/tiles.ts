/**
 * Console destinations. Every entry points at a surface that EXISTS — a tile
 * promising an unbuilt page is worse than no tile, because the console is the
 * first screen after signing in and sets the expectation for everything else.
 *
 * dua is a separate deployment (see vercel.json's /dua/* redirect), so it is
 * an absolute URL rather than a route this app resolves.
 */
export interface Tile {
  href: string;
  label: string;
  description: string;
  external?: boolean;
}

export const TILES: Tile[] = [
  {
    href: "/kg",
    label: "knowledge graph",
    description: "explore and edit the graph",
  },
  {
    href: "/kg?view=findings",
    label: "findings",
    description: "the atomic units of what you know",
  },
  {
    href: "/tracking",
    label: "tracking",
    description: "project tracker",
  },
  {
    href: "https://dua.delapan.ai",
    label: "dua",
    description: "the couples interview companion",
    external: true,
  },
];
