import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getFindings: vi.fn(async () => ({
      count: 2,
      total: 361,
      findings: [
        { id: "a", title: "A", category: "research", confidence: 0.95, tags: [], created_at: "2026-07-16T00:00:00Z" },
        { id: "b", title: "B", category: "fact", confidence: 0.24, tags: [], created_at: "2026-07-16T00:00:00Z" },
      ],
    })),
  };
});

import * as api from "../api/client";
import { useStore } from "./store";

describe("findings view state", () => {
  beforeEach(() => {
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
});
