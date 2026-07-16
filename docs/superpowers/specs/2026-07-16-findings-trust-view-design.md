# Findings trust view — design

**Date:** 2026-07-16
**Status:** approved, pending implementation plan
**Scope:** phase 1 of a 3-phase dashboard direction (trust triage → KG structure ergonomics → search→subgraph)

## Problem

The dashboard renders the **knowledge graph** (entities + relations). The knowledge that
actually accumulates in a KB is **findings** — and findings carry a `confidence` score that the
UI encodes nowhere.

Today `graphStore.nodeSize()` maps size to *degree* and `colors.typeColor()` maps hue to
*nodeType*. Both channels are spent; confidence is invisible. A 0.24 single-source vendor blog
and a 0.95 adversarially-verified finding are indistinguishable.

This is not hypothetical. The `knowledge-engine/visualization` KB currently holds 361 findings
in two tiers — ~332 explore-pipeline findings at ~0.2–0.4 (single-source, some from competitor
marketing posts) and 29 deep-research findings at 0.95/0.70 (3-vote adversarially verified).
Semantic search ranks by similarity, not confidence, so low-confidence rows routinely outrank
verified ones. Quoting a 0.24 finding as fact is the trap this view exists to close.

Two facts discovered during review that constrain the design:

1. **`visualization` has 361 findings but zero KG nodes.** The canvas renders "empty graph" for
   it. KG and findings are decoupled; nodes exist only where a finding→graph build has run. A
   graph-based trust view would show nothing for the KB that needs it most.
2. **The findings list is hard-capped at 100.** Both stores do
   `n = min(limit or LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT)` with `LIST_MAX_LIMIT = 100`, and there
   is no offset. A 361-finding KB cannot be fully listed.

Hence: findings-first, and the cap must be lifted or the view lies.

## Non-goals

- KG confidence encoding and the finding→graph build (phase 2).
- LOD labels, minimap, edge bundling, search→subgraph (phase 2/3).
- Fixing the broken synopsis rebuild. Separate defect: `synopsis.model: claude-haiku-4-5` routes
  through `core/clients/anthropic.py::chat_model()` → `ChatAnthropic`, which needs
  `ANTHROPIC_API_KEY`; the gateway-only `.env` has none, so `maybe_rebuild_synopsis` raises and
  is swallowed. This is why the left rail reads "12 findings" for a 361-finding KB. Out of scope
  here, but it means **the rail's finding count is not a trustworthy cross-check** for this view.

## Contract drift found (must fix as part of this work)

`types.ts` opens with "THE CONTRACT IS LAW — these mirror the backend response shapes exactly;
do not add invented fields here." The findings list already violates it:

| | Live backend | `types.ts` | Mock |
|---|---|---|---|
| list row | `id, title, category, confidence, tags, created_at` | `Finding` (requires `content`, `provenance`) | full `Finding` |

`store/supabase.py::list_findings` selects a **projection**. The mock returns full `Finding`
objects out of its map. So `row.content` works offline and is `undefined` against the live API —
mock parity is broken in a way that only bites in production.

Fix: model the projection honestly as `FindingRow`, and make the mock match.

## Design

### Backend (`~/projects/delapan`)

1. `LIST_MAX_LIMIT: 100 → 1000` in `store/supabase.py` and `store/sqlite.py`.
2. `list_findings` returns `total` alongside the existing `count`. `count` currently means *rows
   returned*; without a separate total the client cannot distinguish "KB has 100 findings" from
   "KB has 361, you got 100". `total` is counted **inline inside `list_findings`** using the same
   `kb_id` + `category` predicate — *not* via the existing `count_findings(kb_id)`, which takes no
   `category` argument and is consumed elsewhere (drift marker, tooling). Leaving
   `count_findings` untouched keeps that blast radius at zero.
3. `api/routes_findings.py` passes `limit` through to the store.

`Store` Protocol in `store/base.py` updates its `list_findings` docstring/shape to match.

### Contract (`src/api/types.ts`)

```ts
export interface FindingRow {
  id: string; title: string; category: string;
  confidence: number; tags: string[]; created_at: string;
}
export interface FindingsResponse { count: number; total: number; findings: FindingRow[]; }
```

`Finding` is unchanged and remains the single-fetch shape. `mock.getFindings` returns
`FindingRow`s projected from its map plus an honest `total`.

### Frontend

**Shell.** `TopBar` gains a segmented control `[ Graph | Findings ]`. The canvas region swaps
`GraphCanvas` ⇄ `FindingsView`. `Inspector`, `StatusBar`, `LeftRail` unchanged — this reuses the
existing master-detail shell rather than inventing a layout.

**`src/panels/FindingsView.tsx`**
- A confidence histogram (~20 bins over 0–1; x = confidence, bar height = count).
- Below it, a confidence-sorted table: title, category, confidence bar, tags.
- Drag-brush across the histogram sets a confidence range that filters the table.
- Header renders `showing N/total` whenever `N < total`, mirroring `StatsSection`'s existing
  `showing 105/130` idiom. No silent caps.
- Row click opens the existing `FindingDrawer` via `store.openFinding` → `fetchFinding`, which
  already fetches the full `Finding`. No second detail-fetch path.

**`src/findings/derive.ts`** — pure, side-effect free (mirrors `state/derive.ts`):
`bin(rows, binCount)`, `tierOf(confidence)`, `inRange(rows, [lo, hi])`.

`tierOf` returns exactly two tiers, because the accent rule below allows exactly one highlight:

| tier | range | treatment |
|---|---|---|
| `verified` | `confidence >= 0.9` | `--accent` |
| `unverified` | `confidence < 0.9` | grey (`--text-faint`) |

0.9 is the cut because the deep-research ingest writes 0.95 (high) / 0.70 (medium) and the
explore pipeline writes ~0.2–0.4; 0.9 cleanly separates adversarially-verified rows from
everything else. The exact `confidence` value stays visible per row, so the binary tier is a
visual affordance, not a claim that 0.89 and 0.24 are equivalent.

**Encoding rationale** (from the `visualization` KB's own verified findings):
- Confidence → **position + bar length**, the top of the Cleveland–McGill accuracy hierarchy.
  The KB's encoding rule: *"Value/Lightness: perceived as ordered → ordinal/quantitative; Hue:
  unordered → nominal."* Hue is already correctly spent on `nodeType` (nominal).
- **One accent, grey the rest** — the verified tier (≥0.9) takes `--accent`; everything else is
  `--text-faint`/grey. Per the pre-attentive rule: multiple competing highlights cancel the
  pop-out effect. This also matches Few's "dark cockpit" (normal quiet, signal highlighted).
- Net effect: the bimodal 0.2–0.4 vs 0.95 split is legible at a glance. The KB looking mostly
  low-confidence is **accurate, not a rendering bug**.

**State (`src/state/store.ts`)** — additive:
`view: "graph" | "findings"`, `findings: FindingRow[] | null`, `findingsTotal: number`,
`loadingFindings: boolean`, `findingsError: string | null`, `confidenceRange: [number, number] | null`.

Findings load **lazily on first switch** to the view and reset on KB switch (alongside the
existing `findingCache: {}` reset). Nothing is fetched if the view is never opened.

**Undo/commands** — the view is read-only. It does **not** go through `Command`/`UndoManager`
and does not touch graphology, so `graphVersion`/`graphTouched()` are uninvolved. This is a
deliberate exception to "everything mutating goes through a Command" — nothing here mutates.

### Error handling

- Fetch failure → inline error in the view, mirroring `CoverageProbe`'s `ApiError` handling
  including the 503 "embeddings unavailable" case.
- Empty KB → `.placeholder` ("no findings yet"), consistent with `StatsSection`'s "empty graph".
- Live-API network failure already auto-falls back to mock via `client.call()`; the `total` field
  must therefore be correct in mock or the header will lie offline.

### Testing

Vitest runs node-env with no DOM, so tests target pure derivations only:
- `src/findings/derive.test.ts` — binning (incl. boundary 0.0/1.0 and empty input), tier
  classification at the 0.9/0.7 edges, range filtering.
- Backend pytest — raised cap returns >100 rows; `total` reports KB total independent of `limit`;
  `total` honours `category`.

Existing suites (`undo.test.ts`, `conceptDoc.test.ts`, `markdown.test.ts`, `openConcept.test.ts`)
must stay green. `npm run build` is the type-check gate and must pass.

## Risks

- Raising the cap to 1000 makes a 1000-row response possible; the table renders 361 rows today
  and is not virtualized. If a KB exceeds ~1–2k rows the table will need windowing. `total` makes
  the truncation honest in the meantime rather than silent.
- Backend and frontend live in **separate repos** (`~/projects/delapan` and `delapan-fe`), so the
  `total` field must land **backend-first**; a frontend built against a backend without it would
  render `undefined`. This is a sequencing constraint for the implementation plan, not a reason to
  weaken the type: `total` is declared required because the contract mirrors the shipped backend.
- The 0.9 tier cut is calibrated to how the two current writers score
  (deep-research 0.95/0.70, explore ~0.2–0.4). A future writer using a different scale would make
  the accent misleading. The cut lives in `derive.ts` as a named constant for that reason.
