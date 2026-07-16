# Findings Trust View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make finding confidence visible and filterable, so a 0.24 single-source claim can never be mistaken for a 0.95 adversarially-verified one.

**Architecture:** A read-only `FindingsView` swaps into the existing canvas region via a `[ Graph | Findings ]` toggle, reusing the shell's master-detail layout and the existing `FindingDrawer` for detail. It renders a confidence histogram (brushable) over a confidence-sorted table. The backend's 100-row list cap is lifted to 1000 and a `total` field is added so truncation is stated, never silent.

**Tech Stack:** Backend — Python 3.12, FastAPI, pytest. Frontend — React 18, TypeScript (strict), Vite 6, Zustand, Vitest (node env, no DOM). No new dependencies.

## Global Constraints

- **Two repos.** Backend is `~/projects/delapan` (branch `master`). Frontend is `~/Repositories/8star/delapan-ai/frontend` (branch `main`). Tasks 1–3 are backend; Tasks 4–8 are frontend. **Backend must land first** — a frontend built against a backend without `total` renders `undefined`.
- **Do not commit to a default branch.** Create `feat/findings-trust-view` in each repo before the first commit there.
- **The frontend working tree already contains an uncommitted light-theme change** (`tokens.css`, `colors.ts`, `canvasDraw.ts`, `GraphCanvas.tsx`, 4 CSS files, `index.html`). Commit that separately, first, before starting Task 4. Do not fold it into these commits.
- **Backend:** ruff line-length 100. `from __future__ import annotations` at the top of every module. Run `pytest -q` from `~/projects/delapan`.
- **Frontend:** `npm run build` is the type-check gate (`tsc --noEmit` + vite build) and is strict — `noUnusedLocals`/`noUnusedParameters` mean an unused import fails the build. No lint step, no formatter: match surrounding style. Run `npm run test` (vitest) and `npm run build` from `frontend/`.
- **`type` is reserved by sigma** for its render program; the domain entity type is `nodeType`. Irrelevant to findings, but do not "fix" it if seen.
- **Mock parity is mandatory:** every change to `src/api/client.ts` must be mirrored in `src/api/mock.ts` or offline mode breaks.
- **Tier cut = 0.9**, defined once as a named constant. `verified` = `confidence >= 0.9`; `unverified` = below.
- Spec: `docs/superpowers/specs/2026-07-16-findings-trust-view-design.md`.

---

### Task 1: Backend — lift the list cap

**Files:**
- Modify: `~/projects/delapan/delapan/store/sqlite.py:80-81`
- Modify: `~/projects/delapan/delapan/store/supabase.py:22-23`
- Test: `~/projects/delapan/tests/test_store_sqlite.py`

**Interfaces:**
- Consumes: nothing.
- Produces: `LIST_MAX_LIMIT = 1000` in both stores. `list_findings(kb_id, category=None, limit=None) -> dict` shape unchanged this task (still `{"count", "findings"}`).

- [ ] **Step 1: Create the branch off master**

The repo may currently be on an unrelated branch (e.g. a different in-flight
feature). Branch explicitly off `master`, not off whatever is checked out:

```bash
cd ~/projects/delapan
git status --porcelain   # must be clean before switching; stop and ask if not
git checkout master
git pull --ff-only        # if a remote is configured; harmless no-op otherwise
git checkout -b feat/findings-trust-view master
```

- [ ] **Step 2: Write the failing test**

Append to `tests/test_store_sqlite.py`:

```python
@pytest.mark.asyncio
async def test_list_findings_returns_more_than_the_old_100_cap(store):
    org_id, project_id = store.resolve_project("repoCap", create=True)
    kb_id = store.resolve_kb(org_id, project_id, "main", create=True)
    rows = [
        {
            "id": f"f{i:07d}",
            "org_id": org_id,
            "kb_id": kb_id,
            "title": f"T{i}",
            "content": {"summary": "s"},
            "category": "fact",
            "confidence": 0.5,
            "tags": [],
            "provenance": [],
            "embedding": [0.01] * 1536,
        }
        for i in range(120)
    ]
    await store.insert_findings(rows)
    got = store.list_findings(kb_id, limit=1000)
    assert got["count"] == 120
    assert len(got["findings"]) == 120
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_store_sqlite.py::test_list_findings_returns_more_than_the_old_100_cap -q`
Expected: FAIL — `assert 100 == 120` (the old `LIST_MAX_LIMIT` clamps it).

- [ ] **Step 4: Raise the cap in both stores**

In `delapan/store/sqlite.py`, change line 81:

```python
LIST_MAX_LIMIT = 1000
```

In `delapan/store/supabase.py`, change line 23:

```python
LIST_MAX_LIMIT = 1000
```

Leave `LIST_DEFAULT_LIMIT = 20` alone in both — an unparameterised call must stay cheap.

- [ ] **Step 5: Run test to verify it passes**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_store_sqlite.py::test_list_findings_returns_more_than_the_old_100_cap -q`
Expected: PASS

- [ ] **Step 6: Run the full suite for regressions**

Run: `cd ~/projects/delapan && .venv/bin/pytest -q`
Expected: all pass (no test asserts the old 100 ceiling; if one does, it encoded the bug — update it and say so in the commit body).

- [ ] **Step 7: Commit**

```bash
cd ~/projects/delapan
git add delapan/store/sqlite.py delapan/store/supabase.py tests/test_store_sqlite.py
git commit -m "feat(store): raise findings list cap to 1000

A 361-finding KB could not be fully listed; the client had no way to
page past 100. Default limit stays 20."
```

---

### Task 2: Backend — add `total` to `list_findings`

**Files:**
- Modify: `~/projects/delapan/delapan/store/sqlite.py:368-395`
- Modify: `~/projects/delapan/delapan/store/supabase.py:161-171`
- Modify: `~/projects/delapan/delapan/store/base.py:77-81`
- Test: `~/projects/delapan/tests/test_store_sqlite.py`

**Interfaces:**
- Consumes: `LIST_MAX_LIMIT = 1000` (Task 1).
- Produces: `list_findings(kb_id, category=None, limit=None) -> {"count": int, "total": int, "findings": list[dict]}`. `count` = rows returned; `total` = rows matching `kb_id` + `category`, ignoring `limit`. Task 3 and Task 4 depend on `total`.

**Why inline, not `count_findings`:** `count_findings(kb_id)` takes no `category` and is consumed elsewhere (drift marker, tooling). Counting inline keeps its blast radius at zero.

- [ ] **Step 1: Write the failing test**

Append to `tests/test_store_sqlite.py`:

```python
@pytest.mark.asyncio
async def test_list_findings_total_is_uncapped_and_respects_category(store):
    org_id, project_id = store.resolve_project("repoTotal", create=True)
    kb_id = store.resolve_kb(org_id, project_id, "main", create=True)
    rows = [
        {
            "id": f"g{i:07d}",
            "org_id": org_id,
            "kb_id": kb_id,
            "title": f"T{i}",
            "content": {"summary": "s"},
            "category": "research" if i < 4 else "fact",
            "confidence": 0.5,
            "tags": [],
            "provenance": [],
            "embedding": [0.01] * 1536,
        }
        for i in range(10)
    ]
    await store.insert_findings(rows)

    got = store.list_findings(kb_id, limit=3)
    assert got["count"] == 3, "count is rows returned"
    assert got["total"] == 10, "total ignores limit"

    scoped = store.list_findings(kb_id, category="research", limit=2)
    assert scoped["count"] == 2
    assert scoped["total"] == 4, "total honours the category filter"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_store_sqlite.py::test_list_findings_total_is_uncapped_and_respects_category -q`
Expected: FAIL — `KeyError: 'total'`

- [ ] **Step 3: Implement in the SQLite store**

Replace the body of `list_findings` in `delapan/store/sqlite.py` (lines 368-395) with:

```python
    def list_findings(
        self, kb_id: str, category: str | None = None, limit: int | None = None
    ) -> dict:
        """Most-recent findings in `kb_id`. Returns {"count", "total", "findings"}.

        List view omits ``content``/``provenance`` (matching SupabaseStore);
        optional category filter; default/max limits mirror findings/service.
        ``count`` is rows returned, ``total`` is rows matching regardless of
        ``limit`` — the client needs both to tell truncation from completeness."""
        n = min(limit or LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT)
        where = "WHERE kb_id = ?"
        params: list[object] = [kb_id]
        if category:
            where += " AND category = ?"
            params.append(category)

        sql = (
            f"SELECT {', '.join(_FINDING_LIST_COLS)} FROM findings {where} "
            "ORDER BY created_at DESC LIMIT ?;"
        )
        rows = self._conn.execute(sql, (*params, n)).fetchall()
        findings = [self._decode_list_row(r) for r in rows]

        total = int(
            self._conn.execute(
                f"SELECT COUNT(*) AS n FROM findings {where};", tuple(params)
            ).fetchone()["n"]
        )
        return {"count": len(findings), "total": total, "findings": findings}
```

**Before writing this, read the current lines 368-395.** The existing body builds `findings` from `rows` with a JSON-decode step for `tags` (the `_FINDING_LIST_COLS` projection includes `tags`, stored as a JSON column). If there is no `_decode_list_row` helper, keep whatever decode expression the current code uses in place of that call — do not silently drop the `tags` decode, or `tags` arrives as a raw JSON string and Task 7's filter breaks.

- [ ] **Step 4: Implement in the Supabase store**

Replace `list_findings` in `delapan/store/supabase.py` (lines 161-171) with:

```python
    def list_findings(self, kb_id, category=None, limit=None) -> dict:
        n = min(limit or LIST_DEFAULT_LIMIT, LIST_MAX_LIMIT)
        q = (self._c.table("findings")
             .select("id,title,category,confidence,tags,created_at").eq("kb_id", kb_id))
        if category:
            q = q.eq("category", category)
        rows = q.order("created_at", desc=True).limit(n).execute().data
        findings = [{"id": r["id"], "title": r["title"], "category": r["category"],
                     "confidence": r["confidence"], "tags": r.get("tags") or [],
                     "created_at": r["created_at"]} for r in rows]

        cq = self._c.table("findings").select("id", count="exact").eq("kb_id", kb_id)
        if category:
            cq = cq.eq("category", category)
        total = int(cq.execute().count or 0)
        return {"count": len(findings), "total": total, "findings": findings}
```

- [ ] **Step 5: Update the Store Protocol docstring**

In `delapan/store/base.py`, change the `list_findings` docstring (line 80) to:

```python
        """Most-recent findings in `kb_id`. Returns {"count", "total", "findings"}.

        ``count`` is rows returned (bounded by `limit`); ``total`` is rows matching
        `kb_id` + `category` regardless of `limit`."""
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_store_sqlite.py -q`
Expected: PASS

- [ ] **Step 7: Run the full suite**

Run: `cd ~/projects/delapan && .venv/bin/pytest -q`
Expected: all pass. `tests/test_supabase_findings.py` exercises the Supabase store against `tests/fake_supabase.py` — if the fake does not support `select(count="exact")`, extend the fake to return a `count` attribute rather than weakening the store.

- [ ] **Step 8: Commit**

```bash
cd ~/projects/delapan
git add delapan/store/sqlite.py delapan/store/supabase.py delapan/store/base.py tests/test_store_sqlite.py
git commit -m "feat(store): return total alongside count in list_findings

count means rows returned, so a client could not distinguish 'KB has 100
findings' from 'KB has 361, you got 100'. total counts inline against the
same kb_id+category predicate; count_findings is left untouched since it
takes no category and is used elsewhere."
```

---

### Task 3: Backend — pass `limit` through the route

**Files:**
- Modify: `~/projects/delapan/delapan/api/routes_findings.py:33-36`
- Test: `~/projects/delapan/tests/test_api_routes.py`

**Interfaces:**
- Consumes: `list_findings` returning `total` (Task 2).
- Produces: `GET /api/projects/{p}/kbs/{k}/findings?limit=&category=` returning `{"count", "total", "findings"}`.

The route already accepts `limit: int = 50` and forwards it. This task only proves the wire shape and raises the default so the docstring stops lying.

- [ ] **Step 1: Write the failing test**

Read `tests/test_api_routes.py` first to match its client fixture and KB-seeding idiom, then append a test in that style asserting the findings route returns `total`:

```python
def test_findings_route_returns_total(client, seeded_kb):
    project, kb = seeded_kb
    res = client.get(f"/api/projects/{project}/kbs/{kb}/findings?limit=1")
    assert res.status_code == 200
    body = res.json()
    assert set(body) >= {"count", "total", "findings"}
    assert body["count"] <= body["total"]
```

If `test_api_routes.py` has no `seeded_kb`-style fixture, reuse whatever fixture its existing findings/graph route tests use; do not invent a new fixture.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_api_routes.py::test_findings_route_returns_total -q`
Expected: FAIL — `KeyError`/assertion on the missing `total`, unless Tasks 1–2 already satisfy it, in which case it passes immediately and this task is docs-only. That is an acceptable outcome; note it and proceed.

- [ ] **Step 3: Update the route docstring**

In `delapan/api/routes_findings.py`, update the module docstring line 3 to name the new field:

```python
    GET    /api/projects/{p}/kbs/{k}/findings        ──► list_findings (category/limit) → {count,total,findings}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd ~/projects/delapan && .venv/bin/pytest tests/test_api_routes.py -q`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd ~/projects/delapan
git add delapan/api/routes_findings.py tests/test_api_routes.py
git commit -m "test(api): pin findings route count/total wire shape"
```

---

### Task 4: Frontend — commit the pending theme, then fix the findings contract

**Files:**
- Modify: `frontend/src/api/types.ts:93-107`
- Modify: `frontend/src/api/mock.ts:822-828`
- Modify: `frontend/src/api/client.ts:182-191`

**Interfaces:**
- Consumes: backend `{"count", "total", "findings"}` (Tasks 1-3).
- Produces:
  - `FindingRow { id: string; title: string; category: string; confidence: number; tags: string[]; created_at: string }`
  - `FindingsResponse { count: number; total: number; findings: FindingRow[] }`
  - `getFindings(project, kb, params?: { category?: string; limit?: number }): Promise<FindingsResponse>` — signature unchanged, return type narrowed.
  - `Finding` unchanged (still the single-fetch shape used by `getFinding`/`fetchFinding`).

**Context — this is a real drift fix, not a refactor.** `types.ts` says "THE CONTRACT IS LAW — these mirror the backend response shapes exactly". The live backend's list returns a projection with no `content`/`provenance`, but `FindingsResponse.findings` is typed `Finding[]` (which requires both), and `mock.getFindings` returns full `Finding` objects out of its map. So `row.content` type-checks, works offline, and is `undefined` in production. Task 7 consumes list rows, so this must be honest first.

- [ ] **Step 1: Commit the pending light-theme work separately**

```bash
cd ~/Repositories/8star/delapan-ai/frontend
git checkout -b feat/findings-trust-view
git add index.html src/styles/ src/graph/colors.ts src/graph/canvasDraw.ts src/graph/GraphCanvas.tsx
git commit -m "feat(theme): light instrument-panel palette

Retunes tokens to cool-paper surfaces with an amber-700 accent (~4.6:1 on
--bg0), remaps graph hues to mid-lightness/high-chroma so they hold on a
light canvas, and inverts the sigma hover card. Replaces hard-coded amber
glows and black scrims across base/canvas/layout/panels."
git add .claude/launch.json docs/
git commit -m "docs: findings trust view spec + plan; live launch config"
```

- [ ] **Step 2: Write the failing test**

Create `frontend/src/api/findings-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { mockApi } from "./mock";

describe("getFindings list projection", () => {
  it("returns rows with confidence and an uncapped total", async () => {
    const { projects } = await mockApi.getProjects();
    const p = projects[0]!;
    const kb = p.kbs[0]!;
    const res = await mockApi.getFindings(p.project, kb.kb, { limit: 1 });

    expect(res.findings.length).toBeLessThanOrEqual(1);
    expect(res.count).toBe(res.findings.length);
    expect(res.total).toBeGreaterThanOrEqual(res.count);

    const row = res.findings[0];
    if (row) {
      expect(typeof row.confidence).toBe("number");
      expect(row).not.toHaveProperty("content");
      expect(row).not.toHaveProperty("provenance");
    }
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/api/findings-contract.test.ts`
Expected: FAIL — `res.total` is `undefined`, and the mock row still has `content`.

- [ ] **Step 4: Add `FindingRow` and re-type the response**

In `src/api/types.ts`, immediately after the `Finding` interface (ends line 102), add:

```ts
/** The findings LIST projection. The backend's list view selects only these
 *  columns — it omits `content` and `provenance`, which `Finding` carries.
 *  Use `getFinding` when you need the full row. */
export interface FindingRow {
  id: string;
  title: string;
  category: string;
  confidence: number;
  tags: string[];
  created_at: string;
}
```

Then replace the `FindingsResponse` interface (lines 104-107) with:

```ts
export interface FindingsResponse {
  /** rows returned, bounded by `limit` */
  count: number;
  /** rows matching kb + category, ignoring `limit` */
  total: number;
  findings: FindingRow[];
}
```

- [ ] **Step 5: Fix mock parity**

In `src/api/mock.ts`, replace `getFindings` (lines 822-828) with:

```ts
  async getFindings(project: string, kb: string, params: { category?: string; limit?: number } = {}): Promise<FindingsResponse> {
    const data = getKb(project, kb);
    let list = [...data.findings.values()];
    if (params.category) list = list.filter((f) => f.category === params.category);
    const total = list.length;
    if (params.limit !== undefined) list = list.slice(0, params.limit);
    // project to the list shape — the live backend omits content/provenance
    const findings: FindingRow[] = list.map((f) => ({
      id: f.id,
      title: f.title,
      category: f.category,
      confidence: f.confidence,
      tags: f.tags,
      created_at: f.created_at,
    }));
    return { count: findings.length, total, findings };
  },
```

Add `FindingRow` to the existing `import type { ... } from "./types"` block at the top of `mock.ts`. `total` is computed **before** the `limit` slice — that is the whole point.

- [ ] **Step 6: Add `FindingRow` to the client's type imports**

`src/api/client.ts` imports its types in one block (lines 13-30). It does not need `FindingRow` unless it names it; `getFindings` already returns `FindingsResponse`, so leave it alone if the build passes. Do not add an unused import — `noUnusedLocals` fails the build.

- [ ] **Step 7: Run tests and the type gate**

Run: `cd frontend && npx vitest run src/api/findings-contract.test.ts && npm run build`
Expected: test PASS; build PASS. If the build reports `content` missing on a `FindingRow` somewhere, that is a real pre-existing bug this task exposed — fix the call site to use `getFinding`.

- [ ] **Step 8: Commit**

```bash
cd frontend
git add src/api/types.ts src/api/mock.ts src/api/findings-contract.test.ts
git commit -m "fix(api): model the findings list projection as FindingRow

The list route returns id/title/category/confidence/tags/created_at, but
FindingsResponse claimed Finding[] (which requires content+provenance) and
the mock returned full findings. row.content type-checked, worked offline,
and was undefined against the live API. Adds total, computed pre-limit."
```

---

### Task 5: Frontend — pure findings derivations

**Files:**
- Create: `frontend/src/findings/derive.ts`
- Test: `frontend/src/findings/derive.test.ts`

**Interfaces:**
- Consumes: `FindingRow` (Task 4).
- Produces:
  - `VERIFIED_MIN = 0.9`
  - `type Tier = "verified" | "unverified"`
  - `tierOf(confidence: number): Tier`
  - `type Bin = { lo: number; hi: number; count: number }`
  - `bin(rows: FindingRow[], binCount: number): Bin[]`
  - `inRange(rows: FindingRow[], range: [number, number] | null): FindingRow[]`
  Tasks 6-7 consume all of these.

Vitest runs node-env with **no DOM**, so all logic that can be pure lives here and is tested here. Mirrors `src/state/derive.ts` (pure, side-effect free).

- [ ] **Step 1: Write the failing test**

Create `frontend/src/findings/derive.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { FindingRow } from "../api/types";
import { bin, inRange, tierOf, VERIFIED_MIN } from "./derive";

const row = (id: string, confidence: number): FindingRow => ({
  id,
  title: `t-${id}`,
  category: "research",
  confidence,
  tags: [],
  created_at: "2026-07-16T00:00:00Z",
});

describe("tierOf", () => {
  it("cuts at VERIFIED_MIN inclusively", () => {
    expect(VERIFIED_MIN).toBe(0.9);
    expect(tierOf(0.95)).toBe("verified");
    expect(tierOf(0.9)).toBe("verified");
    expect(tierOf(0.899)).toBe("unverified");
    expect(tierOf(0.24)).toBe("unverified");
  });
});

describe("bin", () => {
  it("returns empty bins for no rows", () => {
    const bins = bin([], 4);
    expect(bins).toHaveLength(4);
    expect(bins.every((b) => b.count === 0)).toBe(true);
  });

  it("places confidences in the right bucket and covers 0..1", () => {
    const bins = bin([row("a", 0), row("b", 0.24), row("c", 0.95), row("d", 1)], 4);
    expect(bins).toHaveLength(4);
    expect(bins[0]!.lo).toBe(0);
    expect(bins[3]!.hi).toBe(1);
    expect(bins[0]!.count).toBe(2); // 0 and 0.24 → [0, 0.25)
    expect(bins[3]!.count).toBe(2); // 0.95 and 1.0 → last bin, 1.0 clamped in
  });

  it("counts every row exactly once", () => {
    const rows = [row("a", 0.2), row("b", 0.5), row("c", 0.9), row("d", 1)];
    const bins = bin(rows, 20);
    expect(bins.reduce((n, b) => n + b.count, 0)).toBe(rows.length);
  });
});

describe("inRange", () => {
  it("returns all rows when range is null", () => {
    const rows = [row("a", 0.1), row("b", 0.9)];
    expect(inRange(rows, null)).toHaveLength(2);
  });

  it("filters inclusively on both ends", () => {
    const rows = [row("a", 0.1), row("b", 0.5), row("c", 0.9)];
    expect(inRange(rows, [0.5, 0.9]).map((r) => r.id)).toEqual(["b", "c"]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/findings/derive.test.ts`
Expected: FAIL — cannot resolve `./derive`.

- [ ] **Step 3: Implement**

Create `frontend/src/findings/derive.ts`:

```ts
/**
 * Pure derivations over the findings list projection — no side effects, no DOM
 * (vitest runs node-env). Mirrors src/state/derive.ts.
 */

import type { FindingRow } from "../api/types";

/** Confidence at or above which a finding is treated as adversarially verified.
 *  Calibrated to the two writers in play: the deep-research ingest scores
 *  0.95/0.70, the explore pipeline ~0.2-0.4. A writer on a different scale would
 *  make the accent misleading — change it here, not at call sites. */
export const VERIFIED_MIN = 0.9;

export type Tier = "verified" | "unverified";

export function tierOf(confidence: number): Tier {
  return confidence >= VERIFIED_MIN ? "verified" : "unverified";
}

export interface Bin {
  lo: number;
  hi: number;
  count: number;
}

/** Histogram over confidence in [0, 1]. `binCount` buckets of equal width;
 *  confidence 1.0 lands in the last bin rather than falling off the end. */
export function bin(rows: FindingRow[], binCount: number): Bin[] {
  const width = 1 / binCount;
  const bins: Bin[] = Array.from({ length: binCount }, (_, i) => ({
    lo: i * width,
    hi: (i + 1) * width,
    count: 0,
  }));
  for (const r of rows) {
    const c = Math.min(Math.max(r.confidence, 0), 1);
    const idx = Math.min(Math.floor(c / width), binCount - 1);
    bins[idx]!.count += 1;
  }
  return bins;
}

/** Inclusive on both ends — a brush that ends exactly on 0.9 must include the
 *  0.9 rows, else the verified tier can vanish at its own boundary. */
export function inRange(rows: FindingRow[], range: [number, number] | null): FindingRow[] {
  if (!range) return rows;
  const [lo, hi] = range;
  return rows.filter((r) => r.confidence >= lo && r.confidence <= hi);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/findings/derive.test.ts`
Expected: PASS (11 assertions across 6 tests)

- [ ] **Step 5: Commit**

```bash
cd frontend
git add src/findings/derive.ts src/findings/derive.test.ts
git commit -m "feat(findings): pure confidence derivations (tier, bin, range)"
```

---

### Task 6: Frontend — findings state in the store

**Files:**
- Modify: `frontend/src/state/store.ts:50-60` (state fields), `:80-90` (action types), `:130-140` (initial state), `:190-200` (KB-switch reset), `:315-345` (near `fetchFinding`)

**Interfaces:**
- Consumes: `FindingRow` (Task 4), `getFindings` (Task 4).
- Produces, on the Zustand store:
  - `view: "graph" | "findings"`
  - `setView(view: "graph" | "findings"): void` — lazily triggers `loadFindings()` on first switch to `"findings"`
  - `findings: FindingRow[] | null`
  - `findingsTotal: number`
  - `loadingFindings: boolean`
  - `findingsError: string | null`
  - `confidenceRange: [number, number] | null`
  - `setConfidenceRange(range: [number, number] | null): void`
  - `loadFindings(): void`
  Task 7 consumes all of these.

**Read `src/state/store.ts` before editing** — match its existing shape exactly: the interface declares fields then actions, and actions are defined as object methods using `get()`/`set()`. Mirror `fetchFinding` (line ~321) for the fetch/error idiom.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/state/findingsView.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>("../api/client");
  return {
    ...actual,
    getFindings: vi.fn(async () => ({
      count: 2,
      total: 361,
      findings: [
        { id: "a", title: "A", category: "research", confidence: 0.95, tags: [], created_at: "2026-07-16T00:00:00Z" },
        { id: "b", title: "B", category: "fact", confidence: 0.24, tags: [], created_at: "2026-07-16T00:00:00Z" },
      ],
    })),
  };
});

import * as api from "../api/client";
import { useStore } from "./store";

describe("findings view state", () => {
  beforeEach(() => {
    useStore.setState({
      project: "knowledge-engine",
      kb: "visualization",
      view: "graph",
      findings: null,
      findingsTotal: 0,
      loadingFindings: false,
      findingsError: null,
      confidenceRange: null,
    });
    vi.clearAllMocks();
  });

  it("does not fetch findings while the view is graph", () => {
    expect(api.getFindings).not.toHaveBeenCalled();
    expect(useStore.getState().findings).toBeNull();
  });

  it("loads findings lazily on first switch and keeps total", async () => {
    useStore.getState().setView("findings");
    await vi.waitFor(() => expect(useStore.getState().loadingFindings).toBe(false));

    expect(api.getFindings).toHaveBeenCalledTimes(1);
    expect(useStore.getState().findings).toHaveLength(2);
    expect(useStore.getState().findingsTotal).toBe(361);
  });

  it("does not refetch on a second switch", async () => {
    useStore.getState().setView("findings");
    await vi.waitFor(() => expect(useStore.getState().findings).not.toBeNull());
    useStore.getState().setView("graph");
    useStore.getState().setView("findings");
    expect(api.getFindings).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npx vitest run src/state/findingsView.test.ts`
Expected: FAIL — `setView is not a function`.

- [ ] **Step 3: Add the state fields to the store interface**

In `src/state/store.ts`, add to the state interface (alongside `findingCache` at line ~57):

```ts
  view: "graph" | "findings";
  findings: FindingRow[] | null;
  findingsTotal: number;
  loadingFindings: boolean;
  findingsError: string | null;
  confidenceRange: [number, number] | null;
```

And to the actions section (alongside `fetchFinding(id: string): void` at line ~87):

```ts
  setView(view: "graph" | "findings"): void;
  setConfidenceRange(range: [number, number] | null): void;
  loadFindings(): void;
```

Add `FindingRow` to the existing `import type { ... } from "../api/types"` block.

- [ ] **Step 4: Add the initial state**

Alongside `findingCache: {}` (line ~134):

```ts
  view: "graph",
  findings: null,
  findingsTotal: 0,
  loadingFindings: false,
  findingsError: null,
  confidenceRange: null,
```

- [ ] **Step 5: Reset findings on KB switch**

Find the KB-switch reset that sets `findingCache: {}` (line ~197) and add alongside it:

```ts
      findings: null,
      findingsTotal: 0,
      findingsError: null,
      confidenceRange: null,
```

Do **not** reset `view` — switching KB should keep the user on the surface they chose.

- [ ] **Step 6: Implement the actions**

Add near `fetchFinding` (line ~321), matching its `get()`/`set()` style:

```ts
  setView(view) {
    set({ view });
    if (view === "findings" && !get().findings && !get().loadingFindings) get().loadFindings();
  },

  setConfidenceRange(range) {
    set({ confidenceRange: range });
  },

  loadFindings() {
    const { project, kb, loadingFindings } = get();
    if (!project || !kb || loadingFindings) return;
    set({ loadingFindings: true, findingsError: null });
    api
      .getFindings(project, kb, { limit: 1000 })
      .then((res) =>
        set({
          findings: res.findings,
          findingsTotal: res.total,
          loadingFindings: false,
        }),
      )
      .catch((err: unknown) =>
        set({
          findingsError: err instanceof Error ? err.message : String(err),
          loadingFindings: false,
        }),
      );
  },
```

`limit: 1000` matches the backend's raised `LIST_MAX_LIMIT` (Task 1). `total` still tells the truth if a KB exceeds it.

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npx vitest run src/state/findingsView.test.ts && npm run build`
Expected: tests PASS; build PASS.

- [ ] **Step 8: Run the whole suite**

Run: `cd frontend && npm run test`
Expected: all pass, including the pre-existing `undo.test.ts`, `conceptDoc.test.ts`, `markdown.test.ts`, `openConcept.test.ts`.

- [ ] **Step 9: Commit**

```bash
cd frontend
git add src/state/store.ts src/state/findingsView.test.ts
git commit -m "feat(state): lazy findings load + view toggle + confidence range

Read-only, so it deliberately does not go through Command/UndoManager and
never touches graphology. Findings fetch on first switch to the view, not
on boot."
```

---

### Task 7: Frontend — the FindingsView panel

**Files:**
- Create: `frontend/src/panels/FindingsView.tsx`
- Modify: `frontend/src/styles/panels.css` (append)

**Interfaces:**
- Consumes: `bin`, `inRange`, `tierOf`, `VERIFIED_MIN`, `Bin` (Task 5); store fields from Task 6; `openFinding` (existing, `store.ts` ~line 341).
- Produces: `export function FindingsView(): JSX.Element` — consumed by Task 8.

**Encoding rules (from the spec — do not improvise):** confidence → position + bar length (top of the Cleveland–McGill hierarchy). Verified tier → `var(--accent)`; everything else → grey. **One accent only** — multiple competing highlights cancel the pre-attentive pop-out. Header states `showing N/total` whenever truncated; never truncate silently.

- [ ] **Step 1: Write the component**

Create `frontend/src/panels/FindingsView.tsx`:

```tsx
/**
 * Findings trust view: a brushable confidence histogram over a
 * confidence-sorted table. Read-only — no graphology, no commands.
 *
 *   store.findings ──▶ bin() ──▶ histogram ──brush──▶ confidenceRange
 *                  └──▶ inRange() ──▶ table ──click──▶ FindingDrawer
 */

import { useMemo, useState } from "react";
import { bin, inRange, tierOf, VERIFIED_MIN } from "../findings/derive";
import { useStore } from "../state/store";

const BIN_COUNT = 20;

export function FindingsView() {
  const findings = useStore((s) => s.findings);
  const total = useStore((s) => s.findingsTotal);
  const loading = useStore((s) => s.loadingFindings);
  const error = useStore((s) => s.findingsError);
  const range = useStore((s) => s.confidenceRange);
  const setRange = useStore((s) => s.setConfidenceRange);
  const openFinding = useStore((s) => s.openFinding);

  const rows = useMemo(
    () => [...(findings ?? [])].sort((a, b) => b.confidence - a.confidence),
    [findings],
  );
  const bins = useMemo(() => bin(rows, BIN_COUNT), [rows]);
  const shown = useMemo(() => inRange(rows, range), [rows, range]);
  const verified = useMemo(() => rows.filter((r) => tierOf(r.confidence) === "verified").length, [rows]);

  if (loading) {
    return (
      <div className="fv">
        <div className="cv-loading">
          <span className="spin" /> loading findings…
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fv">
        <div className="fv-error">{error}</div>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="fv">
        <div className="fv-empty placeholder">no findings in this KB yet</div>
      </div>
    );
  }

  const truncated = rows.length < total;

  return (
    <div className="fv">
      <div className="fv-head">
        <h2 className="sect-title">
          Findings{" "}
          <span className="sect-aux">
            {truncated ? `showing ${rows.length}/${total}` : `${total} total`} · {verified} verified
            {range ? ` · brush ${range[0].toFixed(2)}–${range[1].toFixed(2)}` : ""}
          </span>
        </h2>
        {range && (
          <button className="btn btn--ghost" onClick={() => setRange(null)}>
            clear brush
          </button>
        )}
      </div>

      <Histogram bins={bins} range={range} onBrush={setRange} />

      <div className="fv-table">
        {shown.map((f) => (
          <button key={f.id} className="fv-row" onClick={() => openFinding(f.id)}>
            <span className={`fv-conf fv-conf--${tierOf(f.confidence)}`}>
              <i style={{ width: `${Math.round(f.confidence * 100)}%` }} />
            </span>
            <span className="fv-conf-n mono">{f.confidence.toFixed(2)}</span>
            <span className="fv-title">{f.title}</span>
            <span className="fv-cat">{f.category}</span>
          </button>
        ))}
        {!shown.length && <div className="placeholder fv-empty">no findings in that confidence range</div>}
      </div>
    </div>
  );
}

function Histogram({
  bins,
  range,
  onBrush,
}: {
  bins: ReturnType<typeof bin>;
  range: [number, number] | null;
  onBrush: (r: [number, number] | null) => void;
}) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const max = Math.max(...bins.map((b) => b.count), 1);

  const commit = (a: number, b: number) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    // a click (no drag) clears rather than selecting a zero-width range
    if (hi - lo < 1 / bins.length / 2) onBrush(null);
    else onBrush([lo, hi]);
  };

  return (
    <div className="fv-hist" onMouseLeave={() => setDragFrom(null)}>
      {bins.map((b) => {
        const active = !range || (b.hi > range[0] && b.lo < range[1]);
        const verified = b.lo >= VERIFIED_MIN;
        return (
          <button
            key={b.lo}
            className={`fv-bar${verified ? " fv-bar--verified" : ""}${active ? "" : " fv-bar--muted"}`}
            title={`${b.lo.toFixed(2)}–${b.hi.toFixed(2)}: ${b.count}`}
            onMouseDown={() => setDragFrom(b.lo)}
            onMouseUp={() => {
              commit(dragFrom ?? b.lo, b.hi);
              setDragFrom(null);
            }}
          >
            <i style={{ height: `${(b.count / max) * 100}%` }} />
          </button>
        );
      })}
      <div className="fv-axis mono">
        <span>0.0</span>
        <span>confidence</span>
        <span>1.0</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Append the styles**

Append to `frontend/src/styles/panels.css`:

```css
/* --- findings trust view ------------------------------------------------- */

.fv {
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  overflow: hidden;
  background: var(--bg0);
}

.fv-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  padding: 10px 12px 6px;
}

.fv-head .sect-title {
  margin: 0;
  flex: 1;
}

.fv-error {
  margin: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--red);
}

.fv-empty {
  padding: 18px 12px;
}

.fv-hist {
  position: relative;
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 96px;
  padding: 0 12px 18px;
  border-bottom: 1px solid var(--line);
  user-select: none;
}

.fv-bar {
  flex: 1;
  height: 100%;
  display: flex;
  align-items: flex-end;
  cursor: crosshair;
}

.fv-bar i {
  display: block;
  width: 100%;
  min-height: 1px;
  background: var(--line-bright);
  border-radius: 1px 1px 0 0;
  transition: background 120ms, opacity 120ms;
}

.fv-bar--verified i {
  background: var(--accent);
}

.fv-bar--muted i {
  opacity: 0.3;
}

.fv-axis {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 2px;
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  letter-spacing: 0.08em;
  color: var(--text-faint);
  pointer-events: none;
}

.fv-table {
  flex: 1;
  overflow-y: auto;
}

.fv-row {
  display: grid;
  grid-template-columns: 54px 34px 1fr auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 5px 12px;
  text-align: left;
  font-size: 12px;
  color: var(--text);
  border-bottom: 1px solid var(--line);
}

.fv-row:hover {
  background: var(--bg2);
}

.fv-conf {
  display: block;
  height: 4px;
  background: var(--bg3);
  border-radius: 2px;
  overflow: hidden;
}

.fv-conf i {
  display: block;
  height: 100%;
  background: var(--text-faint);
}

.fv-conf--verified i {
  background: var(--accent);
}

.fv-conf-n {
  font-size: 10px;
  color: var(--text-dim);
}

.fv-title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fv-cat {
  font-family: var(--font-mono);
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-faint);
}
```

- [ ] **Step 3: Verify the type gate**

Run: `cd frontend && npm run build`
Expected: PASS. `FindingsView` is not yet mounted, so an unused-export warning is fine, but an unused *local* fails the build.

- [ ] **Step 4: Commit**

```bash
cd frontend
git add src/panels/FindingsView.tsx src/styles/panels.css
git commit -m "feat(findings): brushable confidence histogram + sorted table

Confidence encodes as position+length (top of Cleveland-McGill); the
verified tier takes the single accent and everything else greys out, per
the pre-attentive one-accent rule. Header states showing N/total so a
truncated list can never read as complete."
```

---

### Task 8: Frontend — mount the view behind a toggle

**Files:**
- Modify: `frontend/src/App.tsx:54-71`
- Modify: `frontend/src/panels/TopBar.tsx:42-85`
- Modify: `frontend/src/styles/layout.css` (append)

**Interfaces:**
- Consumes: `FindingsView` (Task 7); `view`/`setView` (Task 6).
- Produces: the shipped feature. Nothing downstream.

- [ ] **Step 1: Add the segmented toggle to TopBar**

In `src/panels/TopBar.tsx`, add to the existing `useStore` selector block (after line ~27):

```tsx
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
```

Then insert this immediately before `<GraphSearch />` (line ~51):

```tsx
      <div className="tb-seg" role="group" aria-label="view">
        <button
          className={`tb-seg-btn${view === "graph" ? " tb-seg-btn--on" : ""}`}
          onClick={() => setView("graph")}
        >
          graph
        </button>
        <button
          className={`tb-seg-btn${view === "findings" ? " tb-seg-btn--on" : ""}`}
          onClick={() => setView("findings")}
        >
          findings
        </button>
      </div>
```

- [ ] **Step 2: Swap the canvas region in App**

In `src/App.tsx`, add to the selector block (after line ~23):

```tsx
  const view = useStore((s) => s.view);
```

Add the import beside the other panel imports:

```tsx
import { FindingsView } from "./panels/FindingsView";
```

Replace the canvas region (lines 59-62) with:

```tsx
        <div style={{ position: "relative", minWidth: 0 }}>
          {view === "graph" ? <GraphCanvas /> : <FindingsView />}
          {view === "graph" && travel && <TravelHud />}
        </div>
```

`TravelHud` is gated on the graph view — travel mode is meaningless over a table, and leaving it mounted would float the HUD above the findings list.

- [ ] **Step 3: Append the toggle styles**

Append to `frontend/src/styles/layout.css`:

```css
.tb-seg {
  display: flex;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
}

.tb-seg-btn {
  padding: 4px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.08em;
  color: var(--text-dim);
  background: var(--bg2);
  transition: color 120ms, background 120ms;
}

.tb-seg-btn:hover {
  color: var(--text);
}

.tb-seg-btn--on {
  color: var(--accent);
  background: var(--accent-dim);
}
```

- [ ] **Step 4: Type gate + full suite**

Run: `cd frontend && npm run build && npm run test`
Expected: both PASS.

- [ ] **Step 5: Verify in the browser**

Start the backend if it is not running, then:

```bash
cd frontend && npm run dev
```

Check, in order:
1. Load `http://localhost:5173`. The `[ graph | findings ]` toggle is in the top bar; `graph` is on.
2. Click `findings`. The histogram + table render. Confirm the network tab shows exactly **one** `GET .../findings?limit=1000`.
3. Switch to `knowledge-engine` / `visualization` — the KB with 361 findings and **zero KG nodes**. The graph view is empty for it; the findings view must not be. The header should read `361 total · 29 verified` (or `showing N/361` if the backend cap still bites).
4. The histogram must show the **bimodal** shape: a tall mass at 0.2–0.4 in grey, a short amber bar at ≥0.9. That shape is the whole point — if everything is one colour, `VERIFIED_MIN` or the tier class is wrong.
5. Drag across the amber bars → the table filters to verified rows only. Click a bar without dragging → brush clears.
6. Click a row → the existing `FindingDrawer` opens with full content and provenance.
7. Switch back to `graph` → the graph still renders and travel mode still works.

- [ ] **Step 6: Commit**

```bash
cd frontend
git add src/App.tsx src/panels/TopBar.tsx src/styles/layout.css
git commit -m "feat(app): mount findings view behind a graph/findings toggle

TravelHud is gated to the graph view so it cannot float over the table."
```

---

## Self-Review

**Spec coverage:**

| Spec requirement | Task |
|---|---|
| `LIST_MAX_LIMIT` 100 → 1000 (both stores) | 1 |
| `total` added, counted inline, `count_findings` untouched | 2 |
| Route passes `limit`, docstring names `total` | 3 |
| `FindingRow` + `FindingsResponse{count,total}` | 4 |
| Mock parity restored, `total` pre-limit | 4 |
| `derive.ts` — `bin`/`tierOf`/`inRange`, 0.9 as a named constant | 5 |
| Lazy load, KB-switch reset, no Command/undo | 6 |
| Histogram + brush + sorted table, one accent, `showing N/total` | 7 |
| TopBar toggle, canvas swap, drawer reuse | 8 |
| Vitest node-env, pure derivations only | 5, 6 |
| Backend pytest: cap + `total` + category | 1, 2 |

**Known gaps, stated rather than hidden:**
- **Not virtualized.** 361 rows is fine; a 1000-row KB will render 1000 DOM nodes. The spec accepts this; `total` keeps it honest. Revisit if a KB exceeds ~1–2k.
- **The brush is bin-granular**, not pixel-continuous — it snaps to bin edges. Simpler, and adequate at 20 bins. A pixel-precise brush would need DOM measurement, which the no-DOM test env cannot cover.
- **Out of scope, unchanged:** the broken synopsis rebuild (missing `ANTHROPIC_API_KEY`) means the left rail's "12 findings" stays wrong while the findings view says 361. That contradiction is *visible* after Task 8 and is expected — do not "fix" it by making the view read the synopsis.
