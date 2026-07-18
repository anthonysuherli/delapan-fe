import { describe, expect, it } from "vitest";
import {
  branchUrl,
  extractNextStep,
  groupInitiatives,
  linkForSpecOrPlan,
} from "./viewModel";
import type { InitiativeRow } from "./types";

const row = (
  partial: Partial<InitiativeRow> & Pick<InitiativeRow, "slug" | "status">,
): InitiativeRow => ({
  title: partial.title ?? partial.slug,
  repo: partial.repo ?? "backend",
  blocked_by: partial.blocked_by ?? [],
  spec: partial.spec ?? null,
  plan: partial.plan ?? null,
  branch: partial.branch ?? null,
  body_md: partial.body_md ?? "",
  updated: partial.updated ?? "2026-07-17",
  ...partial,
});

describe("extractNextStep", () => {
  it("reads **Next step** block", () => {
    const body = "Intro.\n\n**Next step**\n\nDo the thing.\n";
    expect(extractNextStep(body)).toBe("Do the thing.");
  });

  it("reads ## Next step block", () => {
    const body = "Intro.\n\n## Next step\n\nDo the other thing.\n";
    expect(extractNextStep(body)).toBe("Do the other thing.");
  });

  it("falls back to first paragraph", () => {
    expect(extractNextStep("Only para.\n\nSecond.")).toBe("Only para.");
  });
});

describe("linkForSpecOrPlan", () => {
  it("passes through https URLs", () => {
    expect(linkForSpecOrPlan("https://example.com/a")).toBe("https://example.com/a");
  });

  it("maps relative paths to delapan-be", () => {
    expect(linkForSpecOrPlan("docs/x.md")).toBe(
      "https://github.com/anthonysuherli/delapan-be/blob/master/docs/x.md",
    );
  });
});

describe("branchUrl", () => {
  it("uses fe repo for frontend", () => {
    expect(branchUrl("frontend", "feat/x")).toBe(
      "https://github.com/anthonysuherli/delapan-fe/tree/feat/x",
    );
  });

  it("uses be repo for backend/both", () => {
    expect(branchUrl("both", "feat/x")).toContain("delapan-be");
  });
});

describe("groupInitiatives", () => {
  it("orders statuses and hides dropped by default", () => {
    const groups = groupInitiatives(
      [
        row({ slug: "d", status: "done" }),
        row({ slug: "a", status: "active" }),
        row({ slug: "x", status: "dropped" }),
        row({ slug: "b", status: "blocked" }),
      ],
      { showDropped: false },
    );
    expect(groups.map((group) => group.status)).toEqual(["active", "blocked", "done"]);
    expect(groups.flatMap((group) => group.items.map((item) => item.slug))).not.toContain("x");
  });
});
