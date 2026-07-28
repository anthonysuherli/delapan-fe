/**
 * The one moving thing on this page, and it only moves when asked: a 30s
 * silent film of write-time resolution. `preload="none"` is the whole
 * performance story — the section is below the fold, so the video can never
 * be the LCP element and no video bytes move until a click. The prose is the
 * text alternative, not a caption: the section still makes its argument with
 * the video removed entirely, which is why there is no <track> (there is no
 * audio to transcribe).
 */
export function Resolution({ index }: { index: number }) {
  return (
    <section className="lp-inner lp-section">
      <p className="lp-kicker">{String(index).padStart(2, "0")} — watch it correct itself</p>
      <h2>a contradiction doesn't overwrite. it supersedes.</h2>
      <p className="lp-body">
        Thirty seconds, no sound. A finding already in the base carries the source it came from. A
        contradicting candidate arrives and is resolved against what is already there —{" "}
        <span className="lp-code">add</span>, <span className="lp-code">update</span>,{" "}
        <span className="lp-code">noop</span> or <span className="lp-code">supersede</span>. Here it
        supersedes: the old fact stays exactly where it was, stamped{" "}
        <span className="lp-code">invalidated_at</span> and pointing at what replaced it. The base
        ends up current without having forgotten anything.
      </p>

      <figure className="lp-demo">
        <video
          className="lp-demo-video"
          controls
          preload="none"
          playsInline
          poster="/demo-resolution-poster.png"
        >
          <source src="/demo-resolution.mp4" type="video/mp4" />
          <p className="lp-body">
            This browser can't play the clip. It shows a contradicting finding resolving as
            supersede — described in full above.
          </p>
        </video>
        <figcaption className="lp-demo-cap">
          write-time resolution — <span className="lp-code">core/memory/</span> · 0:30 · silent
        </figcaption>
      </figure>
    </section>
  );
}
