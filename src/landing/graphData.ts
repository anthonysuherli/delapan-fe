// The hero graph proof's data literals — copied literal-for-literal from
// docs/handoff/landing-v2/Landing Page v2.dc.html lines 216-285 (the `N`/`E`/`F`/`TC`
// script constants), tuple arrays mapped to typed objects exactly as the prototype's
// own `.map()` calls do. 22 nodes, 31 edges. NOTE: the prototype data itself defines
// only 20 findings (ids f01,f03-f16,f20-f23,f25 — f02,f17-f19,f24 don't exist); the
// task brief and README both claim "21 findings" for this same literal block — a
// doc/data drift, not a transcription gap here (verified by parsing the source file).

export interface GraphNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  grounded: string[];
  core: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  relation: string;
  target: string;
}

export interface Finding {
  title: string;
  category: string;
  confidence: number;
  sources: number;
  prov: string;
}

export const VIEW = { x: 100, y: 80, w: 870, h: 590 };

export const TYPE_COLORS: Record<string, string> = {
  concept: "#0284c7",
  technology: "#d97706",
  person: "#db2777",
  company: "#059669",
  project: "#7c3aed",
};

type NodeTuple = [string, string, string, number, number, string[], 0 | 1];

const NODE_TUPLES: NodeTuple[] = [
  ["j_delapan", "project", "delapan", 500, 300, ["f01", "f09"], 1],
  ["c_finding", "concept", "Finding", 360, 210, ["f01", "f25"], 1],
  ["c_preamble", "concept", "Preamble", 300, 330, ["f03"], 1],
  ["c_coverage", "concept", "Coverage banding", 350, 440, ["f04"], 1],
  ["c_kg", "concept", "Knowledge graph", 620, 400, ["f10"], 1],
  ["c_embedding", "concept", "Vector embedding", 210, 160, ["f05"], 1],
  ["c_agentic", "concept", "Agentic exploration", 470, 470, ["f09"], 1],
  ["c_synopsis", "concept", "Synopsis", 560, 190, ["f12"], 0],
  ["c_drift", "concept", "Schema drift", 700, 300, ["f11"], 1],
  ["t_pgvector", "technology", "pgvector", 160, 260, ["f05"], 1],
  ["t_supabase", "technology", "Supabase", 200, 380, ["f06"], 1],
  ["t_fastapi", "technology", "FastAPI", 330, 540, ["f07"], 0],
  ["t_tavily", "technology", "Tavily", 520, 560, ["f08"], 1],
  ["t_sigma", "technology", "sigma.js", 780, 420, ["f13"], 1],
  ["t_graphology", "technology", "graphology", 840, 320, ["f14"], 0],
  ["t_fa2", "technology", "ForceAtlas2", 800, 520, ["f15"], 0],
  ["t_claude", "technology", "Claude Code", 640, 540, ["f20", "f21"], 1],
  ["j_br8n", "project", "br8n", 660, 130, ["f22"], 0],
  ["t_sqlitevec", "technology", "sqlite-vec", 790, 150, ["f23"], 1],
  ["p_ajacomy", "person", "Alexis Jacomy", 900, 450, ["f16"], 0],
  ["o_ouestware", "company", "OuestWare", 910, 540, ["f16"], 0],
  ["o_anthropic", "company", "Anthropic", 720, 620, ["f21"], 0],
];

export const NODES: GraphNode[] = NODE_TUPLES.map(([id, type, label, x, y, grounded, core]) => ({
  id,
  type,
  label,
  x,
  y,
  grounded,
  core: !!core,
}));

type EdgeTuple = [string, string, string];

const EDGE_TUPLES: EdgeTuple[] = [
  ["j_delapan", "builds", "c_kg"],
  ["j_delapan", "normalizes into", "c_finding"],
  ["j_delapan", "persists with", "t_pgvector"],
  ["j_delapan", "deploys on", "t_supabase"],
  ["j_delapan", "serves via", "t_fastapi"],
  ["j_delapan", "searches with", "t_tavily"],
  ["j_delapan", "assembles", "c_preamble"],
  ["j_delapan", "grades with", "c_coverage"],
  ["j_delapan", "distills", "c_synopsis"],
  ["j_delapan", "runs", "c_agentic"],
  ["j_delapan", "watches for", "c_drift"],
  ["c_finding", "embedded as", "c_embedding"],
  ["c_preamble", "summarizes", "c_finding"],
  ["c_coverage", "grades", "c_preamble"],
  ["c_kg", "grounds into", "c_finding"],
  ["c_agentic", "crawls via", "t_tavily"],
  ["c_agentic", "feeds", "c_finding"],
  ["t_pgvector", "stores", "c_embedding"],
  ["t_supabase", "bundles", "t_pgvector"],
  ["t_fastapi", "emits SSE for", "c_agentic"],
  ["t_sigma", "renders", "c_kg"],
  ["t_sigma", "reads state from", "t_graphology"],
  ["t_fa2", "positions", "c_kg"],
  ["t_fa2", "ships with", "t_graphology"],
  ["j_br8n", "forked from", "j_delapan"],
  ["j_br8n", "adds", "t_sqlitevec"],
  ["p_ajacomy", "created", "t_sigma"],
  ["p_ajacomy", "co-founded", "o_ouestware"],
  ["o_ouestware", "maintains", "t_sigma"],
  ["o_anthropic", "ships", "t_claude"],
  ["t_claude", "taps into", "j_delapan"],
];

export const EDGES: GraphEdge[] = EDGE_TUPLES.map(([source, relation, target], i) => ({
  id: "e" + i,
  source,
  relation,
  target,
}));

export const FINDINGS: Record<string, Finding> = {
  f01: { title: "Findings are the atomic unit of delapan knowledge", category: "architecture", confidence: 0.95, sources: 2, prov: "github.com" },
  f03: { title: "Preamble assembly is the always-on read path", category: "architecture", confidence: 0.92, sources: 1, prov: "vision.md" },
  f04: { title: "Coverage banding grades every resume rich, sparse, or gap", category: "architecture", confidence: 0.90, sources: 1, prov: "github.com" },
  f05: { title: "pgvector stores embeddings inside Postgres", category: "retrieval", confidence: 0.97, sources: 2, prov: "github.com" },
  f06: { title: "Supabase bundles Postgres, pgvector, and an API gateway", category: "ecosystem", confidence: 0.93, sources: 1, prov: "supabase.com" },
  f07: { title: "FastAPI serves delapan's deploy surface", category: "architecture", confidence: 0.91, sources: 1, prov: "fastapi.tiangolo.com" },
  f08: { title: "Tavily is a search API purpose-built for agents", category: "ecosystem", confidence: 0.89, sources: 1, prov: "tavily.com" },
  f09: { title: "Agentic exploration runs plan → search → crawl → extract → merge", category: "architecture", confidence: 0.94, sources: 2, prov: "github.com" },
  f10: { title: "The knowledge graph is grounded, typed, and verb-phrased", category: "architecture", confidence: 0.93, sources: 1, prov: "github.com" },
  f11: { title: "Schema drift is detected by diffing intent vs emergent ontology", category: "architecture", confidence: 0.86, sources: 1, prov: "github.com" },
  f12: { title: "The synopsis is a compact topic index rebuilt after ingest", category: "architecture", confidence: 0.88, sources: 1, prov: "github.com" },
  f13: { title: "sigma.js renders large graphs on WebGL", category: "graph-viz", confidence: 0.96, sources: 2, prov: "sigmajs.org" },
  f14: { title: "graphology is the data layer beneath sigma", category: "graph-viz", confidence: 0.95, sources: 1, prov: "graphology.github.io" },
  f15: { title: "ForceAtlas2 is a continuous force-directed layout from Gephi", category: "graph-viz", confidence: 0.94, sources: 1, prov: "journals.plos.org" },
  f16: { title: "Gephi Lite is the reference sigma + graphology application", category: "graph-viz", confidence: 0.90, sources: 1, prov: "gephi.org" },
  f20: { title: "Claude Code consumes delapan through MCP skills", category: "ecosystem", confidence: 0.92, sources: 1, prov: "docs.anthropic.com" },
  f21: { title: "Anthropic positions Claude Code as an agentic coding harness", category: "ecosystem", confidence: 0.90, sources: 1, prov: "anthropic.com" },
  f22: { title: "br8n is a hard fork of the delapan engine", category: "architecture", confidence: 0.96, sources: 1, prov: "github.com" },
  f23: { title: "sqlite-vec brings vector search to embedded SQLite", category: "retrieval", confidence: 0.87, sources: 1, prov: "github.com" },
  f25: { title: "Provenance keeps every claim one click from its source", category: "architecture", confidence: 0.91, sources: 2, prov: "vision.md" },
};
