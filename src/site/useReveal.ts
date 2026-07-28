/**
 * One-shot scroll reveal: tags matches with `.rv`, swaps in `.rv-in` the
 * first time each enters the viewport. No-op under prefers-reduced-motion —
 * the elements are then never hidden in the first place.
 */
import { useEffect } from "react";

export function useReveal(selector: string): void {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(document.querySelectorAll(selector));
    els.forEach((el) => el.classList.add("rv"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("rv-in");
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [selector]);
}
