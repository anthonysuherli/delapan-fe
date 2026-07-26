import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

/** The about page — why, what it is, who. Three short sections, brand voice. */
export function AboutPage() {
  usePageTitle("delapan — about");

  return (
    <SiteShell active="about">
      <div className="about">
        <article className="docs-article">
          <h1>about</h1>

          <h2>why</h2>
          <p>
            ask an agent why it believes something, and the honest answer is often just "a vector
            search returned this text." no source, no timestamp, no way to tell whether the fact
            still holds. delapan exists to make that answerable: every claim an agent uses should
            trace back to where it came from and when it was true, not just to a similarity score.
            that trail is what makes an answer worth trusting instead of just plausible.
          </p>

          <h2>what it is</h2>
          <p>
            delapan is a memory engine, not a vector database. a vector store holds embeddings and
            returns neighbours — it has no opinion about whether a new fact confirms, refines, or
            contradicts one already there. delapan resolves that before anything is written: add,
            update, no-op, or supersede. a superseded fact is retired, never deleted — it keeps a{" "}
            <code>valid_from</code> and an <code>invalidated_at</code>, so the base can still show
            what it used to believe, not only what it believes now. that resolver, and the graph
            this dashboard renders on top of it, is the whole engine.
          </p>

          <h2>who</h2>
          <p>
            delapan is built solo. the engine — research, resolution, serving — is open-core and
            free to run locally against sqlite; its source sits on GitHub. this dashboard is the
            hosted cloud tier, a supabase-backed workspace behind an invite-gated beta, for anyone
            who wants the graph without running the engine themselves.
          </p>
        </article>
      </div>
    </SiteShell>
  );
}
