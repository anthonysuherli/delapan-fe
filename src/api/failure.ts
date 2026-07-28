/**
 * One vocabulary for "the engine did not give us what we asked for".
 *
 *   fetch threw ──▶ unreachable        401 ──▶ unauthorized
 *   bad JSON    ──▶ parse              403 ──▶ forbidden
 *   any status  ──▶ server             (everything else)
 *
 * `unreachable` is the only kind with no HTTP response, so it carries status 0.
 * EngineFailure extends ApiError so every existing `instanceof ApiError` narrow
 * — betaAccess.ts, LeftRail's 503 branch, authHeaders.test.ts — keeps working.
 */
import { ApiError } from "./types";

export type EngineFailureKind =
  | "unreachable"
  | "unauthorized"
  | "forbidden"
  | "server"
  | "parse";

export class EngineFailure extends ApiError {
  readonly kind: EngineFailureKind;

  constructor(kind: EngineFailureKind, status: number, message: string) {
    super(status, message);
    this.name = "EngineFailure";
    this.kind = kind;
  }
}

/** fetch rejects with TypeError on a network-level failure — that, and only that,
 *  means unreachable. A SyntaxError means we got bytes we could not read. */
export function classify(err: unknown, status?: number): EngineFailureKind {
  if (err instanceof TypeError) return "unreachable";
  if (err instanceof SyntaxError) return "parse";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  return "server";
}
