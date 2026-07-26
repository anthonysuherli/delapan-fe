import { useState } from "react";

interface CodeBlockProps {
  children: string;
  lang?: string;
}

/**
 * The one inverted surface on the site: --p8-ink background, --p8-bone text,
 * JetBrains Mono via --p8-font-mono. The copy button writes `children` to the
 * clipboard and shows "copied" for 2s before reverting.
 */
export function CodeBlock({ children, lang }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    void navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
