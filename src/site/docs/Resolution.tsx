import { CodeBlock } from "./CodeBlock";

/**
 * resolution & history — the write-time ADD/UPDATE/NOOP/SUPERSEDE resolver
 * and the bi-temporal fields that let a finding be retired without being
 * deleted.
 */
export function Resolution() {
  return (
    <article className="docs-article">
      <h1>resolution &amp; history</h1>
      <p>
        every write to a KB's findings passes through a resolver before it reaches storage. the
        resolver compares the candidate finding against the top-k most similar findings already
        in that KB and decides what kind of write this actually is: brand new information, a
        refinement of something already there, confirmation of it, or a contradiction of it. that
        decision — not a blind insert — is what ends up persisted.
      </p>

      <h2>four outcomes</h2>
      <p>
        the resolver's verdict is one of four: <code>ADD</code> for a genuinely new finding,{" "}
        <code>UPDATE</code> when the candidate refines an existing one, <code>NOOP</code> when it
        merely corroborates one that is already there, and <code>SUPERSEDE</code> when it
        contradicts one. re-ingesting content that overlaps with what the KB already knows
        produces <code>UPDATE</code> or <code>NOOP</code>, not a duplicate row — this is what
        keeps a KB from accumulating near-identical findings every time you point exploration at
        overlapping sources.
      </p>

      <h2>retired, never deleted</h2>
      <p>
        when a finding is superseded, the old one is not removed. findings are bi-temporal: each
        carries a <code>valid_from</code> timestamp, and a superseded or contradicted finding gets
        an <code>invalidated_at</code> timestamp plus a <code>superseded_by</code> pointer to
        whatever replaced it. the losing finding stays in the store — queries just stop surfacing
        it as current. that history is what lets you trace how a KB's understanding of something
        changed, rather than only ever seeing its latest belief.
      </p>
      <p>
        this behavior is a config knob, not a hardcoded assumption: setting{" "}
        <code>memory.enabled: false</code> falls back to plain append-only <code>ADD</code>,
        which is the older behavior for KBs that don't need resolution. and if a KB already has
        duplicates from before the resolver existed, <code>scripts/dedup_backfill.py</code> retires
        them after the fact, dry-run by default.
      </p>

      <h2>a superseded finding</h2>
      <CodeBlock lang="json">{`{
  "id": "fnd_1c07",
  "text": "the store protocol ships a SQLite backend only.",
  "valid_from": "2026-06-02T09:12:00Z",
  "invalidated_at": "2026-07-04T14:40:00Z",
  "superseded_by": "fnd_1f3a",
  "resolution": "SUPERSEDE"
}`}</CodeBlock>
      <p>
        <code>fnd_1f3a</code> — the finding that replaced it — carries its own
        <code>valid_from</code> and no <code>invalidated_at</code>, marking it current. both rows
        stay in the store; only one of them answers queries.
      </p>
    </article>
  );
}
