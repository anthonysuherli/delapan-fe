/**
 * Probes the API once per session to find out whether this user is beta
 * approved. The console renders no API-backed data of its own, so without
 * this probe the beta gate would be decorative on the client: a waitlisted
 * user would see a fully populated-looking console and only discover the
 * truth when they opened the graph.
 */
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getProjects } from "../api/client";
import { classifyProbe, type BetaAccess } from "./betaAccess";

// A hung backend (cold container, dropped connection) must not block the
// console forever behind "checking access…" with no sign-out. Racing the
// probe against a timeout and classifying that as "error" falls through to
// the console the same way any other probe failure does.
const PROBE_TIMEOUT_MS = 5000;

export function useBetaAccess(session: Session | null | undefined): BetaAccess {
  const [access, setAccess] = useState<BetaAccess>("idle");
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setAccess("idle");
      return;
    }
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setAccess("checking");
    const timeout = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => reject(new Error("beta access probe timed out")), PROBE_TIMEOUT_MS);
    });
    void Promise.race([getProjects(), timeout])
      .then(() => {
        if (active) setAccess(classifyProbe({ ok: true }));
      })
      .catch((error: unknown) => {
        if (active) setAccess(classifyProbe({ ok: false, error }));
      });
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [userId]);

  return access;
}
