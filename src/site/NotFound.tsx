import { Logomark } from "../panels/Logomark";
import { SiteShell } from "./SiteShell";
import { usePageTitle } from "./usePageTitle";

/** The branded 404 — the catch-all for any path that isn't a real surface. */
export function NotFound() {
  usePageTitle("delapan — page not found");
  return (
    <SiteShell>
      <div className="ss-404">
        <Logomark size={48} />
        <h1>this page doesn't exist</h1>
        <div className="ss-404-links">
          <a href="/">home</a>
          <a href="/docs">docs</a>
          <a href="/login">sign in</a>
        </div>
      </div>
    </SiteShell>
  );
}
