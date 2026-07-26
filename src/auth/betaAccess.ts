/**
 * Is this signed-in user actually allowed into the product?
 *
 * The backend gates on a beta_members row (require_beta) and answers 403 when
 * it is missing — a VALID session belonging to someone not yet approved. That
 * is a different thing from a bad token, and it must not be treated as one:
 * 403 leads to the waitlist screen, never to a sign-out.
 *
 * Anything else — network failure, 500, 401 — is reported as "error" rather
 * than guessed at. Falsely reporting "pending" would tell an approved user
 * they are waitlisted every time the network hiccups.
 */
import { ApiError } from "../api/types";

export type BetaAccess = "idle" | "checking" | "approved" | "pending" | "error";

export type ProbeOutcome = { ok: true } | { ok: false; error: unknown };

export function classifyProbe(outcome: ProbeOutcome): "approved" | "pending" | "error" {
  if (outcome.ok) return "approved";
  if (outcome.error instanceof ApiError && outcome.error.status === 403) return "pending";
  return "error";
}
