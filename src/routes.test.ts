import { describe, expect, it } from "vitest";
import { resolveRoute } from "./routes";

describe("resolveRoute", () => {
  it("sends a signed-in visitor at the root to the console", () => {
    expect(resolveRoute("/", true)).toBe("console");
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

describe("landing and /login", () => {
  it("shows the landing page to a signed-out visitor at the root", () => {
    expect(resolveRoute("/", false)).toBe("landing");
  });

  it("still shows the console to a signed-in visitor at the root", () => {
    expect(resolveRoute("/", true)).toBe("console");
  });

  it("puts the sign-in form on /login", () => {
    expect(resolveRoute("/login", false)).toBe("signin");
  });

  it("sends an already signed-in visitor away from /login", () => {
    expect(resolveRoute("/login", true)).toBe("redirect-home");
  });

  it("normalises a trailing slash on /login", () => {
    expect(resolveRoute("/login/", false)).toBe("signin");
  });

  it("still routes everything else by path alone", () => {
    for (const p of ["/kg", "/tracking", "/duet", "/unknown"]) {
      expect(resolveRoute(p, true)).toBe(resolveRoute(p, false));
    }
  });
});

describe("/signup", () => {
  it("shows the sign-up form to a signed-out visitor", () => {
    expect(resolveRoute("/signup", false)).toBe("signup");
  });

  it("sends an already signed-in visitor home instead", () => {
    expect(resolveRoute("/signup", true)).toBe("redirect-home");
  });

  it("normalises a trailing slash", () => {
    expect(resolveRoute("/signup/", false)).toBe("signup");
  });
});
