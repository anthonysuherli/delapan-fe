# video/

HyperFrames compositions. Rendered **offline** — never part of `npm run build`,
because the Vercel builder has no Chrome or FFmpeg.

HyperFrames is deliberately **not** in `package.json`: it pulls Puppeteer, which
downloads a Chromium binary on install, and Vercel installs devDependencies on
every build. It runs through `npx` instead.

## Render

```bash
npm run video:build
```

Runs both artifacts in one shot: `video:render` writes `public/demo-resolution.mp4`
(budget: **under 3 MB**), then `video:poster` writes `public/demo-resolution-poster.png`
via `snapshot --at 0 --no-end`, whose `-o` takes a directory — the script points it at
a scratch dir under `video/**/out/` (gitignored) and copies the one PNG it produces to
the committed path. The poster must be frame one of the same render or the click
produces a visible jump; running both scripts together is what keeps that true. To
run them individually: `npm run video:render` / `npm run video:poster`.

## Requires network

Rendering is **not** offline in the sense of "no internet." The composition fetches
Space Grotesk and JetBrains Mono from `fonts.googleapis.com` and GSAP from
`cdn.jsdelivr.net` (see the `<head>` links in `video/resolution-demo/index.html`).
"Offline" above describes the *build* — `npm run build` and the Vercel builder never
invoke HyperFrames at all. A render on a disconnected machine either fails or falls
back to `system-ui`, producing an artifact that doesn't match what's committed;
`check`'s `google_fonts_import` notice exists for this reason. Do not vendor the
fonts — the glyphs are already baked into the shipped MP4 and poster, so vendoring
would only matter for a re-render, which isn't otherwise needed.

## Verified toolchain

- CLI version: `0.7.76` (package is `hyperframes` on npm, not `@hyperframes/cli`
  — see "Deviation from plan" below)
- Create command: `npx --yes hyperframes init video/resolution-demo --example blank --non-interactive --skip-transcribe`
- Render command: `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.7.76 render video/resolution-demo --output public/demo-resolution.mp4` (this is what `npm run video:render` runs)
- Poster command: `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.7.76 snapshot video/resolution-demo --at 0 --no-end -o <scratch-dir>` (this is what `npm run video:poster` runs, followed by copying `<scratch-dir>/frame-00-at-0s.png` to `public/demo-resolution-poster.png`). Confirmed reproducible: re-running it against the unchanged composition produces a byte-identical PNG to the committed one.
- `check` — "Run lint, runtime validation, and layout inspection as one gate" — was run against the composition as the gate before rendering. Result: 0 errors, 38/38 WCAG AA contrast checks passed, 10 `text_occluded` info-level notices, all at t=28.33s, after the end-card handoff — reviewed and judged benign.
- FFmpeg: **not required and not installed.** HyperFrames bundles its own
  encoder — verified by rendering successfully on a machine where both `ffmpeg`
  and `ffprobe` are absent from PATH. Do not reach for `ffprobe` to inspect
  output; the renderer prints a summary line like `25.6 KB · 10.0s video` on
  completion.

## Listed in `--help`, NOT yet exercised

These come from `npx --yes hyperframes@0.7.76 --help`. They exist as subcommands;
nobody has run them against this composition, so treat every one as a lead to
verify, not a working recipe.

- `benchmark` — renders across preset fps/quality/worker configs and compares
  speed against file size. Useful if the 3 MB budget is tight.
- `info`, `inspect`, `keyframes`, `compare`, `doctor`, `preview`.

## Compositions

- `resolution-demo/` — 30s silent, write-time fact resolution. Shown on the
  landing page in `src/landing/Resolution.tsx`.

## Deviation from plan (Task 1 spike findings)

- The npm package is **`hyperframes`**, not `@hyperframes/cli` as the original
  plan guessed. Scoped invocation 404s.
- `hyperframes init` scaffolds `AGENTS.md` / `CLAUDE.md` / `hyperframes.json` /
  `index.html` / `meta.json` / `package.json` — there is no `hyperframes-core/`
  directory or `design.md` in the current CLI version (`design.md` here was
  authored by hand in Task 2 to record the shared palette, not scaffolded). The
  authoring contract (the `data-*` timing attributes, `class="clip"`,
  `window.__timelines` registration) lives in the scaffolded `AGENTS.md`/`CLAUDE.md`
  and via `npx hyperframes docs data-attributes`.
- `hyperframes init` (even with `--skip-transcribe`) reaches out to GitHub and
  installs 8 HyperFrames/media-use skills into `~/.claude/skills/` and
  `~/.agents/skills/` by default — a global, machine-wide side effect outside
  this repo. Pass `HYPERFRAMES_SKIP_SKILLS=1` in the environment to suppress it
  (the CLI's own `--skip-skills` flag is currently a no-op, per its `--help`
  text). `npm run video:render` in `package.json` runs `npx hyperframes render`
  directly and does not re-trigger this init behavior.
- `render`'s output flag is `-o`/`--output` (a file path, default
  `renders/<name>.mp4`), not `--out` as the plan's illustrative snippet showed.
  Note that `video/resolution-demo/package.json`'s own `render` script omits
  `--output` entirely, so running it from inside that directory (rather than
  `npm run video:render` from the repo root) writes to that default —
  `video/resolution-demo/renders/`, which `.gitignore` excludes.
- **`video:render` pins `hyperframes@0.7.76` and sets `HYPERFRAMES_SKIP_SKILLS=1`:**
  `npx --yes hyperframes` (unpinned) re-resolves to latest on every run, risking
  silent breakage. `HYPERFRAMES_SKIP_SKILLS=1` suppresses the global skill
  installer side effect. Both are essential for reproducibility and avoiding
  unexpected state in `~/.claude/skills/` and `~/.agents/skills/`.
