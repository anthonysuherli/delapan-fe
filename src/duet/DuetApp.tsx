import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { SignInForm } from "../tracking/SignInForm";
import { getSupabaseClient } from "../tracking/supabaseClient";

interface DuetReportRow {
  id: string;
  name_a: string;
  name_b: string;
  code_a: string;
  code_b: string;
  created_at: string;
}

/* Messages crossing the iframe boundary carry only summarised profile codes —
   the same ~135-char strings partners swap in two-device mode. */
interface DuetReportMessage {
  source: "duet";
  type: "report" | "ready";
  nameA?: string;
  nameB?: string;
  codeA?: string;
  codeB?: string;
}

const isDuetMessage = (data: unknown): data is DuetReportMessage =>
  typeof data === "object" && data !== null && (data as { source?: unknown }).source === "duet";

function ConfiguredDuetApp({ supabase }: { supabase: SupabaseClient }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [reports, setReports] = useState<DuetReportRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [frameEpoch, setFrameEpoch] = useState(0);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
      }
    });

    void supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) {
        return;
      }
      if (sessionError) {
        setError(sessionError.message);
      }
      setSession(data.session);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const loadReports = useCallback(() => {
    void supabase
      .from("duet_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (queryError) {
          setError(queryError.message);
        } else {
          setReports((data ?? []) as DuetReportRow[]);
        }
      });
  }, [supabase]);

  useEffect(() => {
    if (!session) {
      setReports([]);
      return;
    }
    loadReports();
  }, [session, loadReports]);

  useEffect(() => {
    if (!session) {
      return;
    }
    const onMessage = (event: MessageEvent) => {
      if (!isDuetMessage(event.data) || event.data.type !== "report") {
        return;
      }
      const { nameA, nameB, codeA, codeB } = event.data;
      if (!nameA || !nameB || !codeA || !codeB) {
        return;
      }
      void supabase
        .from("duet_reports")
        .insert({ name_a: nameA, name_b: nameB, code_a: codeA, code_b: codeB })
        .then(({ error: insertError }) => {
          if (insertError) {
            setError(`Report shown but not saved: ${insertError.message}`);
          } else {
            setError(null);
            loadReports();
          }
        });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [session, supabase, loadReports]);

  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }

  if (!session) {
    return (
      <SignInForm
        supabase={supabase}
        title="Duet"
        subtitle="Sign in with your delapan account — joint reports save under it."
      />
    );
  }

  const openSaved = (row: DuetReportRow) => {
    frameRef.current?.contentWindow?.postMessage(
      { source: "duet-host", type: "load", codeA: row.code_a, codeB: row.code_b },
      window.location.origin,
    );
  };

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  };

  return (
    <div className="tracking-shell" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="tracking-header">
        <div>
          <div className="tracking-wordmark">
            DELAPAN<span>_8</span>
          </div>
          <h1>Duet</h1>
        </div>
        <div className="tracking-header__actions">
          {reports.length > 0 && (
            <select
              className="inp"
              defaultValue=""
              onChange={(event) => {
                const row = reports.find((r) => r.id === event.target.value);
                if (row) {
                  openSaved(row);
                }
                event.target.value = "";
              }}
            >
              <option value="" disabled>
                saved reports ({reports.length})
              </option>
              {reports.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.name_a} &amp; {row.name_b} — {row.created_at.slice(0, 10)}
                </option>
              ))}
            </select>
          )}
          <button className="btn" type="button" onClick={() => setFrameEpoch((n) => n + 1)}>
            new session
          </button>
          <span>{session.user.email}</span>
          <button className="btn" type="button" onClick={() => void signOut()}>
            sign out
          </button>
        </div>
      </header>

      {error && <p className="tracking-error tracking-error--banner">{error}</p>}

      <iframe
        key={frameEpoch}
        ref={frameRef}
        src="/duet-app.html"
        title="Duet — the Midline for two"
        style={{ border: 0, width: "100%", flex: 1 }}
      />
    </div>
  );
}

export function DuetApp() {
  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseClient();
  } catch (configError) {
    return (
      <main className="tracking-state">
        {configError instanceof Error ? configError.message : "Supabase is not configured."}
      </main>
    );
  }
  return <ConfiguredDuetApp supabase={supabase} />;
}
