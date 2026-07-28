import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getGraph: vi.fn(async () => ({ nodes: [], edges: [] })),
    getStats: vi.fn(async () => ({ node_count: 0, edge_count: 0, by_type: {}, by_relation: {} })),
    getSchema: vi.fn(async () => ({ intent: null, emergent: {} })),
    getSynopsis: vi.fn(async () => null),
  };
});

import * as api from "../api/client";
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

// loadScope's failure path pushes a toast, which schedules its own dismissal
// via window.setTimeout — also absent in this environment.
function stubWindowTimers(): void {
  vi.stubGlobal("window", {
    setTimeout: (...args: Parameters<typeof setTimeout>) => setTimeout(...args),
    clearTimeout: (id: Parameters<typeof clearTimeout>[0]) => clearTimeout(id),
  });
}

describe("hasLoadedData", () => {
  beforeEach(() => {
    stubLocalStorage();
    stubWindowTimers();
    useStore.setState({ project: "knowledge-engine", kb: "visualization", hasLoadedData: false });
    vi.clearAllMocks();
  });

  it("stays false until a scope load actually succeeds", async () => {
    expect(useStore.getState().hasLoadedData).toBe(false);
    await useStore.getState().loadScope();
    expect(useStore.getState().hasLoadedData).toBe(true);
  });

  it("does not flip on a failed loadScope", async () => {
    vi.mocked(api.getGraph).mockRejectedValueOnce(new Error("engine unreachable"));
    await useStore.getState().loadScope();
    expect(useStore.getState().hasLoadedData).toBe(false);
  });

  it("survives a later failed scope switch — once real data is on screen, a subsequent outage does not erase that", async () => {
    await useStore.getState().loadScope();
    expect(useStore.getState().hasLoadedData).toBe(true);

    vi.mocked(api.getGraph).mockRejectedValueOnce(new Error("engine unreachable"));
    await useStore.getState().setScope("knowledge-engine", "other-kb");

    expect(useStore.getState().hasLoadedData).toBe(true);
  });
});
