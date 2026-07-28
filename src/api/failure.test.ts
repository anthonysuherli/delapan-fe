import { describe, expect, it } from "vitest";
import { ApiError } from "./types";
import { classify, EngineFailure } from "./failure";

describe("classify", () => {
  it("maps a fetch TypeError to unreachable", () => {
    expect(classify(new TypeError("Failed to fetch"))).toBe("unreachable");
  });

  it("maps HTTP statuses to their kinds", () => {
    expect(classify(null, 401)).toBe("unauthorized");
    expect(classify(null, 403)).toBe("forbidden");
    expect(classify(null, 500)).toBe("server");
    expect(classify(null, 502)).toBe("server");
    expect(classify(null, 503)).toBe("server");
  });

  it("treats an unmapped 4xx as server rather than guessing", () => {
    expect(classify(null, 418)).toBe("server");
  });

  it("maps a JSON syntax error to parse", () => {
    expect(classify(new SyntaxError("Unexpected token <"))).toBe("parse");
  });

  it("defaults to server for an unknown error with no status", () => {
    expect(classify(new Error("???"))).toBe("server");
  });
});

describe("EngineFailure", () => {
  it("is an ApiError, so existing instanceof checks keep working", () => {
    const failure = new EngineFailure("server", 500, "boom");
    expect(failure).toBeInstanceOf(ApiError);
    expect(failure.status).toBe(500);
    expect(failure.kind).toBe("server");
  });

  it("uses status 0 for unreachable — there was no HTTP response", () => {
    const failure = new EngineFailure("unreachable", 0, "network");
    expect(failure.status).toBe(0);
    expect(failure.kind).toBe("unreachable");
  });
});
