import { describe, expect, it } from "vitest";
import { resolveRoute } from "./routes";

describe("resolveRoute", () => {
  it("sends a signed-in visitor at the root to the console", () => {
    expect(resolveRoute("/", true)).toBe("console");
  });

  it("sends a signed-out visitor at the root to sign-in", () => {
    expect(resolveRoute("/", false)).toBe("signin");
  });

  it("routes /kg to the graph panel regardless of session", () => {
    expect(resolveRoute("/kg", true)).toBe("panel");
    expect(resolveRoute("/kg", false)).toBe("panel");
  });

  it("keeps tracking and duet on their own surfaces", () => {
    expect(resolveRoute("/tracking", true)).toBe("tracking");
    expect(resolveRoute("/duet", true)).toBe("duet");
  });

  it("normalises a trailing slash", () => {
    expect(resolveRoute("/kg/", true)).toBe("panel");
    expect(resolveRoute("/tracking/", true)).toBe("tracking");
    expect(resolveRoute("", true)).toBe("console");
  });

  it("falls back to the panel for unknown paths, so old links still land somewhere", () => {
    expect(resolveRoute("/whatever", true)).toBe("panel");
    expect(resolveRoute("/some/deep/path", true)).toBe("panel");
  });

  it("changes meaning for the root ONLY — every other path ignores the session", () => {
    for (const p of ["/kg", "/tracking", "/duet", "/unknown"]) {
      expect(resolveRoute(p, true)).toBe(resolveRoute(p, false));
    }
    expect(resolveRoute("/", true)).not.toBe(resolveRoute("/", false));
  });
});
