import { useEffect, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { SignInForm } from "./SignInForm";
import { getSupabaseClient } from "./supabaseClient";
import type { BacklogRow, InitiativeRow, ViewInitiative } from "./types";
import { groupInitiatives } from "./viewModel";

interface ConfiguredTrackingAppProps {
  supabase: SupabaseClient;
}

const InitiativeCard = ({ initiative }: { initiative: ViewInitiative }) => (
  <article className="tracking-card" id={`initiative-${initiative.slug}`}>
    <div className="tracking-card__heading">
      <div>
        <span className="tracking-repo">{initiative.repo}</span>
        <h3>{initiative.title}</h3>
      </div>
      <time dateTime={initiative.updated}>{initiative.updated}</time>
    </div>

    <p className="tracking-card__next">{initiative.nextStep || "No next step recorded."}</p>

    {initiative.blocked_by.length > 0 && (
      <p className="tracking-card__blocked">
        Blocked by: {initiative.blocked_by.join(", ")}
      </p>
    )}

    <div className="tracking-card__links">
      {initiative.specUrl && (
        <a href={initiative.specUrl} target="_blank" rel="noreferrer">
          spec
        </a>
      )}
      {initiative.planUrl && (
        <a href={initiative.planUrl} target="_blank" rel="noreferrer">
          plan
        </a>
      )}
      {initiative.branchLink && (
        <a href={initiative.branchLink} target="_blank" rel="noreferrer">
          branch
        </a>
      )}
    </div>
  </article>
);

function ConfiguredTrackingApp({ supabase }: ConfiguredTrackingAppProps) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [initiatives, setInitiatives] = useState<InitiativeRow[]>([]);
  const [backlog, setBacklog] = useState<BacklogRow[]>([]);
  const [showDropped, setShowDropped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(false);

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

  useEffect(() => {
    if (!session) {
      setInitiatives([]);
      setBacklog([]);
      return;
    }

    let active = true;
    setLoadingData(true);
    setError(null);

    void Promise.all([
      supabase.from("tracking_initiatives").select("*").order("updated", { ascending: false }),
      supabase.from("tracking_backlog").select("*").order("position", { ascending: true }),
    ]).then(([initiativeResult, backlogResult]) => {
      if (!active) {
        return;
      }

      const queryError = initiativeResult.error ?? backlogResult.error;
      if (queryError) {
        setError(queryError.message);
      } else {
        setInitiatives((initiativeResult.data ?? []) as InitiativeRow[]);
        setBacklog((backlogResult.data ?? []) as BacklogRow[]);
      }
      setLoadingData(false);
    });

    return () => {
      active = false;
    };
  }, [session, supabase]);

  if (session === undefined) {
    return (
      <main className="tracking-state">
        <span className="spin" /> checking session…
      </main>
    );
  }

  if (!session) {
    return <SignInForm supabase={supabase} />;
  }

  const groups = groupInitiatives(initiatives, { showDropped });

  const signOut = async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
    }
  };

  return (
    <div className="tracking-shell">
      <header className="tracking-header">
        <div>
          <div className="tracking-wordmark">
            DELAPAN<span>_8</span>
          </div>
          <h1>Project tracking</h1>
        </div>
        <div className="tracking-header__actions">
          <span>{session.user.email}</span>
          <button className="btn" type="button" onClick={() => void signOut()}>
            sign out
          </button>
        </div>
      </header>

      <main className="tracking-main">
        {error && <p className="tracking-error tracking-error--banner">{error}</p>}

        <div className="tracking-toolbar">
          <p>{initiatives.length} initiatives</p>
          <label>
            <input
              type="checkbox"
              checked={showDropped}
              onChange={(event) => setShowDropped(event.target.checked)}
            />
            show dropped
          </label>
        </div>

        {loadingData ? (
          <div className="tracking-state">
            <span className="spin" /> loading tracker…
          </div>
        ) : (
          <>
            <section className="tracking-board" aria-label="Initiatives">
              {groups.map((group) => (
                <section className="tracking-group" key={group.status}>
                  <h2>
                    <span className={`tracking-status tracking-status--${group.status}`} />
                    {group.status}
                    <span>{group.items.length}</span>
                  </h2>
                  <div className="tracking-group__items">
                    {group.items.map((initiative) => (
                      <InitiativeCard initiative={initiative} key={initiative.slug} />
                    ))}
                  </div>
                </section>
              ))}
            </section>

            <section className="tracking-backlog">
              <h2>Backlog</h2>
              {backlog.length === 0 ? (
                <p className="placeholder">No backlog items.</p>
              ) : (
                <ol>
                  {backlog.map((item) => (
                    <li key={item.position}>
                      <span>{item.text}</span>
                      <span className="tracking-repo">{item.repo}</span>
                      {item.initiative_slug && (
                        <a href={`#initiative-${item.initiative_slug}`}>initiative</a>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export function TrackingApp() {
  try {
    return <ConfiguredTrackingApp supabase={getSupabaseClient()} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to configure tracking.";
    return (
      <main className="tracking-state">
        <p className="tracking-error">{message}</p>
      </main>
    );
  }
}
