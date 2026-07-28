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

- CLI version: `0.7.76` (package is `hyperframes` on npm, not `@hyperframes/cli`
  — see "Deviation from plan" below)
- Create command: `npx --yes hyperframes init video/resolution-demo --example blank --non-interactive --skip-transcribe`
- Render command: `npx --yes hyperframes render video/resolution-demo --output public/demo-resolution.mp4`
- FFmpeg version: `ffmpeg version 8.1.2 Copyright (c) 2000-2026 the FFmpeg developers`

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
