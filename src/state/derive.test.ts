import { describe, expect, it } from "vitest";
import { computeAnchors } from "./derive";

describe("computeAnchors", () => {
  it("anchors a new node to an existing neighbour, from either edge direction", () => {
    const present = (id: string) => id === "existing";
    const forward = computeAnchors(present, [{ source: "existing", target: "new" }]);
    expect(forward.get("new")).toBe("existing");

    const backward = computeAnchors(present, [{ source: "new", target: "existing" }]);
    expect(backward.get("new")).toBe("existing");
  });

  it("first candidate wins when two existing neighbours could anchor the same new node", () => {
    const present = (id: string) => id === "first" || id === "second";
    const anchors = computeAnchors(present, [
      { source: "first", target: "new" },
      { source: "second", target: "new" },
    ]);
    expect(anchors.get("new")).toBe("first");
  });

  it("does not anchor when both endpoints are new", () => {
    const present = () => false;
    const anchors = computeAnchors(present, [{ source: "new-a", target: "new-b" }]);
    expect(anchors.size).toBe(0);
  });
});
