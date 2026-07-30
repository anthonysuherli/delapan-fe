# delapan Design System

A design system for **delapan** — a knowledge-base grounding engine and its control-panel frontend. delapan captures intent, grounds every answer in a maintained knowledge base, and fills gaps from the web on demand (**ground → grow → answer**). The frontend renders a KB as an interactive, editable, force-directed graph.

The look is a **daylight instrument panel**: cool-paper surfaces, hairline rules, and a single amber annunciator accent. Condensed industrial display type (Big Shoulders), monospace data labels (IBM Plex Mono), and humanist body copy (IBM Plex Sans).

## Sources

This system was reverse-engineered from the delapan codebase. If you have access, explore these to build higher-fidelity delapan designs:

- **Frontend (design source of truth):** https://github.com/anthonysuherli/delapan-fe — the KB control panel. All tokens, components, and the UI kit here are lifted from `src/styles/*.css` and `src/panels/*.tsx`.
- **Backend / engine:** https://github.com/anthonysuherli/delapan-be — the grounding engine (SQLite + sqlite-vec / Supabase + pgvector), MCP server, and HTTP API the frontend consumes.

The frontend has no CSS framework; the instrument-panel look is hand-rolled design tokens in `src/styles/tokens.css`. Read `delapan-fe/CLAUDE.md` for the interaction patterns (optimistic mutations, command/undo, sigma reducers).

> **Font note:** delapan links Big Shoulders Display, IBM Plex Mono, and IBM Plex Sans from Google Fonts — no local font binaries ship. This system does the same via `@import` in `tokens/fonts.css`. If you have licensed/self-hosted copies, swap them in and add `@font-face` rules. **Flag to the maintainer if self-hosting is required.**

---

## Content fundamentals

delapan's voice is that of an **instrument, not an assistant**. Terse, technical, lowercase, confident. It labels rather than explains.

- **Casing:** UI labels and button text are **lowercase** (`+ node`, `⌁ connect`, `probe`, `run`, `re-ran layout (200 iterations)`). Section titles are **UPPERCASE** with wide tracking (`SCOPE`, `COVERAGE PROBE`, `SYNOPSIS`). The wordmark is uppercase: `DELAPAN_8`.
- **Voice:** Imperative and system-first. Placeholders pose the user's question to the machine: `"can the KB answer…?"`, `"gap-fill from the web…"`, `"search labels…  ( / )"`. Status lines are telegraphic: `last: selected c_finding`, `showing 40/120`.
- **Person:** Neither "I" nor "you" — the copy is impersonal and object-oriented ("Findings are the atomic unit…", "Coverage banding grades every resume…"). The machine reports facts about itself.
- **Domain nouns are precise and consistent:** *finding*, *node*, *edge*, *grounded_in*, *provenance*, *coverage* (rich / sparse / gap), *synopsis*, *schema drift*, *preamble*, *explore*, *travel*. Reuse these exact terms.
- **Numbers are tabular and unadorned:** `40 nodes`, `71 edges`, `conf 0.95`, `×5`. Monospace, `font-variant-numeric: tabular-nums`.
- **Verbs for relations are free phrases:** edges read as `renders`, `forked from`, `stores vectors in`, `grounds into` — natural verb phrases, not SCREAMING_CONSTANTS.
- **No emoji.** Iconography is a small set of Unicode/dingbat glyphs used as functional symbols (see Iconography). No exclamation points, no marketing tone, no encouragement copy.
- **Errors are diagnostic, not apologetic:** `embeddings unavailable (503) — engine can't band coverage right now`, `edge endpoints must exist`.

---

## Visual foundations

**Palette.** A cool, desaturated paper base — four surface tints from `#f5f7fa` (bg0) to `#dce3ed` (bg3) — with two hairline rules (`--line`, `--line-bright`). Ink is a deep slate `#1f2b3a` with dim/faint steps. The **single brand accent is amber** (`--accent #b45309`, `--accent-bright #d97706`), used as an "annunciator" — sparingly, for the most important action, active/toggled states, and warnings. Status hues: green (rich/success), amber (sparse/warn), red (gap/danger/drift), cyan (provenance/info). Entity types have fixed hues: concept blue, technology amber, person pink, company green, project purple.

**Type.** Three families, small sizes, tight rhythm. *Big Shoulders Display* (condensed, industrial) for the wordmark, section titles, verdict bands, and HUD — always uppercase with 0.14–0.22em tracking. *IBM Plex Mono* for every label, count, keycap, and data value — uppercase mono labels with wide tracking are the signature move. *IBM Plex Sans* for reading text (findings, glosses, drawer content) at 13px / 1.65. Body default is 13px; labels drop to 9–11px.

**Backgrounds & texture.** The app carries a faint (3.5% opacity) fractal-noise **film grain** over everything — a subtle instrument-panel texture, not a decorative gradient. The graph canvas adds a **blueprint grid** (40px repeating lines at ~7% opacity) plus a soft radial vignette. No photographic imagery, no illustration, no marketing gradients. Corner **viewfinder brackets** frame the canvas.

**Borders, radius, cards.** Everything is bordered with a 1px hairline; radius is tight (**4px** default, 3px small, 6px for modals/popovers). "Cards" (counters, evidence items, toasts) are a sunken surface (`--bg0`) inside a hairline border — **no drop shadows on inline cards**; elevation is reserved for floating layers (drawer, modal, popover, search results) which use soft cool shadows (`0 10px 30px rgba(31,43,58,.16)`) and, for accent popovers, an amber glow.

**Shadows & glow.** Two systems: neutral cool drop shadows for elevation, and **amber glow** (`box-shadow: 0 0 14px rgba(180,83,9,.16)`) for lit/active controls and the travel avatar. Active toggle buttons combine an amber border, `--accent-dim` fill, outer glow, and a faint inner glow.

**Hover / press states.** Hover **brightens**: text goes from `--text-dim` to `--text`, borders from `--line` to `--line-bright`; evidence/provenance cards light their border to the accent/cyan. Accent buttons gain a glow on hover. There is **no scale-shrink on press**; interaction is communicated through color and glow. Travel hop-keys are the exception — they scale up 1.15–1.18× on hover.

**Motion.** Fast and mechanical: 120ms color/border transitions (`--t-fast`), 180ms entrances (`--t-med`) on `cubic-bezier(.2,.9,.3,1)`. Drawers slide + fade in from the right; modals drop + fade from above; toasts rise from below. Ambient loops: the spinner, a pulsing mock-mode connection dot (`blink`), and the travel avatar's `pulse-glow` + expanding ring. No bounces, no long easing, no parallax.

**Transparency & blur.** Used only for modal/drawer veils — a translucent slate scrim (`rgba(31,43,58,.28)`) with a 1–2px backdrop blur. Floating chrome over the canvas (travel HUD, hints) uses `rgba(255,255,255,.94)` frosted panels. Otherwise surfaces are opaque.

**Layout.** A fixed three-region shell: 48px top bar, 28px status bar, and a `rail (268px) | canvas (fluid) | inspector (336px)` middle grid. Panels scroll independently; the canvas never does. Sections are separated by hairline rules, each opening with an uppercase display title and an optional right-aligned mono aux note.

---

## Iconography

delapan uses **no icon font and no SVG icon set**. Icons are a deliberately small vocabulary of **Unicode / dingbat glyphs** set in the mono or body font, used as functional symbols beside lowercase labels:

- `+` add · `⌁` connect edge · `⟲` re-run layout · `➤` travel · `⌕` search · `⤺ ⤻` undo/redo · `▸ ✓ · ✕` phase-log ticks · `⚠` drift warning · `×` count multiplier & dismiss · `→` edge direction.
- Entity types are shown as **colored dots/chips** (`TypeDot`, `TypeChip`), never glyphs.
- The graph itself is drawn by sigma.js on WebGL (nodes = colored circles sized by degree, edges = hairlines); in this system's UI kit that's recreated with positioned DOM circles + SVG lines.

If you need a richer icon set for a new surface, substitute a **thin-stroke** CDN set (e.g. Lucide) to match the hairline aesthetic and **flag the substitution** — the source ships none. Do not introduce filled/duotone icons or emoji.

**Logo.** delapan uses a **brilliant-cut faceted "8"** mark (component `Logomark`; SVGs in `assets/logo-*.svg`). It's a rigid figure-eight — the stable *three-body* orbit solution — cut as a gem: a table plus four bevels per lobe, shaded as if lit from upper-left, with the **amber table core** as the only brand color (`delapan` = Indonesian for "eight"). Variants: `light` (cool paper facets, primary), `dark` (slate facets for dark surfaces / the `#161f2b` app tile), `mono` (flat, `currentColor`). The **wordmark** is lowercase `delapan` in Big Shoulders Display 700; the primary lockup pairs mark + wordmark + the mono descriptor `GROUNDING ENGINE`. (The in-app top-bar treatment remains the uppercase `DELAPAN_8` with an amber `_8`.) Don't recolor the amber table, redraw the facets, or stretch the mark.

---

## What's in here (index / manifest)

Root:
- `styles.css` — the single entry point consumers link. `@import`s only.
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `geometry.css`, `semantic.css`.
- `thumbnail.html` — homepage tile.
- `SKILL.md` — Agent-Skill wrapper (usable in Claude Code).

Components (`window.DelapanDesignSystem_a684d2.<Name>`), grouped by concern:
- **brand/** — `Logomark` (faceted-8 mark + lockup; assets in `assets/logo-*.svg`)
- **core/** — `Button`, `Kbd`, `SectionTitle`
- **forms/** — `Input`, `Select`
- **graph/** — `TypeDot` (+ `typeColor`, `TYPE_COLORS`), `TypeChip`, `LegendRow`, `Relation`
- **feedback/** — `Spinner`, `VerdictBand`, `PhaseStep`, `Toast`
- **data/** — `Counter`, `ConfidenceBar`, `EvidenceItem`

Every component has a sibling `.d.ts` (props + JSDoc), `.prompt.md` (usage), and each directory has one `@dsCard` HTML showing its states.

Foundations (`guidelines/`): specimen cards for surfaces, ink, amber, status hues, entity types, display/body/mono type, radius & elevation, spacing.

UI kit (`ui_kits/control-panel/`): a full interactive recreation of the delapan KB control panel — top bar, scope/stats/schema/synopsis/coverage/explore left rail, graph canvas with selection + connect + travel, inspector with grounded evidence, findings table, and the finding drawer with provenance. Also registered as a **starting point**. See its `README.md`.

### Intentional additions
None. Every component corresponds to a primitive present in `delapan-fe` (`.btn`, `.inp`, `.kbd`, `.type-dot/chip`, `.lr-counter`, `.lr-legend-*`, `.lr-relation`, `.lr-verdict`, `.lr-phase`, `.toast`, `.ev-item`, `.spin`, `.sect-title`). `ConfidenceBar` and `TypeDot` factor out patterns the source repeats inline.
