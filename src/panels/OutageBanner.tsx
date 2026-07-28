/**
 * Mid-session outage. The graph on screen is the user's real data, truthfully
 * loaded — so we keep it and say edits are paused, rather than replacing it with
 * an error screen that would tell them less than they already have.
 */
import { probeEngine } from "../api/engineStatus";

export function OutageBanner() {
  return (
    <div className="outage" role="status">
      <span className="outage-dot" />
      <span>
        the engine isn't responding — <b>edits are paused</b>. what you see was loaded before the
        connection dropped. retrying automatically.
      </span>
      <button className="btn" onClick={() => void probeEngine()}>
        retry now
      </button>
    </div>
  );
}
