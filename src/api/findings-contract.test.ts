import { describe, expect, it } from "vitest";
import { mockApi } from "./mock";

describe("getFindings list projection", () => {
  it("returns rows with confidence and an uncapped total", async () => {
    const { projects } = await mockApi.getProjects();
    const p = projects[0]!;
    const kb = p.kbs[0]!;
    const res = await mockApi.getFindings(p.project, kb.kb, { limit: 1 });

    expect(res.findings.length).toBeLessThanOrEqual(1);
    expect(res.count).toBe(res.findings.length);
    expect(res.total).toBeGreaterThanOrEqual(res.count);

    const row = res.findings[0];
    if (row) {
      expect(typeof row.confidence).toBe("number");
      expect(row).not.toHaveProperty("content");
      expect(row).not.toHaveProperty("provenance");
    }
  });
});
