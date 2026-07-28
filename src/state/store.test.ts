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
import { undoManager, type Command } from "./undo";

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

describe("readOnly guards — mutations must not reach graphology or the API during an outage", () => {
  beforeEach(() => {
    stubWindowTimers();
    useStore.setState({ readOnly: false, toasts: [] });
    undoManager.clear();
  });

  it("runCmd refuses to run the command and returns false when readOnly", async () => {
    useStore.setState({ readOnly: true });
    const execute = vi.fn(async () => {});
    const invert = vi.fn(async () => {});
    const cmd: Command = { label: "add node \"x\"", execute, invert };

    const ok = await useStore.getState().runCmd(cmd);

    expect(ok).toBe(false);
    expect(execute).not.toHaveBeenCalled();
    expect(useStore.getState().toasts.some((t) => t.kind === "error")).toBe(true);
  });

  it("runCmd runs the command normally when not readOnly (control case)", async () => {
    const execute = vi.fn(async () => {});
    const invert = vi.fn(async () => {});
    const cmd: Command = { label: "add node \"x\"", execute, invert };

    const ok = await useStore.getState().runCmd(cmd);

    expect(ok).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("undo() does not invoke the undo manager when readOnly", async () => {
    useStore.setState({ readOnly: true });
    const undoSpy = vi.spyOn(undoManager, "undo");

    await useStore.getState().undo();

    expect(undoSpy).not.toHaveBeenCalled();
    expect(useStore.getState().toasts.some((t) => t.kind === "error")).toBe(true);
    undoSpy.mockRestore();
  });

  it("redo() does not invoke the undo manager when readOnly", async () => {
    useStore.setState({ readOnly: true });
    const redoSpy = vi.spyOn(undoManager, "redo");

    await useStore.getState().redo();

    expect(redoSpy).not.toHaveBeenCalled();
    expect(useStore.getState().toasts.some((t) => t.kind === "error")).toBe(true);
    redoSpy.mockRestore();
  });
});
