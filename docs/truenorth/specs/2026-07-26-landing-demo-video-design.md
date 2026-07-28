# Design: landing-page resolution demo video

**Date:** 2026-07-26
**Branch:** `design/landing-demo-video`, cut from `main` (`a3948cc`)
**Repo:** `delapan-fe` — `8star/delapan-ai/frontend`

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public
landing page at `/`."* No Invariant or Non-Goal conflict: nothing here touches the `Store` seam,
auth, RLS, provenance, or the engine, and it adds no billing and no multi-member org surface.

A 30-second silent video, rendered from an HTML composition with
[HyperFrames](https://hyperframes.video/), showing write-time fact resolution. It sits below the
fold on the landing page behind a poster and a click. The hero is untouched.

---

## The constraint this changes, and why that needs saying out loud

The shipped landing spec (`2026-07-26-landing-page-design.md` §3) does not merely omit motion; it
argues for its absence:

> **No autoplay, no hero animation, no countdown** — calm technology governs marketing too.
> […] A page selling auditability that overclaimed, animated, or invented numbers would fail its
> own test. **That constraint is the design.**

Adding video to that page is a reversal, and pretending otherwise would be the exact species of
quiet overclaiming the page is against. So the reversal is scoped and written down:

| Held | Changed |
|---|---|
| No autoplay, ever | One video exists on the page |
| No ambient motion — nothing moves unbidden | It plays on user click, below the fold |
| Hero stays static | |
| No invented metrics, no `planned` feature shown as shipped | |

The load-bearing half of the original constraint — *the page does not perform at you* — survives
intact. What changes is that a visitor who wants the mechanism demonstrated can ask for it.

**Implementation must amend the landing spec in the same change.** Wording in §6 below. A future
reader who finds this video and reads the shipped spec would otherwise correctly conclude it should
not exist.

## What it shows, and the claims constraint

The landing spec requires every load-bearing claim to map to a **shipped** row in
`backend/README.md`'s "What's inside" table. This video shows **write-time resolution**
(`core/memory/`, shipped): candidates resolve ADD / UPDATE / NOOP / SUPERSEDE against top-k similar
existing findings before being written, and the loser is *retired* via bi-temporal
`invalidated_at` / `superseded_by` rather than deleted.

This is the page's own thesis — *"corrects itself when the facts move, without ever losing what it
knew before"* — made visible.

Deliberately **not** filmed: live graph growth. It is the most cinematic thing delapan could show
and it is marked `planned` in the claims table. A video arguing for honesty may not open by
claiming an unshipped feature.

---

## 1. Placement

`LandingApp.tsx` composes sections from a `SECTIONS` array and derives each kicker index from array
position (`index={i + 1}`) — per its own docblock, explicitly so the numbering cannot desync. The
placement change is therefore one line:

```ts
const SECTIONS = [Problem, Pillars, Resolution, Coverage, WhereItPlugsIn, WhatItIsnt];
```

`Resolution` goes directly after `Pillars` because `Pillars` is where SUPERSEDE is argued in prose;
the video is that argument shown rather than a new one. `Coverage`, `WhereItPlugsIn` and
`WhatItIsnt` renumber themselves. **No other file changes for placement** — preserve the array
derivation; do not hardcode an index.

## 2. Component

One new file, `src/landing/Resolution.tsx`, matching the existing section signature
(`{ index }: { index: number }`).

```
section
  kicker + heading + lede            ← also the text alternative (see a11y below)
  <video controls preload="none" playsInline poster="/demo-resolution-poster.png">
    <source src="/demo-resolution.mp4" type="video/mp4" />
    <p> fallback copy + link to the docs </p>
  </video>
```

**`preload="none"` is the entire performance argument.** The section is below the fold, so the
video can never be the LCP element, and no video bytes move until a click. The poster is exported
from frame one of the same composition, so it cannot drift from what plays.

**No `<track>` element.** The earlier sketch of this design called for a captions track; that was
wrong for a silent video. `kind="captions"` exists to transcribe audio, and there is none — the
story is carried by burned-in kinetic typography in the composition itself. The correct
accessibility treatment is a **text alternative in the section prose**: the lede states the three
beats in words, so the section is complete without ever playing the video. That prose is a
deliverable, not decoration.

Native `controls` gives keyboard operability and a familiar play affordance for free. No custom
player chrome.

## 3. Video source and render pipeline

```
video/resolution-demo/
  index.html          the composition — plays as-is in a browser, no build step
  design.md           the --p8-* palette values, so video and page share one source of truth
  hyperframes-core/   authoring contract
```

Chosen over hosting the artifact on Vercel Blob (adds a storage dependency and an env var the local
tier does not need) and over a separate video repo (the composition drifts from the copy it
illustrates).

**Rendering stays an offline authoring step.** `npm run build` remains `tsc --noEmit && vite build`,
unchanged. A separate script — `npm run video:render` — invokes the HyperFrames CLI and writes:

```
public/demo-resolution.mp4
public/demo-resolution-poster.png
```

Both artifacts are committed and served by Vercel as static assets. HyperFrames renders by seeking
frames in headless Chrome and encoding with FFmpeg; wiring that into `npm run build` would require
Chrome and FFmpeg on the Vercel builder for every deploy.

**HyperFrames is not a project dependency at all** — not `dependencies`, not `devDependencies`. It
renders through Puppeteer, which downloads a Chromium binary on install, and Vercel installs
devDependencies on every build (it must — `vite` and `typescript` live there). Listing it would pull
~150MB of Chromium into every production deploy of a page that only serves a finished MP4. The
`video:render` script invokes it via `npx` instead, so the repo's dependency graph is untouched and
the composition stays plain HTML that needs nothing installed to open. *(Amended 2026-07-27 during
planning; the original draft of this section said `devDependencies`.)* The exact CLI invocation gets
pinned during implementation.

**Byte budget: 3 MB for the MP4.** Above that, reduce duration or resolution rather than accepting
it — this file enters git history permanently.

## 4. Content — three beats, ~30s, silent

| Time | Beat |
|---|---|
| 0:00–0:04 | Title card: a fact you already hold, and its source |
| 0:04–0:12 | **Existing finding** on screen with its `grounded_in` provenance line |
| 0:12–0:20 | **A contradicting candidate arrives.** It is compared against top-k similar findings; the four verdicts ADD / UPDATE / NOOP / SUPERSEDE are shown, and SUPERSEDE lights |
| 0:20–0:27 | **The old fact does not vanish.** It dims, gains `invalidated_at`, and `superseded_by` points at the new one — both remain on screen |
| 0:27–0:30 | End card: wordmark, "nothing is deleted. only retired." |

Beat 4 is the payload; beats 1–3 exist to set it up. If the piece runs long in review, compress
beats 1–3, never beat 4.

Typography and the ■ ▲ ● glyphs come from the real encoding, and colours from the real `--p8-*`
values via `design.md`. No numbers appear that are not literal field names — there is no verified
delapan benchmark, and the landing spec forbids inventing one.

## 5. Styles

New `.lp-demo-*` rules appended to `src/styles/landing.css`, following the existing bare-`.lp-*`
convention (scoping comes from rendering inside `SiteShell`'s `.lp` wrapper, not from compound
selectors).

`landing.css` is already listed in the `SHEETS` map of **`src/styles/literals.test.ts`**, so the new
CSS is held to that gate automatically with no test edit: no hex, no `rgba()`, no px
`border-radius`, no integer `z-index`. Every value resolves through `--p8-*`. If an exception is
genuinely unavoidable it goes in that file's hand-grown `ALLOW` list with a one-line reason — but
this section should need none.

The video element is constrained by `max-width` and an `aspect-ratio` so no layout shift occurs
between poster and playback.

**Amend the `landing.css` docblock.** It currently reads *"Hairlines, no motion."* It becomes: no
*ambient* motion; motion only on user request. Left unedited, the file lies about itself.

## 6. Landing-spec amendment (exact wording)

Add to `2026-07-26-landing-page-design.md` §3, immediately after the "No autoplay, no hero
animation, no countdown" bullet:

> **Amended 2026-07-26** — one exception, scoped: a single user-initiated demo video below the
> fold (`Resolution`, see `2026-07-26-landing-demo-video-design.md`). No autoplay, no ambient
> motion, hero unchanged, nothing moves until clicked. The constraint's purpose — the page does not
> perform at you — is preserved; what changed is that a visitor may ask for the mechanism to be
> demonstrated.

## 7. Verification

1. **`npm run build`** passes — strict, `noUnusedLocals` / `noUnusedParameters`.
2. **`npm run test`** passes — `literals.test.ts` picks up the new landing CSS with no test change.
3. **Browser pass at 1280 and 375** — section renders, poster displays, click plays, playback is
   legible at 375px width, and the keyboard reaches and operates the controls.
4. **LCP measured with the section present**, against the landing spec's < 2.5s bar. Measured, not
   argued from `preload="none"`.
5. **Broken-source check** — rename the MP4 and confirm the page degrades to poster plus fallback
   copy rather than an empty box.
6. **Text-alternative check** — with the video removed entirely, the section still states its
   argument in prose.
7. **Artifact size** — MP4 under the 3 MB budget.

## Risks

- **A committed binary is permanent in git history.** The 3 MB budget is the mitigation; re-renders
  overwrite one file rather than accumulating variants.
- **Video content is unreviewed marketing.** Every field name traces to `core/memory/`, but pacing
  and emphasis are judgement calls to review before this is public.
- **HyperFrames is young** (released 2026-04-17, single-machine rendering). It is a build-time-only
  dependency producing a plain MP4, so the blast radius of the project going stale is bounded: the
  committed artifact keeps working, and the composition is plain HTML that any renderer could
  replace.
- **New `video/` tree and `devDependencies` in a frontend that is deliberately thin.** Contained by
  keeping it out of `npm run build` and out of the bundle.

## Repo facts verified for this design (2026-07-26 — code over docs)

- The landing page runs on **`--p8-*` tokens from `site.css`** (the pixel-8 restage), not the
  `--chrome-*` / `--state-*` tokens the landing spec describes.
- `Grounded` / `SelfCorrecting` / `NothingLost` were consolidated into a single **`Pillars.tsx`** —
  eight component files on disk, not the spec's ten-row table.

Both are drift in the shipped landing spec. Out of scope to fix here; recorded so the next reader
is not misled.

## Out of scope

- Any change to the hero.
- Off-landing video assets (README embed, social clips, launch video) — HyperFrames could produce
  them from the same composition, but they are not this change.
- Opening self-serve sign-up. The CTA still points at invite-gated `/login`; the vision's
  hardening-before-public-sign-up gate is untouched by this work.
