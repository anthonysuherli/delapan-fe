import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

interface ChangelogItem {
  date: string;
  title: string;
  note: string;
}

interface ChangelogMonth {
  month: string;
  items: ChangelogItem[];
}

/**
 * Real milestones only, most recent first. Every entry maps to a commit or
 * merge in this repo's history, or — where tagged "· engine" — to a
 * controller-verified fact about the delapan engine (a separate repo this
 * one only consumes over REST, per CLAUDE.md). See the Task 9 report for the
 * entry-to-evidence table.
 */
const ENTRIES: ChangelogMonth[] = [
  {
    month: "july 2026",
    items: [
      {
        date: "2026-07-26",
        title: "landing page",
        note: "the public landing page shipped — problem, pillars, coverage banding, and where delapan plugs in.",
      },
      {
        date: "2026-07-26",
        title: "sign-up + invite-gated beta",
        note: "a public sign-up path opened, and new accounts land on an invite-gated waitlist until admitted.",
      },
      {
        date: "2026-07-26",
        title: "instrument-grade UI + live node growth",
        note: "the dashboard took a full visual pass — one test-enforced token system — and new nodes now animate into the graph instead of appearing instantly.",
      },
      {
        date: "2026-07-25",
        title: "console home",
        note: "signing in now lands on a console hub instead of straight into the graph.",
      },
      {
        date: "2026-07-25",
        title: "production deploy",
        note: "the dashboard went live in production at delapan.ai.",
      },
      {
        date: "2026-07-20",
        title: "hosted-tier auth · engine",
        note: "backend auth for the hosted tier merged, with an RLS audit hardening pass behind it.",
      },
      {
        date: "2026-07-16",
        title: "write-time finding resolution · engine",
        note: "the engine now resolves each new finding against what it already knows — add, update, no-op, or supersede — instead of appending a duplicate.",
      },
    ],
  },
  {
    month: "june 2026",
    items: [
      {
        date: "2026-06",
        title: "findings, synopsis, coverage · engine",
        note: "the engine's core loop went live: grounded findings, a synopsis spine, and coverage banding.",
      },
      {
        date: "2026-06",
        title: "knowledge-graph schema seam · engine",
        note: "the propose-then-approve knowledge-graph schema step shipped, ahead of graph extraction.",
      },
    ],
  },
];

/** The changelog — real milestones, grouped by month, newest first. */
export function ChangelogPage() {
  usePageTitle("delapan — changelog");

  return (
    <SiteShell active="changelog">
      <div className="changelog">
        <h1>changelog</h1>
        <p className="changelog-intro">
          beta — changes land continuously; this page records the ones that matter.
        </p>

        {ENTRIES.map((group) => (
          <section className="changelog-month" key={group.month}>
            <h2>{group.month}</h2>
            <ul className="changelog-list">
              {group.items.map((item) => (
                <li className="changelog-item" key={`${item.date}-${item.title}`}>
                  <span className="changelog-date">{item.date}</span>
                  <div className="changelog-body">
                    <p className="changelog-title">{item.title}</p>
                    <p className="changelog-note">{item.note}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </SiteShell>
  );
}
