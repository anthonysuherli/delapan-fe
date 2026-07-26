import { describe, expect, it } from "vitest";
import { docSlug, resolveRoute } from "./routes";

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

  it("routes the public site surfaces regardless of session", () => {
    expect(resolveRoute("/docs", false)).toBe("docs");
    expect(resolveRoute("/docs", true)).toBe("docs");
    expect(resolveRoute("/terms", false)).toBe("terms");
    expect(resolveRoute("/privacy", false)).toBe("privacy");
    expect(resolveRoute("/changelog", false)).toBe("changelog");
    expect(resolveRoute("/about", false)).toBe("about");
  });

  it("routes any /docs/<slug> to the docs surface", () => {
    expect(resolveRoute("/docs/coverage", true)).toBe("docs");
    expect(resolveRoute("/docs/coverage", false)).toBe("docs");
    expect(resolveRoute("/docs/whatever-unknown-slug", true)).toBe("docs");
  });

  it("normalises a trailing slash on the new public surfaces", () => {
    expect(resolveRoute("/docs/", true)).toBe("docs");
    expect(resolveRoute("/docs/coverage/", true)).toBe("docs");
    expect(resolveRoute("/terms/", true)).toBe("terms");
    expect(resolveRoute("/privacy/", true)).toBe("privacy");
    expect(resolveRoute("/changelog/", true)).toBe("changelog");
    expect(resolveRoute("/about/", true)).toBe("about");
  });

  it("falls back to a real 404 for unknown paths, not the panel", () => {
    expect(resolveRoute("/whatever", true)).toBe("not-found");
    expect(resolveRoute("/some/deep/path", true)).toBe("not-found");
    expect(resolveRoute("/whatever", false)).toBe("not-found");
  });

  it("changes meaning for the root ONLY — every other path ignores the session", () => {
    for (const p of ["/kg", "/tracking", "/duet", "/unknown", "/docs", "/docs/coverage", "/terms", "/privacy", "/changelog", "/about"]) {
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

describe("docSlug", () => {
  it("returns the segment after /docs/", () => {
    expect(docSlug("/docs/coverage")).toBe("coverage");
    expect(docSlug("/docs/quickstart")).toBe("quickstart");
  });

  it("normalises a trailing slash", () => {
    expect(docSlug("/docs/coverage/")).toBe("coverage");
  });

  it("is undefined for /docs itself", () => {
    expect(docSlug("/docs")).toBeUndefined();
    expect(docSlug("/docs/")).toBeUndefined();
  });

  it("is undefined for non-docs paths", () => {
    expect(docSlug("/")).toBeUndefined();
    expect(docSlug("/terms")).toBeUndefined();
    expect(docSlug("/whatever")).toBeUndefined();
  });
});
