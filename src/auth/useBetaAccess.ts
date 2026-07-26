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

export function useBetaAccess(session: Session | null | undefined): BetaAccess {
  const [access, setAccess] = useState<BetaAccess>("idle");
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!userId) {
      setAccess("idle");
      return;
    }
    let active = true;
    setAccess("checking");
    void getProjects()
      .then(() => {
        if (active) setAccess(classifyProbe({ ok: true }));
      })
      .catch((error: unknown) => {
        if (active) setAccess(classifyProbe({ ok: false, error }));
      });
    return () => {
      active = false;
    };
  }, [userId]);

  return access;
}
