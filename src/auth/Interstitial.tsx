/**
 * The one branded wait/error screen for session and access gates — replaces
 * the three bare `.tracking-state` variants so waiting reads as the
 * instrument warming up.
 */
import { Wordmark } from "../panels/Wordmark";

export function Interstitial({ line, error }: { line?: string; error?: string }) {
  return (
    <main className="auth-state">
      <Wordmark form="display" className="auth-state-wm" />
      {error ? (
        <p className="auth-err">{error}</p>
      ) : (
        <p className="auth-state-line">
          <span className="spin" /> {line}
        </p>
      )}
    </main>
  );
}
