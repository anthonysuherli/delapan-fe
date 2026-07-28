/**
 * Single typed client for the delapan engine API.
 *
 *   UI ──▶ client.* ──▶ fetch(VITE_API_BASE) ──ok──▶ typed response
 *                                            └─err─▶ EngineFailure(kind)
 *
 * There is NO automatic fallback to mock data. A network failure raises an
 * `unreachable` EngineFailure and asks engineStatus to confirm via /health; the
 * UI then renders an honest failure state. The fixture is reachable only via
 * VITE_USE_MOCK=1, behind a dynamic import so it is tree-shaken out of any
 * production build (enforced by scripts/assert-no-mock.mjs).
 */

import { getSupabaseClient } from "../tracking/supabaseClient";
import type { SupabaseClient } from "@supabase/supabase-js";
import { captureError } from "../analytics";
import { classify, EngineFailure } from "./failure";
import { reportUnreachable } from "./engineStatus";
import {
  type ConceptDocResponse,
  type EdgeSpec,
  type ExploreEvent,
  type Finding,
  type FindingsResponse,
  type GraphNode,
  type GraphQuery,
  type GraphResponse,
  type GraphSchema,
  type GraphStats,
  type NodePatch,
  type NodeSpec,
  type ProjectsResponse,
  type ResumeResponse,
  type Synopsis,
} from "./types";
import type { mockApi as MockApi } from "./mock";

const env = import.meta.env as Record<string, string | undefined>;
const BASE = env.VITE_API_BASE ?? "http://127.0.0.1:8001";

/** Bearer header for the current Supabase session, or {} when signed out.
 *  Read fresh per request — supabase-js auto-refreshes the access token. */
export async function authHeaders(): Promise<Record<string, string>> {
  try {
    const { data } = await getSupabaseClient().auth.getSession();
    const token = data.session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

/** A 401 means the JWT is missing/expired/invalid — drop the session so the
 *  AuthGate re-renders the login screen. Fire-and-forget; never rethrow here. */
export function on401SignOut(status: number, client: Pick<SupabaseClient, "auth">): void {
  if (status === 401) void client.auth.signOut();
}

// Deliberately `import.meta.env.VITE_USE_MOCK`, not `env.VITE_USE_MOCK` — Vite's
// build-time inlining only rewrites this exact literal expression. Read through
// the `env` alias, it stays a runtime lookup and rollup can't fold the branch
// below, so the fixture would ship in every production bundle.
const USE_MOCK = import.meta.env.VITE_USE_MOCK === "1";

/** Resolved once, on first use, and only when the mock flag is on. In a
 *  production build USE_MOCK is statically false, so this import is unreachable
 *  and rollup drops src/api/mock.ts from the output entirely. */
let mockPromise: Promise<typeof MockApi> | null = null;
function loadMock(): Promise<typeof MockApi> {
  if (!mockPromise) mockPromise = import("./mock").then((m) => m.mockApi);
  return mockPromise;
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    });
  } catch (err) {
    reportUnreachable();
    throw new EngineFailure(classify(err), 0, "the engine is not reachable");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.text();
      if (body) detail = body.slice(0, 300);
    } catch {
      /* keep statusText */
    }
    if (res.status === 401) on401SignOut(res.status, getSupabaseClient());
    throw report(new EngineFailure(classify(null, res.status), res.status, detail), path);
  }
  if (res.status === 204) return undefined as T;
  try {
    return (await res.json()) as T;
  } catch (err) {
    // a dropped connection mid-body throws TypeError here too, not just
    // malformed JSON (SyntaxError) — classify() maps that to "unreachable",
    // so the probe must fire the same way it does on the initial fetch reject.
    if (err instanceof TypeError) reportUnreachable();
    throw report(
      new EngineFailure(classify(err), res.status, "the engine returned an unreadable body"),
      path,
    );
  }
}

/** Only `server` and `parse` are bugs — and not every `server` status/path pair
 *  is one, but the exclusion is scoped to the specific path it was ruled on, not
 *  the status alone. A 404 is only the documented "citation unavailable" path
 *  when it's on /findings/{id} — a deleted finding whose grounded_in reference
 *  survives, by design. A 404 on a mutation path (patchNode, deleteNode,
 *  deleteEdge) is the alias-map gotcha surfacing for real (delete-then-undo
 *  re-mints a server id; a resolution regression looks exactly like a 404) and
 *  must still report. Likewise 503 is only "embeddings unavailable" (LeftRail's
 *  own message) on /resume — a 503 from anywhere else means the whole engine is
 *  failing every request, which is the single most important thing to know
 *  about and must not go silent. `parse` always short-circuits first: a
 *  404-with-unreadable-body must not go silent just because its status matches
 *  an expected-path entry. `unreachable`, `unauthorized` and `forbidden` are
 *  expected states with their own screens and never reach here. */
const EXPECTED: ReadonlyArray<{ status: number; path: RegExp }> = [
  // Anchored to the endpoint suffix, not matched as a loose substring: kbPath
  // interpolates user-chosen project/KB names into this same string, so an
  // unanchored /\/findings\// would let a KB literally named "findings" silence
  // every 404 in that scope — including the mutation-path 404s this list exists
  // to keep reporting. Anchoring also stops a future /resume-cache matching.
  { status: 404, path: /\/findings\/[^/?]+$/ }, // deleted finding, citation survives by design
  { status: 503, path: /\/resume(\?|$)/ }, // embeddings unavailable — LeftRail's own message
];

function report(failure: EngineFailure, path: string): EngineFailure {
  const isBug =
    failure.kind === "parse" ||
    (failure.kind === "server" &&
      !EXPECTED.some((e) => e.status === failure.status && e.path.test(path)));
  if (isBug) captureError(failure, { path, status: failure.status, kind: failure.kind });
  return failure;
}

/** Mock is an explicit dev mode, never a failure fallback. */
async function call<T>(live: () => Promise<T>, mock: (api: typeof MockApi) => Promise<T>): Promise<T> {
  if (USE_MOCK) return mock(await loadMock());
  return live();
}

function qs(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== "");
  if (!entries.length) return "";
  const search = new URLSearchParams();
  for (const [k, v] of entries) search.set(k, String(v));
  return `?${search.toString()}`;
}

const kbPath = (project: string, kb: string) =>
  `/api/projects/${encodeURIComponent(project)}/kbs/${encodeURIComponent(kb)}`;

// ---------------------------------------------------------------------------
// endpoints

export function getProjects(): Promise<ProjectsResponse> {
  return call(() => http("/api/projects"), (m) => m.getProjects());
}

export function getGraph(project: string, kb: string, query: GraphQuery = {}): Promise<GraphResponse> {
  return call(
    () => http(`${kbPath(project, kb)}/graph${qs({ ...query })}`),
    (m) => m.getGraph(project, kb, query),
  );
}

export function getStats(project: string, kb: string): Promise<GraphStats> {
  return call(() => http(`${kbPath(project, kb)}/graph/stats`), (m) => m.getStats(project, kb));
}

export function getSchema(project: string, kb: string): Promise<GraphSchema> {
  return call(() => http(`${kbPath(project, kb)}/graph/schema`), (m) => m.getSchema(project, kb));
}

export function createNodes(project: string, kb: string, nodes: NodeSpec[]): Promise<{ ids: string[] }> {
  return call(
    () => http(`${kbPath(project, kb)}/graph/nodes`, { method: "POST", body: JSON.stringify({ nodes }) }),
    (m) => m.createNodes(project, kb, nodes),
  );
}

export function patchNode(project: string, kb: string, id: string, patch: NodePatch): Promise<{ node: GraphNode }> {
  return call(
    () =>
      http(`${kbPath(project, kb)}/graph/nodes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    (m) => m.patchNode(project, kb, id, patch),
  );
}

export function deleteNode(
  project: string,
  kb: string,
  id: string,
): Promise<{ deleted: boolean; removed_edge_ids: string[] }> {
  return call(
    () => http(`${kbPath(project, kb)}/graph/nodes/${encodeURIComponent(id)}`, { method: "DELETE" }),
    (m) => m.deleteNode(project, kb, id),
  );
}

export function synthesizeConceptDoc(
  project: string,
  kb: string,
  nodeId: string,
): Promise<ConceptDocResponse> {
  return call(
    () =>
      http(`${kbPath(project, kb)}/graph/nodes/${encodeURIComponent(nodeId)}/concept-doc`, {
        method: "POST",
      }),
    (m) => m.synthesizeConceptDoc(project, kb, nodeId),
  );
}

export function createEdges(project: string, kb: string, edges: EdgeSpec[]): Promise<{ inserted: number }> {
  return call(
    () => http(`${kbPath(project, kb)}/graph/edges`, { method: "POST", body: JSON.stringify({ edges }) }),
    (m) => m.createEdges(project, kb, edges),
  );
}

export function deleteEdge(project: string, kb: string, id: string): Promise<{ deleted: boolean }> {
  return call(
    () => http(`${kbPath(project, kb)}/graph/edges/${encodeURIComponent(id)}`, { method: "DELETE" }),
    (m) => m.deleteEdge(project, kb, id),
  );
}

export function getFindings(
  project: string,
  kb: string,
  params: { category?: string; limit?: number } = {},
): Promise<FindingsResponse> {
  return call(
    () => http(`${kbPath(project, kb)}/findings${qs({ ...params })}`),
    (m) => m.getFindings(project, kb, params),
  );
}

export function getFinding(project: string, kb: string, id: string): Promise<Finding> {
  return call(
    () => http(`${kbPath(project, kb)}/findings/${encodeURIComponent(id)}`),
    (m) => m.getFinding(project, kb, id),
  );
}

export function deleteFinding(project: string, kb: string, id: string): Promise<{ deleted: boolean }> {
  return call(
    () => http(`${kbPath(project, kb)}/findings/${encodeURIComponent(id)}`, { method: "DELETE" }),
    (m) => m.deleteFinding(project, kb, id),
  );
}

export function getSynopsis(project: string, kb: string): Promise<Synopsis | null> {
  return call(() => http(`${kbPath(project, kb)}/synopsis`), (m) => m.getSynopsis(project, kb));
}

/** May reject with EngineFailure(kind: "server", status: 503) when embeddings are
 *  unavailable — LeftRail's CoverageProbe special-cases that status; report() does
 *  not send it to error tracking since it's an expected, not exceptional, state. */
export function getResume(project: string, kb: string, query: string, depth?: number): Promise<ResumeResponse> {
  return call(
    () => http(`${kbPath(project, kb)}/resume${qs({ query, depth })}`),
    (m) => m.getResume(project, kb, query, depth),
  );
}

// ---------------------------------------------------------------------------
// explore (SSE)

async function* liveExplore(
  project: string,
  kb: string,
  body: { prompt: string; max_findings?: number },
): AsyncGenerator<ExploreEvent> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${kbPath(project, kb)}/explore`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeaders()) },
      body: JSON.stringify(body),
    });
  } catch (err) {
    reportUnreachable();
    throw new EngineFailure(classify(err), 0, "the engine is not reachable");
  }
  const explorePath = `${kbPath(project, kb)}/explore`;
  if (!res.ok) {
    if (res.status === 401) on401SignOut(res.status, getSupabaseClient());
    throw report(new EngineFailure(classify(null, res.status), res.status, res.statusText), explorePath);
  }
  if (!res.body) {
    // res.ok but no stream body isn't a server-side fault by status — "parse"
    // names what actually happened instead of a misleading "server error: OK".
    throw report(new EngineFailure("parse", res.status, "the engine returned no stream body"), explorePath);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    // SSE frames are separated by a blank line
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trim())
        .join("\n");
      if (!data) continue;
      try {
        yield JSON.parse(data) as ExploreEvent;
      } catch {
        // skip malformed frames rather than aborting the stream
      }
    }
  }
}

export async function* explore(
  project: string,
  kb: string,
  body: { prompt: string; max_findings?: number },
): AsyncGenerator<ExploreEvent> {
  if (USE_MOCK) {
    const m = await loadMock();
    yield* m.explore(project, kb, body);
    return;
  }
  yield* liveExplore(project, kb, body);
}
