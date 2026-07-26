import { describe, expect, it } from "vitest";
import { ApiError } from "../api/types";
import { classifyProbe } from "./betaAccess";

describe("classifyProbe", () => {
  it("treats a successful probe as approved", () => {
    expect(classifyProbe({ ok: true })).toBe("approved");
  });

  it("treats a 403 as waitlisted, not as a failure", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(403, "beta access required") })).toBe("pending");
  });

  it("treats a 500 as an error, not as waitlisted", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(500, "boom") })).toBe("error");
  });

  it("treats a 401 as an error here — the client already handles sign-out", () => {
    expect(classifyProbe({ ok: false, error: new ApiError(401, "unauthorised") })).toBe("error");
  });

  it("treats a network failure as an error, never as waitlisted", () => {
    expect(classifyProbe({ ok: false, error: new TypeError("Failed to fetch") })).toBe("error");
  });

  it("treats a probe timeout as an error, never as waitlisted", () => {
    expect(classifyProbe({ ok: false, error: new Error("beta access probe timed out") })).toBe("error");
  });

  it("never reports pending for a non-403 status", () => {
    for (const status of [400, 404, 418, 500, 502, 503]) {
      expect(classifyProbe({ ok: false, error: new ApiError(status, "x") })).toBe("error");
    }
  });
});
