/**
 * The one analytics entry point. Three signal types, deliberately separated:
 *
 *   captureError  ──▶ exceptions — real bugs only
 *   captureEvent  ──▶ ops + product (engine_unreachable, signed_up, …)
 *
 * Expected states (unreachable / unauthorized / forbidden) have defined screens
 * and are NOT exceptions — filing them as such buries real bugs.
 *
 * persistence:"memory" is load-bearing, not a preference: PrivacyPage's cookies
 * section states "no tracking or advertising cookies". Do not change it without
 * changing that page.
 */
import type { PostHogConfig } from "posthog-js";
import posthog from "./posthog-lazy";

export const POSTHOG_CONFIG: Partial<PostHogConfig> = {
  api_host: "https://us.i.posthog.com",
  persistence: "memory",
  capture_pageview: false,
  capture_exceptions: false, // we route exceptions explicitly, see captureError
};

export function initAnalytics(): void {
  const key = (import.meta.env as Record<string, string | undefined>).VITE_POSTHOG_KEY ?? "";
  if (!key) return;
  posthog.init(key, POSTHOG_CONFIG);
  posthog.capture("$pageview");

  window.addEventListener("error", (event) => captureError(event.error ?? event.message));
  window.addEventListener("unhandledrejection", (event) => captureError(event.reason));
}

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  const err = error instanceof Error ? error : new Error(String(error));
  posthog.captureException(err, context);
}

export function captureEvent(name: string, props?: Record<string, unknown>): void {
  posthog.capture(name, props);
}
