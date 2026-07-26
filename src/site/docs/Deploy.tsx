import { CodeBlock } from "./CodeBlock";

/**
 * deploy surfaces — MCP in your editor, the local /api/* loopback, and the
 * cloud /v1 context API, all sitting on one Store protocol.
 */
export function Deploy() {
  return (
    <article className="docs-article">
      <h1>deploy surfaces</h1>
      <p>
        delapan is one engine exposed through a few different doors, depending on who's asking.
        an editor talks to it over MCP. a frontend or script on the same machine talks to it over
        a loopback HTTP API. a hosted product talks to it over a cloud context API. all three sit
        on top of the same engine core and the same storage seam — none of them is a separate
        implementation of the grounding logic.
      </p>

      <h2>MCP tools in your editor</h2>
      <p>
        run <code>python -m delapan.mcp.server</code> and any MCP client — Claude Code included —
        gets the tool surface directly: resume, search, explore, backlog, projects, and the
        schema propose/set/build/get tools covered earlier. this is the intended path for
        day-to-day use from an editor or agent session; nothing is deployed, the server just runs
        alongside you.
      </p>

      <h2>the local /api/* loopback</h2>
      <p>
        run <code>python -m delapan.api.main</code> instead, and you get a loopback-only HTTP
        mirror of that same surface — health, project listing, per-KB knowledge-graph read/write,
        findings list/get/delete, synopsis, resume, and explore over server-sent events. this is
        what a browser-based control panel talks to in local development; it binds to
        <code>127.0.0.1</code> only, by design.
      </p>

      <h2>the cloud /v1 context API</h2>
      <p>
        the hosted tier adds a wider surface — <code>/v1/*</code> and <code>/internal/*</code> —
        behind the <code>[cloud]</code> install extra, meant for products that want to call
        delapan as a context API rather than run it themselves. that tier is what a
        multi-tenant, authenticated deployment builds on; the local tier stays auth-less and
        single-machine on purpose.
      </p>

      <h2>one Store protocol underneath</h2>
      <p>
        none of these surfaces talk to storage directly — every one of them calls{" "}
        <code>get_store()</code>, which returns whichever backend is active. locally that's
        SQLite with <code>sqlite-vec</code>; in the cloud tier it's Supabase with pgvector. the
        engine code above the store line does not know or care which one it's talking to.
      </p>
      <CodeBlock lang="python">{`from delapan.store import get_store

store = get_store()          # SQLiteStore on the local tier
findings = store.match_findings(kb_id, embedding, limit=10)`}</CodeBlock>
      <p>
        pick the surface by who's consuming it, not by which one is "more correct" — an editor
        session, a local dev frontend, and a hosted product are three different callers of the
        same engine.
      </p>
    </article>
  );
}
