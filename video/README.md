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

Writes `public/demo-resolution.mp4` only. Budget: **MP4 under 3 MB.**

**Poster generation is not wired up yet.** The landing page needs
`public/demo-resolution-poster.png` as the video's poster frame; producing it is
open work for the composition task. It must match frame one of the MP4.

## Verified toolchain

- CLI version: `0.7.76` (package is `hyperframes` on npm, not `@hyperframes/cli`
  — see "Deviation from plan" below)
- Create command: `npx --yes hyperframes init video/resolution-demo --example blank --non-interactive --skip-transcribe`
- Render command: `HYPERFRAMES_SKIP_SKILLS=1 npx --yes hyperframes@0.7.76 render video/resolution-demo --output public/demo-resolution.mp4` (this is what `npm run video:render` runs)

## Listed in `--help`, NOT yet exercised

These come from `npx --yes hyperframes@0.7.76 --help` (full output in
`.truenorth/sdd/task-1-report.md`). They exist as subcommands; nobody has run
them against this composition yet, so treat every one as a lead to verify, not
a working recipe.

- `snapshot` — "Capture key frames as PNG screenshots for visual verification".
  The most likely route to the poster frame without ffmpeg. **Unproven:** whether
  it can target t=0 and write to an arbitrary path is exactly what the
  composition task must find out first.
- `check` — "Run lint, runtime validation, and layout inspection as one gate".
  `lint` and `validate` are also separately invokable.
- `benchmark` — renders across preset fps/quality/worker configs and compares
  speed against file size. Useful if the 3 MB budget is tight.
- `info`, `inspect`, `keyframes`, `compare`, `doctor`, `preview`.
- FFmpeg: **not required and not installed.** HyperFrames bundles its own
  encoder — verified by rendering successfully on a machine where both `ffmpeg`
  and `ffprobe` are absent from PATH. Do not reach for `ffprobe` to inspect
  output; the renderer prints a summary line like `25.6 KB · 10.0s video` on
  completion. For more details use `npx --yes hyperframes@0.7.76 info` on the
  composition directory.

## Compositions

- `resolution-demo/` — 30s silent, write-time fact resolution. Shown on the
  landing page in `src/landing/Resolution.tsx`.

## Deviation from plan (Task 1 spike findings)

- The npm package is **`hyperframes`**, not `@hyperframes/cli` as the original
  plan guessed. Scoped invocation 404s.
- `hyperframes init` scaffolds `AGENTS.md` / `CLAUDE.md` / `hyperframes.json` /
  `index.html` / `meta.json` / `package.json` — there is no `hyperframes-core/`
  directory or `design.md` in the current CLI version. The authoring contract
  (the `data-*` timing attributes, `class="clip"`, `window.__timelines`
  registration) lives in the scaffolded `AGENTS.md`/`CLAUDE.md` and via
  `npx hyperframes docs data-attributes`.
- `hyperframes init` (even with `--skip-transcribe`) reaches out to GitHub and
  installs 8 HyperFrames/media-use skills into `~/.claude/skills/` and
  `~/.agents/skills/` by default — a global, machine-wide side effect outside
  this repo. Pass `HYPERFRAMES_SKIP_SKILLS=1` in the environment to suppress it
  (the CLI's own `--skip-skills` flag is currently a no-op, per its `--help`
  text). `npm run video:render` in `package.json` runs `npx hyperframes render`
  directly and does not re-trigger this init behavior.
- `render`'s output flag is `-o`/`--output` (a file path, default
  `renders/<name>.mp4`), not `--out` as the plan's illustrative snippet showed.
- **`video:render` pins `hyperframes@0.7.76` and sets `HYPERFRAMES_SKIP_SKILLS=1`:**
  `npx --yes hyperframes` (unpinned) re-resolves to latest on every run, risking
  silent breakage. `HYPERFRAMES_SKIP_SKILLS=1` suppresses the global skill
  installer side effect. Both are essential for reproducibility and avoiding
  unexpected state in `~/.claude/skills/` and `~/.agents/skills/`.
