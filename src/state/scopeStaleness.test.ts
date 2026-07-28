import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getGraph: vi.fn(async () => {
      throw new Error("graph fetch failed");
    }),
    getStats: vi.fn(async () => ({ node_count: 0, edge_count: 0, by_type: {}, by_relation: {} })),
    getSchema: vi.fn(async () => ({ intent: null, emergent: {} })),
    getSynopsis: vi.fn(async () => null),
    getFindings: vi.fn(async () => ({ count: 0, total: 0, findings: [] })),
  };
});

import { graph } from "../graph/graphStore";
import { useStore } from "./store";

function stubLocalStorage(): void {
  const backing = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => backing.set(key, value),
    removeItem: (key: string) => backing.delete(key),
    clear: () => backing.clear(),
  });
}

// loadScope's failure path pushes a toast, which schedules its own dismissal
// via window.setTimeout — also absent in this environment (see store.test.ts).
function stubWindowTimers(): void {
  vi.stubGlobal("window", {
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (id: Parameters<typeof clearTimeout>[0]) => clearTimeout(id),
  });
}

describe("a failed KB switch does not leave the previous KB on screen", () => {
  beforeEach(() => {
    stubLocalStorage();
    stubWindowTimers();
    graph.clear();
    graph.addNode("stale", {
      label: "from the OLD kb",
      nodeType: "concept",
      properties: {},
      grounded_in: [],
      created_at: "2026-07-01T00:00:00Z",
      x: 0,
      y: 0,
      size: 4,
      color: "#000000",
    });
    useStore.setState({
      project: "p",
      kb: "old",
      stats: { node_count: 1, edge_count: 0, by_type: {}, by_relation: {} },
      synopsis: null,
      scopeError: null,
    });
  });

  it("clears the graph and the derived panels when the graph fetch rejects", async () => {
    await useStore.getState().setScope("p", "new");

    expect(graph.order).toBe(0);
    expect(useStore.getState().stats).toBeNull();
    expect(useStore.getState().scopeError).toBeTruthy();
  });
});

describe("deleting a finding updates the view immediately", () => {
  beforeEach(() => {
    stubLocalStorage();
    useStore.setState({
      project: "p",
      kb: "k",
      findings: [
        { id: "a", title: "A", category: "x", confidence: 0.9, tags: [], created_at: "2026-07-01T00:00:00Z" },
        { id: "b", title: "B", category: "x", confidence: 0.5, tags: [], created_at: "2026-07-01T00:00:00Z" },
      ],
      findingsTotal: 2,
    });
  });

  it("splices the row out and decrements the total", () => {
    useStore.getState().removeFindingFromView("a");

    expect(useStore.getState().findings?.map((f) => f.id)).toEqual(["b"]);
    expect(useStore.getState().findingsTotal).toBe(1);
  });

  it("is a no-op for an id that is not in the current view", () => {
    useStore.getState().removeFindingFromView("zzz");

    expect(useStore.getState().findings).toHaveLength(2);
    expect(useStore.getState().findingsTotal).toBe(2);
  });
});
