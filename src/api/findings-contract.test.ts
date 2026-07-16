import { describe, expect, it } from "vitest";
import { mockApi } from "./mock";

describe("getFindings list projection", () => {
  it("returns rows with confidence and an uncapped total", async () => {
    const { projects } = await mockApi.getProjects();
    const p = projects[0]!;
    const kb = p.kbs[0]!;
    // p/kb resolve to delapan/rag-ecosystem, whose FINDINGS_RAG fixture in
    // mock.ts has exactly 25 entries (f01-f25). limit: 1 is well below that,
    // so total must reflect the pre-slice count, not the post-slice length.
    const res = await mockApi.getFindings(p.project, kb.kb, { limit: 1 });

    expect(res.findings.length).toBeLessThanOrEqual(1);
    expect(res.count).toBe(res.findings.length);
    // Strict >, grounded in the known fixture size: a total computed AFTER
    // the limit slice would equal count (1) here and slip past a >= check.
    expect(res.total).toBe(25);
    expect(res.total).toBeGreaterThan(res.count);

    const row = res.findings[0];
    if (row) {
      expect(typeof row.confidence).toBe("number");
      expect(row).not.toHaveProperty("content");
      expect(row).not.toHaveProperty("provenance");
    }
  });
});
