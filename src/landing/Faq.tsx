/**
 * FAQ — id "faq". Prototype lines 151-188. Independent toggles (not an
 * accordion — multiple items can be open at once); item 0 is open on load.
 * Each trigger is a real <button> with aria-expanded/aria-controls pointing
 * at the answer's id (spec accessibility requirement).
 */
import { useState, type JSX } from "react";
import { FAQ_ITEMS, toggleFaq } from "./faqModel";

export function Faq(): JSX.Element {
  const [open, setOpen] = useState<Record<number, boolean>>({ 0: true });

  return (
    <section id="faq" className="lpv2-faq">
      <p className="lpv2-faq-label">questions</p>
      <div className="lpv2-faq-list">
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = Boolean(open[i]);
          const answerId = `lpv2-faq-answer-${i}`;
          return (
            <div key={item.q} className="lpv2-faq-item">
              <button
                type="button"
                className="lpv2-faq-trigger"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => setOpen((s) => toggleFaq(s, i))}
              >
                <span className="lpv2-faq-question">{item.q}</span>
                <span className="lpv2-faq-glyph" aria-hidden="true">
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p id={answerId} className="lpv2-faq-answer">
                  {item.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
