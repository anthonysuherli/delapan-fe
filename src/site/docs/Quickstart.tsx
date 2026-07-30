import { CtaRow } from "../CtaRow";
import { CodeBlock } from "./CodeBlock";

/**
 * The quickstart section — install, run the MCP server or the HTTP API,
 * the tool table, explore's prerequisites, and the local-vs-cloud close.
 * Commands are the real engine commands, not illustrative placeholders.
 */
export function Quickstart() {
  return (
    <article className="docs-article">
      <h1>quickstart</h1>
      <p>
        delapan is a knowledge-base engine you run yourself. install it, point an MCP client or
        the HTTP API at it, and it starts building a KB from what you give it.
      </p>

      <h2>install</h2>
      <p>the local tier runs from a clone with uv.</p>
      <CodeBlock lang="bash">{`git clone https://github.com/anthonysuherli/delapan
cd delapan
uv sync --extra local`}</CodeBlock>

      <h2>run the MCP server</h2>
      <p>for claude code, or any MCP client, run the server directly:</p>
      <CodeBlock lang="bash">{`uv run python -m delapan.mcp.server`}</CodeBlock>

      <h2>run the HTTP API</h2>
      <p>if you'd rather talk to a loopback HTTP API, run:</p>
      <CodeBlock lang="bash">{`uv run python -m delapan.api.main`}</CodeBlock>

      <h2>tools</h2>
      <p>the MCP server exposes these tools:</p>
      <table className="docs-table">
        <thead>
          <tr>
            <th>tool</th>
            <th>what it does</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>delapan_resume</code>
            </td>
            <td>tap the current KB and return a preamble-first resume card</td>
          </tr>
          <tr>
            <td>
              <code>delapan_search</code>
            </td>
            <td>semantic recall over findings</td>
          </tr>
          <tr>
            <td>
              <code>delapan_explore</code>
            </td>
            <td>gap-fill exploration — needs an LLM key and a Tavily key</td>
          </tr>
          <tr>
            <td>
              <code>delapan_backlog</code>
            </td>
            <td>ranked gap/sparse queries the KB was asked and couldn't answer</td>
          </tr>
          <tr>
            <td>
              <code>delapan_projects</code>
            </td>
            <td>list projects and branches</td>
          </tr>
          <tr>
            <td>
              <code>delapan_propose_kg_schema</code>
            </td>
            <td>propose a knowledge-graph schema</td>
          </tr>
          <tr>
            <td>
              <code>delapan_set_kg_schema</code>
            </td>
            <td>approve a proposed schema</td>
          </tr>
          <tr>
            <td>
              <code>delapan_build_graph</code>
            </td>
            <td>build the graph from the approved schema</td>
          </tr>
          <tr>
            <td>
              <code>delapan_get_kg_schema</code>
            </td>
            <td>read the current schema</td>
          </tr>
          <tr>
            <td>
              <code>delapan_archive</code>
            </td>
            <td>archive or unarchive a project or kb — reversible, never deletes</td>
          </tr>
        </tbody>
      </table>

      <h2>before you run explore</h2>
      <p>
        <code>delapan_explore</code> needs an LLM key — anthropic, openai, or a gateway — and a{" "}
        <code>TAVILY_API_KEY</code>, both set in your environment. without them, the rest of the
        tools still work against what's already in the KB.
      </p>

      <p>
        the local tier is auth-less and SQLite-backed — nothing leaves your machine unless you
        point it at the cloud. the cloud beta is invite-gated.
      </p>

      <CtaRow />
    </article>
  );
}
