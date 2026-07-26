import { useEffect, useRef, useState } from "react";

interface CodeBlockProps {
  children: string;
  lang?: string;
}

/**
 * The one inverted surface on the site: --p8-ink background, --p8-bone text,
 * JetBrains Mono via --p8-font-mono. The copy button writes `children` to the
 * clipboard and shows "copied" for 2s before reverting; a failed write leaves
 * the button state unchanged rather than claiming a false success. Revert
 * timer id is tracked in a ref and cleared on unmount / re-click — same
 * convention as LeftRail's useCountUp timer.
 */
export function CodeBlock({ children, lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const revertTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    return () => window.clearTimeout(revertTimer.current);
  }, []);

  function handleCopy() {
    window.clearTimeout(revertTimer.current);
    navigator.clipboard
      .writeText(children)
      .then(() => {
        setCopied(true);
        revertTimer.current = window.setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        /* copy unavailable; leave button state unchanged */
      });
  }

  return (
    <div className="docs-code">
      <div className="docs-code-bar">
        {lang ? <span className="docs-code-lang">{lang}</span> : null}
        <button type="button" className="docs-code-copy" onClick={handleCopy}>
          {copied ? "copied" : "copy"}
        </button>
      </div>
      <pre>
        <code>{children}</code>
      </pre>
    </div>
  );
}
