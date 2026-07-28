# Landing Demo Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use truenorth:subagent-driven-development (recommended) or truenorth:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 30-second silent video to the delapan.ai landing page, below the fold behind a poster and a click, showing a contradicting finding resolving as SUPERSEDE rather than overwriting.

**Architecture:** The video is authored as a plain HTML composition under `video/resolution-demo/` and rendered to MP4 by HyperFrames (headless Chrome frame-seek + FFmpeg) as an **offline step**. The rendered MP4 and poster are committed to `public/` and served by Vercel as static assets. On the page, a new `Resolution` section renders a bare `<video controls preload="none" poster>` — no player library, no runtime dependency. `npm run build` is unchanged.

**Vision goals served:** *"Hosted public tier with account isolation — delapan.ai serves a public landing page at `/`."*

**Tech Stack:** React 18 + TypeScript (strict), Vite 6, Vitest (node environment, no DOM), plain CSS with `--p8-*` tokens, HyperFrames CLI via `npx` (not a project dependency).

**Spec:** `docs/truenorth/specs/2026-07-26-landing-demo-video-design.md`
**Branch:** `design/landing-demo-video` (already exists, cut from `main` @ `a3948cc`, currently at `0659a3b`)

## Global Constraints

Every task's requirements implicitly include this section.

- **`npm run build` must remain exactly `tsc --noEmit && vite build`.** Rendering never enters the build; the Vercel builder must never need Chrome or FFmpeg.
- **HyperFrames must NOT be added to `package.json` dependencies or devDependencies.** *(This corrects the spec, which said devDependencies.)* HyperFrames renders through Puppeteer, which downloads a Chromium binary on install; Vercel installs devDependencies on every build, so listing it would pull Chromium into every production deploy. Invoke it through `npx` from the `video:render` script instead.
- **MP4 byte budget: 3 MB.** Over budget, reduce duration or resolution — do not accept it. The file is permanent in git history.
- **No autoplay, ever.** No ambient motion. The hero is not touched. Nothing on the page moves until a user clicks.
- **No `<track>` element and no `.vtt` artifact.** The video is silent; captions transcribe audio. The accessibility treatment is the text alternative in the section prose.
- **The literal-scan gate applies:** `src/styles/landing.css` is already in the `SHEETS` map of `src/styles/literals.test.ts`. New CSS may contain no hex colours, no `rgba()`, no px `border-radius`, and no integer `z-index`. Every colour, radius, spacing and font value resolves through a `--p8-*` token from `site.css`.
- **Raw `px` is allowed only for structural measures** (max-widths, breakpoints), matching `landing.css`'s existing convention — never for brand scale.
- **No invented metrics.** There is no verified delapan benchmark. Only literal field names from `core/memory/` appear in the video.
- **Section kicker indices derive from array position** in `LandingApp.tsx` (`index={i + 1}`). Never hardcode an index.
- **The build is strict:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`. Unused imports fail the build.

## Known limitation: no DOM test infrastructure

Per `CLAUDE.md`, this repo's Vitest suite runs in a **node environment with no DOM**. There is no jsdom, no testing-library, and no component test anywhere in `src/`. Task 3 therefore has **no new unit test** — adding DOM testing infrastructure is scope the spec did not authorize, and inventing a fake test would be worse than naming the gap.

Task 3's real automated gate is `src/styles/literals.test.ts`, which scans the new CSS with no test edit, plus `npm run build`. Its behavioural gate is the scripted browser pass in Task 4. This is stated so a reviewer knows the absence is deliberate.

---

### Task 1: Toolchain spike — a skeleton composition renders to MP4

The unknown in this whole plan is whether HyperFrames installs and renders cleanly on this machine. Find out before authoring 30 seconds of content. **Do not author the real composition in this task.**

**Files:**
- Create: `video/resolution-demo/` (scaffolded by the CLI)
- Create: `video/README.md`
- Modify: `package.json` (scripts only — no dependency changes)
- Modify: `.gitignore`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `npm run video:render` command, and the **recorded exact CLI syntax** written into `video/README.md` for Task 2 to use.

- [ ] **Step 1: Confirm FFmpeg is present**

```bash
ffmpeg -version | head -1
```

Expected: a version line. If "command not found", stop and install it (`brew install ffmpeg`) before continuing — HyperFrames cannot encode without it.

- [ ] **Step 2: Discover the CLI surface**

```bash
npx --yes @hyperframes/cli --help
```

Expected: usage output listing subcommands (create/preview/lint/render or similar). **Read it. Do not guess the syntax** — this plan deliberately does not hardcode subcommand names, because they were not verified when it was written. Note the exact create and render invocations.

- [ ] **Step 3: Scaffold a project into `video/resolution-demo`**

Use the create/init subcommand you found in Step 2, targeting `video/resolution-demo`. Then look at what it produced:

```bash
ls -la video/resolution-demo/
```

Expected: at minimum an `index.html`, plus the `hyperframes-core/` authoring contract and a `design.md`. **Read `hyperframes-core/` now** — it is the authoring contract that defines the `data-*` timing hooks Task 2 needs. Task 2 depends on you having read it.

- [ ] **Step 4: Render the untouched scaffold**

Run the render subcommand from Step 2 against `video/resolution-demo`, writing to a scratch path (not `public/` yet).

Expected: an `.mp4` file exists and plays. If rendering fails, fix it here — this is the task that exists to absorb that failure.

- [ ] **Step 5: Add the render script**

In `package.json`, add to `scripts` **only** — leave `build`, `dev`, `test`, `preview` untouched and add nothing to `dependencies` or `devDependencies`:

```json
"video:render": "npx --yes @hyperframes/cli <render-subcommand-from-step-2> video/resolution-demo --out public/"
```

Replace `<render-subcommand-from-step-2>` and the output-flag spelling with what Step 2 actually showed.

- [ ] **Step 6: Verify the script runs and the build is untouched**

```bash
npm run video:render
node -e "console.log(require('./package.json').scripts.build)"
```

Expected: the render completes, and the build script prints exactly `tsc --noEmit && vite build`.

- [ ] **Step 7: Ignore render scratch output**

Append to `.gitignore`:

```
# HyperFrames render scratch — the shipped artifacts live in public/
video/**/out/
video/**/node_modules/
```

- [ ] **Step 8: Record the toolchain for the next task**

Create `video/README.md`:

```markdown
# video/

HyperFrames compositions. Rendered **offline** — never part of `npm run build`,
because the Vercel builder has no Chrome or FFmpeg.

HyperFrames is deliberately **not** in `package.json`: it pulls Puppeteer, which
downloads a Chromium binary on install, and Vercel installs devDependencies on
every build. It runs through `npx` instead.

## Render

```bash
npm run video:render
```

Writes `public/demo-resolution.mp4` and `public/demo-resolution-poster.png`.
Both are committed. Budget: **MP4 under 3 MB.**

## Verified toolchain (fill in from your run)

- CLI version: <output of `npx --yes @hyperframes/cli --version`>
- Create command: <exact>
- Render command: <exact>
- FFmpeg version: <output of `ffmpeg -version | head -1`>

## Compositions

- `resolution-demo/` — 30s silent, write-time fact resolution. Shown on the
  landing page in `src/landing/Resolution.tsx`.
```

Replace every `<...>` with the real value from your run before committing. Leaving an angle-bracket placeholder in a committed file fails this task.

- [ ] **Step 9: Commit**

```bash
git add package.json .gitignore video/
git commit -m "build(video): hyperframes render script, out of the dependency graph

Invoked via npx rather than added to package.json — hyperframes pulls
Puppeteer, which downloads Chromium on install, and Vercel installs
devDependencies on every build. npm run build is unchanged."
```

---

### Task 2: The real composition, rendered to `public/`

**Files:**
- Modify: `video/resolution-demo/index.html`
- Modify: `video/resolution-demo/design.md`
- Create: `public/demo-resolution.mp4` (rendered artifact, committed)
- Create: `public/demo-resolution-poster.png` (rendered artifact, committed)

**Interfaces:**
- Consumes: the render command recorded in `video/README.md` by Task 1; the authoring contract in `video/resolution-demo/hyperframes-core/`.
- Produces: `/demo-resolution.mp4` and `/demo-resolution-poster.png` as public-root paths. **Task 3 hardcodes these two exact filenames** — do not rename them.

- [ ] **Step 1: Put the palette in `design.md`**

The video and the page must resolve to the same values, not merely resemble each other. Copy these verbatim from `src/styles/site.css` into `video/resolution-demo/design.md`:

```
ink        #0B0F14   background
bone       #F7F6F2   figure on dark / primary text on dark
coral      #FF6B4A   THE accent — one hot colour, used once
muted      #6B7785   secondary text, metadata
positive   #1F9D6B   the surviving fact
critical   #C2453B   the contradiction arriving

display    Space Grotesk    headings
mono       JetBrains Mono   field names, ids, verdicts
```

Field names (`grounded_in`, `invalidated_at`, `superseded_by`) and the four verdicts render in **mono**. Prose renders in display.

- [ ] **Step 2: Author the composition to this storyboard**

Total 30s at 1920×1080. Use the `data-*` timing hooks from `hyperframes-core/` — the contract you read in Task 1 Step 3.

| Time | Beat | On screen |
|---|---|---|
| 0:00–0:04 | Title | "you already know something." |
| 0:04–0:12 | The held fact | A card: a claim, and beneath it `grounded_in` with its source. Calm, `bone` on `ink`. |
| 0:12–0:20 | The contradiction | A second card slides in, marked in `critical`. The four verdicts `add` / `update` / `noop` / `supersede` appear in mono; three stay dim, **`supersede` lights in `coral`**. |
| 0:20–0:27 | **The payload** | The old card does **not** disappear. It dims, gains `invalidated_at`, and a line draws from it to the new card labelled `superseded_by`. Both cards remain on screen together. |
| 0:27–0:30 | End | Wordmark + "nothing is deleted. only retired." |

**Beat 4 is the entire point.** If the piece runs long in review, compress beats 1–3 and never beat 4. Both cards must be visible simultaneously at 0:27 — that co-presence *is* the argument.

Constraints: no numbers that are not literal field names. No sound. No live-graph footage (it is a `planned` feature and may not be shown). `coral` is used exactly once, on `supersede`.

- [ ] **Step 3: Preview, then run the composition gate**

Open `video/resolution-demo/index.html` directly in a browser — HyperFrames compositions play as-is with no build step. Scrub it. Fix pacing here, where iteration is instant, rather than after a render.

Then run the toolchain's own gate before spending a render on it:

```bash
npx --yes hyperframes@0.7.76 check video/resolution-demo
```

`check` runs lint, runtime validation in headless Chrome (JS errors, missing assets, contrast), and layout inspection as one pass. Fix everything it reports. A contrast warning here is a real accessibility finding, not noise — treat it as blocking.

- [ ] **Step 4: Render**

```bash
npm run video:render
ls -lh public/demo-resolution.mp4 public/demo-resolution-poster.png
```

Expected: both files exist.

- [ ] **Step 5: Check the budget and the duration**

**There is no `ffmpeg` or `ffprobe` on this machine** — Task 1 verified both are absent from PATH, and HyperFrames renders anyway because it bundles its own encoder. Do not reach for them.

The renderer prints a summary line on completion, like `25.6 KB · 10.0s video`. Read it. Cross-check the file size directly:

```bash
ls -l public/demo-resolution.mp4
```

Expected: duration ≈ 30s (±3s), size **under 3145728 bytes** (3 MB).

If over budget: drop to 1280×720, or lower the quality preset, then re-render and re-check. `npx --yes hyperframes@0.7.76 benchmark` renders across preset fps/quality/worker configs and compares speed against file size — use it if you need to find a setting that fits. Do not proceed over budget.

- [ ] **Step 6: Produce the poster with `snapshot`**

The poster must be frame one of this exact render, or it produces a visible jump on play. HyperFrames has a first-class command for this:

```bash
npx --yes hyperframes@0.7.76 snapshot --help
```

Read its options, then capture frame one (t=0) and write it to `public/demo-resolution-poster.png`. Confirm by eye that it matches the video's opening frame.

If `snapshot` cannot target t=0 or cannot write a PNG to an arbitrary path, stop and report it rather than substituting a hand-made image — a poster that is not literally frame one is the defect this step exists to prevent.

- [ ] **Step 7: Commit**

```bash
git add video/resolution-demo public/demo-resolution.mp4 public/demo-resolution-poster.png
git commit -m "feat(video): 30s silent write-time resolution composition

Three beats: a held fact with its grounding, a contradicting candidate
resolving as supersede, and the old fact retired rather than removed —
both cards on screen together at the end, which is the argument."
```

---

### Task 3: The `Resolution` section on the page

**Files:**
- Create: `src/landing/Resolution.tsx`
- Modify: `src/landing/LandingApp.tsx:17`
- Modify: `src/styles/landing.css` (docblock at line 1–7, plus a new block before the verdicts section)
- Modify: `docs/truenorth/specs/2026-07-26-landing-page-design.md` (§3)

**Interfaces:**
- Consumes: `/demo-resolution.mp4` and `/demo-resolution-poster.png` from Task 2.
- Produces: `export function Resolution({ index }: { index: number })` — the same signature every other landing section uses.

- [ ] **Step 1: Create the component**

Create `src/landing/Resolution.tsx`:

```tsx
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
```

- [ ] **Step 2: Wire it into the page**

In `src/landing/LandingApp.tsx`, add the import alongside the others (they are alphabetical):

```tsx
import { Resolution } from "./Resolution";
```

and change line 17 from:

```tsx
const SECTIONS = [Problem, Pillars, Coverage, WhereItPlugsIn, WhatItIsnt];
```

to:

```tsx
const SECTIONS = [Problem, Pillars, Resolution, Coverage, WhereItPlugsIn, WhatItIsnt];
```

That is the only change to this file. Kicker indices derive from array position, so `Coverage`, `WhereItPlugsIn` and `WhatItIsnt` renumber themselves — do not touch them.

- [ ] **Step 3: Add the styles**

In `src/styles/landing.css`, insert immediately **before** the `/* --- verdicts ... */` comment header (around line 162), so source order matches page order:

```css
/* --- demo video ---------------------------------------------------------------- */

.lp-demo {
  margin: var(--p8-space-6) 0 0;
}

.lp-demo-video {
  display: block;
  width: 100%;
  max-width: 880px;
  aspect-ratio: 16 / 9;
  background: var(--p8-panel-2);
  border: 1px solid var(--p8-line);
  border-radius: var(--p8-radius);
}

.lp-demo-cap {
  margin: var(--p8-space-3) 0 0;
  font-family: var(--p8-font-mono);
  font-size: var(--p8-text-xs);
  letter-spacing: 0.08em;
  color: var(--p8-muted);
}
```

`aspect-ratio` reserves the box before the poster loads, so there is no layout shift on play. `max-width: 880px` is a structural measure, which `landing.css` permits raw — every colour, radius, space and font value above resolves through a `--p8-*` token.

- [ ] **Step 4: Stop the stylesheet from lying about itself**

`landing.css` opens with "Hairlines, no motion." That is no longer true. In the docblock at the top of the file, change:

```
   the public landing page, restaged on the pixel-8 brand. Hairlines, no
   motion. Selectors are bare `.lp-*` — scoping comes from rendering only
```

to:

```
   the public landing page, restaged on the pixel-8 brand. Hairlines, and no
   *ambient* motion — nothing moves unbidden; the one video plays only on a
   click. Selectors are bare `.lp-*` — scoping comes from rendering only
```

- [ ] **Step 5: Amend the landing spec**

In `docs/truenorth/specs/2026-07-26-landing-page-design.md` §3, immediately after the "No autoplay, no hero animation, no countdown" bullet, add:

```markdown
- **Amended 2026-07-26** — one exception, scoped: a single user-initiated demo video below the
  fold (`Resolution`, see `2026-07-26-landing-demo-video-design.md`). No autoplay, no ambient
  motion, hero unchanged, nothing moves until clicked. The constraint's purpose — the page does
  not perform at you — is preserved; what changed is that a visitor may ask for the mechanism to
  be demonstrated.
```

Without this, a future reader finds the video, reads the spec, and correctly concludes it should not exist.

- [ ] **Step 6: Run the type-check**

```bash
npm run build
```

Expected: PASS. The build is strict — an unused import from Step 2 fails here.

- [ ] **Step 7: Run the test suite**

```bash
npm run test
```

Expected: PASS, including `src/styles/literals.test.ts`. That file already scans `landing.css` with no edit needed, so it is a real automated gate on Step 3's CSS. A hex colour or a px `border-radius` in the new block fails here with the offending value named.

- [ ] **Step 8: Commit**

```bash
git add src/landing/Resolution.tsx src/landing/LandingApp.tsx src/styles/landing.css docs/truenorth/specs/2026-07-26-landing-page-design.md
git commit -m "feat(landing): below-fold resolution demo video

preload=none behind a poster: below the fold, so the video can never be
the LCP element and no bytes move until a click. Prose is the text
alternative, so the section stands with the video removed — which is why
there is no <track> for a silent film.

Amends the landing spec's no-motion constraint rather than overriding it
quietly, and fixes landing.css's docblock, which claimed no motion."
```

---

### Task 4: Measured verification

The previous tasks assert; this one measures. LCP in particular is *reasoned* in the spec and must be *observed* here.

**Files:**
- Modify: `docs/truenorth/plans/2026-07-27-landing-demo-video.md` (record results at the bottom)

**Interfaces:**
- Consumes: the built app from Task 3.
- Produces: recorded measurements. No code.

- [ ] **Step 1: Build and serve the production bundle**

```bash
npm run build && npm run preview
```

Preview serves the built `dist/`, which is what Vercel ships — a dev-server measurement would not be meaningful.

- [ ] **Step 2: Desktop pass at 1280×800**

Load the preview URL. Confirm, in order:
1. The page reaches the new section by scrolling — it must **not** be visible in the initial viewport.
2. The poster renders inside the box with no layout shift when it appears.
3. Clicking play starts the video; it is legible; it is silent.
4. Kicker numbering is contiguous down the page with no repeats or gaps.

- [ ] **Step 3: Confirm no video bytes load before the click**

With devtools Network open, reload and scroll to the section **without** clicking play. Filter to `demo-resolution`.

Expected: `demo-resolution-poster.png` loads; **`demo-resolution.mp4` does not appear at all.** If the MP4 loads, `preload="none"` is not doing its job — stop and fix before continuing.

- [ ] **Step 4: Measure LCP**

With the Performance panel (or a Lighthouse run) against the preview URL, record LCP.

Expected: **under 2.5s**, the bar set by the landing spec §5.4. Also record which element was reported as the LCP element — it must not be anything in the demo section.

- [ ] **Step 5: Mobile pass at 375px**

Resize to 375×812. Confirm the video scales to full width, the caption does not overflow, and playback is legible at that size.

- [ ] **Step 6: Keyboard pass**

Using Tab only, reach the video element and start playback with Space or Enter. Native `controls` should give this for free; if it does not, that is a defect.

- [ ] **Step 7: Broken-source check**

```bash
mv public/demo-resolution.mp4 /tmp/demo-resolution.mp4
```

Reload and scroll to the section.

Expected: the poster and the fallback paragraph render — not an empty box or a broken-media icon. Then restore it:

```bash
mv /tmp/demo-resolution.mp4 public/demo-resolution.mp4
```

- [ ] **Step 8: Text-alternative check**

In devtools, delete the `<figure class="lp-demo">` node from the DOM.

Expected: the section still states its full argument in prose. If removing the video leaves a sentence dangling ("as shown below…"), fix the copy — that is the accessibility deliverable, not a nicety.

- [ ] **Step 9: Record the measurements**

Append a `## Verification results` section to the bottom of this plan file with the actual numbers: LCP value, the reported LCP element, MP4 size, video duration, and a line per check above marked pass or fail. Numbers, not "looks good".

- [ ] **Step 10: Commit**

```bash
git add docs/truenorth/plans/2026-07-27-landing-demo-video.md
git commit -m "docs(plan): record measured verification for the demo video"
```

---

## Self-review

**Spec coverage.** Every spec section maps to a task: §1 placement → Task 3 Step 2; §2 component → Task 3 Step 1 (including the no-`<track>` decision and the text alternative); §3 video source and render pipeline → Task 1 entire, plus Task 2 Steps 4–7; §4 content and the three beats → Task 2 Step 2; §5 styles and the docblock amendment → Task 3 Steps 3–4; §6 landing-spec amendment → Task 3 Step 5, wording verbatim; §7 verification, all seven items → Task 4 Steps 1–8, plus the 3 MB budget enforced earlier at Task 2 Step 5 where it can actually block a commit.

**One deliberate deviation from the spec**, flagged rather than silent: the spec put `@hyperframes/*` in `devDependencies`. That would download Chromium (via Puppeteer) on every Vercel build, since Vercel installs devDependencies. The plan keeps HyperFrames out of `package.json` and calls it through `npx`. **The spec should be amended to match** — noted here rather than edited unilaterally.

**Placeholders.** Task 1 deliberately does not hardcode HyperFrames subcommand names, because they were not verified when this plan was written. That is not a placeholder: Step 2 gives the exact command that reveals them, and every later step says what to substitute. Inventing plausible-looking CLI syntax would have been worse. Task 1 Step 8's `video/README.md` contains angle-bracket fields that the step explicitly requires filling before commit.

**Type consistency.** `Resolution({ index }: { index: number })` matches the signature `Coverage` uses and the `index={i + 1}` call site in `LandingApp.tsx`. Asset filenames `demo-resolution.mp4` and `demo-resolution-poster.png` are identical across Task 2's output, Task 3's markup, and Task 4's checks. CSS class names `lp-demo`, `lp-demo-video`, `lp-demo-cap` are used identically in the component and the stylesheet.
