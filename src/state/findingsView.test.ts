import { beforeEach, describe, expect, it, vi } from "vitest";

// distinguishable per-KB fixture: "visualization" (the default scope in these
// tests) gets the original 2-finding/361-total payload; "kb-b" gets a
// different one so a test can prove which KB's data actually landed in state.
vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getFindings: vi.fn(async (_project: string, kb: string) =>
      kb === "kb-b"
        ? {
            count: 1,
            total: 42,
            findings: [
              { id: "z", title: "Z", category: "fact", confidence: 0.5, tags: [], created_at: "2026-07-16T00:00:00Z" },
            ],
          }
        : {
            count: 2,
            total: 361,
            findings: [
              { id: "a", title: "A", category: "research", confidence: 0.95, tags: [], created_at: "2026-07-16T00:00:00Z" },
              { id: "b", title: "B", category: "fact", confidence: 0.24, tags: [], created_at: "2026-07-16T00:00:00Z" },
            ],
          },
    ),
    getGraph: vi.fn(async () => ({ nodes: [], edges: [] })),
    getStats: vi.fn(async () => ({ node_count: 0, edge_count: 0, by_type: {}, by_relation: {} })),
    getSchema: vi.fn(async () => ({ intent: null, emergent: {} })),
    getSynopsis: vi.fn(async () => null),
  };
});

import * as api from "../api/client";
import type { FindingsResponse } from "../api/types";
import { useStore } from "./store";

// loadScope/setScope persist the scope to localStorage, which isn't present
// in vitest's "node" test environment — stub it so setScope can run for real.
function stubLocalStorage(): void {
  const backing = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => backing.get(key) ?? null,
    setItem: (key: string, value: string) => backing.set(key, value),
    removeItem: (key: string) => backing.delete(key),
    clear: () => backing.clear(),
  });
}

describe("findings view state", () => {
  beforeEach(() => {
    stubLocalStorage();
    useStore.setState({
      project: "knowledge-engine",
      kb: "visualization",
      view: "graph",
      findings: null,
      findingsTotal: 0,
      loadingFindings: false,
      findingsError: null,
      confidenceRange: null,
    });
    vi.clearAllMocks();
  });

  it("does not fetch findings while the view is graph", () => {
    expect(api.getFindings).not.toHaveBeenCalled();
    expect(useStore.getState().findings).toBeNull();
  });

  it("loads findings lazily on first switch and keeps total", async () => {
    useStore.getState().setView("findings");
    await vi.waitFor(() => expect(useStore.getState().loadingFindings).toBe(false));

    expect(api.getFindings).toHaveBeenCalledTimes(1);
    expect(useStore.getState().findings).toHaveLength(2);
    expect(useStore.getState().findingsTotal).toBe(361);
  });

  it("does not refetch on a second switch", async () => {
    useStore.getState().setView("findings");
    await vi.waitFor(() => expect(useStore.getState().findings).not.toBeNull());
    useStore.getState().setView("graph");
    useStore.getState().setView("findings");
    expect(api.getFindings).toHaveBeenCalledTimes(1);
  });

  it("refetches findings when the KB is switched while already on the findings view", async () => {
    useStore.getState().setView("findings");
    await vi.waitFor(() => expect(useStore.getState().loadingFindings).toBe(false));
    expect(api.getFindings).toHaveBeenCalledTimes(1);
    expect(useStore.getState().findingsTotal).toBe(361);

    // switch KB while `view` remains "findings" — the LeftRail scope selector path
    await useStore.getState().setScope("knowledge-engine", "kb-b");
    await vi.waitFor(() => expect(useStore.getState().loadingFindings).toBe(false));

    expect(useStore.getState().view).toBe("findings");
    expect(api.getFindings).toHaveBeenCalledTimes(2);
    expect(api.getFindings).toHaveBeenLastCalledWith("knowledge-engine", "kb-b", { limit: 1000 });
    expect(useStore.getState().findings).toHaveLength(1);
    expect(useStore.getState().findingsTotal).toBe(42);
  });

  it("discards a stale response for an abandoned KB instead of overwriting the current scope", async () => {
    let resolveA: (value: FindingsResponse) => void = () => {};
    let resolveB: (value: FindingsResponse) => void = () => {};
    vi.mocked(api.getFindings).mockImplementation(
      (_project: string, kb: string) =>
        new Promise<FindingsResponse>((resolve) => {
          if (kb === "kb-b") resolveB = resolve;
          else resolveA = resolve;
        }),
    );

    // start KB-A's (still in-flight) fetch
    useStore.getState().setView("findings");
    expect(api.getFindings).toHaveBeenCalledTimes(1);

    // switch to KB-B while KB-A's response hasn't landed yet
    const scopePromise = useStore.getState().setScope("knowledge-engine", "kb-b");
    expect(api.getFindings).toHaveBeenCalledTimes(2);

    // KB-B's own fetch resolves first (the current scope)
    resolveB({
      count: 1,
      total: 42,
      findings: [{ id: "z", title: "Z", category: "fact", confidence: 0.5, tags: [], created_at: "2026-07-16T00:00:00Z" }],
    });
    await scopePromise;
    await vi.waitFor(() => expect(useStore.getState().loadingFindings).toBe(false));
    expect(useStore.getState().findingsTotal).toBe(42);

    // KB-A's abandoned fetch resolves late, after the KB-B switch
    resolveA({
      count: 2,
      total: 361,
      findings: [
        { id: "a", title: "A", category: "research", confidence: 0.95, tags: [], created_at: "2026-07-16T00:00:00Z" },
        { id: "b", title: "B", category: "fact", confidence: 0.24, tags: [], created_at: "2026-07-16T00:00:00Z" },
      ],
    });
    await new Promise((r) => setTimeout(r, 0)); // flush the stale .then

    // the late KB-A response must not have clobbered KB-B's state
    expect(useStore.getState().kb).toBe("kb-b");
    expect(useStore.getState().findingsTotal).toBe(42);
    expect(useStore.getState().findings).toHaveLength(1);
    expect(useStore.getState().loadingFindings).toBe(false);
  });
});
