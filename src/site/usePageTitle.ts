import { useEffect } from "react";

/** Sets document.title for a site page. SPA last-write-wins; no restore. */
export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
