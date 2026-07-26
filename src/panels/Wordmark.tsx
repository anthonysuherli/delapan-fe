/**
 * The one wordmark. `display` is the DELAPAN_8 stamp (boot, auth cards);
 * `lower` is the bar identity (top bar, console). Size is contextual — pass
 * the surface's sizing class via className.
 */
interface WordmarkProps {
  form: "display" | "lower";
  className?: string;
}

export function Wordmark({ form, className }: WordmarkProps) {
  const cls = ["wm", form === "display" ? "wm--display" : "wm--lower", className]
    .filter(Boolean)
    .join(" ");
  if (form === "lower") return <span className={cls}>delapan</span>;
  return (
    <span className={cls}>
      DELAPAN<span className="wm-8">_8</span>
    </span>
  );
}
