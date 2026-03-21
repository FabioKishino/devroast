# Leaderboard TopShame Parametrization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/leaderboard` render the 20 worst scored submissions from tRPC/Drizzle with collapsible highlighted code, while keeping homepage behavior unchanged at top 3 by default.

**Architecture:** Extend `leaderboard.topShame` with optional input (`limit`, default `3`, max `20`) using zod validation in the router. Keep homepage caller unchanged (`topShame()`), and convert `src/app/leaderboard/page.tsx` to an async Server Component that fetches `topShame({ limit: 20 })` and `stats()` with `Promise.all`. Reuse `LeaderboardEntryCode` for collapsible behavior and keep existing card composition.

**Tech Stack:** Next.js App Router, TypeScript, tRPC v11, Drizzle ORM, zod, `@base-ui/react`, Shiki `CodeBlock`, Biome.

---

## File Structure and Responsibilities

- Modify: `src/trpc/routers/leaderboard.ts`
  - Add `topShame` input schema with limit validation.
  - Keep ranking/filter query (`score asc`, `createdAt desc`, `score IS NOT NULL`).
  - Select and return `linesCount` plus compatibility `codeLines`.
- Create: `src/trpc/routers/leaderboard.mapper.ts`
  - Pure row mapping from Drizzle row to API output.
  - `linesCount` fallback is defensive only; primary source remains DB-selected `submissions.linesCount`.
- Create: `src/trpc/routers/leaderboard.mapper.test.ts`
  - Focused tests for mapper behavior, including `linesCount` fallback.
- Modify: `src/app/leaderboard/page.tsx`
  - Remove static `ENTRIES`/stats.
  - Fetch backend data via `caller` and render dynamic cards.
  - Render empty message card when no rows.

### Task 1: Add Mapper Tests (Fail First)

**Files:**
- Create: `src/trpc/routers/leaderboard.mapper.test.ts`
- Create: `src/trpc/routers/leaderboard.mapper.ts` (empty stub first)

- [ ] **Step 1: Write failing tests for row mapping**

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapTopShameRow } from "./leaderboard.mapper";

describe("mapTopShameRow", () => {
  it("maps score to number and preserves linesCount", () => {
    const result = mapTopShameRow({
      id: "row-1",
      score: "2.50",
      code: "a\nb\nc\nd",
      language: "typescript",
      linesCount: 4,
    });

    assert.deepEqual(result, {
      id: "row-1",
      score: 2.5,
      code: "a\nb\nc\nd",
      language: "typescript",
      linesCount: 4,
      codeLines: ["a", "b", "c"],
    });
  });

  it("falls back to code-derived linesCount when missing", () => {
    const result = mapTopShameRow({
      id: "row-2",
      score: "1.00",
      code: "x\ny",
      language: "javascript",
      linesCount: undefined,
    });

    assert.equal(result.linesCount, 2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx tsx --test src/trpc/routers/leaderboard.mapper.test.ts`
Expected: FAIL (mapper not implemented yet).

- [ ] **Step 3: Write minimal mapper implementation**

```ts
type TopShameDbRow = {
  id: string;
  score: number | string;
  code: string;
  language: string;
  linesCount?: number;
};

export function mapTopShameRow(row: TopShameDbRow) {
  const fallbackLinesCount = row.code.split("\n").length;

  return {
    id: row.id,
    score: Number(row.score),
    code: row.code,
    language: row.language,
    linesCount: row.linesCount ?? fallbackLinesCount,
    codeLines: row.code.split("\n").slice(0, 3),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx tsx --test src/trpc/routers/leaderboard.mapper.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/trpc/routers/leaderboard.mapper.ts src/trpc/routers/leaderboard.mapper.test.ts
git commit -m "test: add mapper coverage for topShame row output"
```

### Task 2: Parametrize `topShame` in tRPC Router

**Files:**
- Modify: `src/trpc/routers/leaderboard.ts`
- Use: `src/trpc/routers/leaderboard.mapper.ts`

- [ ] **Step 1: Add input schema and default limit logic**

Implement in router:

```ts
import { z } from "zod";
import { mapTopShameRow } from "./leaderboard.mapper";

const topShameInput = z
  .object({
    limit: z.number().int().min(1).max(20).optional(),
  })
  .optional();
```

- [ ] **Step 2: Update `topShame` query to use input limit and select linesCount**

Inside procedure:

```ts
const take = input?.limit ?? 3;

const rows = await ctx.db
  .select({
    id: submissions.id,
    score: submissions.score,
    code: submissions.code,
    language: submissions.language,
    linesCount: submissions.linesCount,
  })
  .from(submissions)
  .where(isNotNull(submissions.score))
  .orderBy(asc(submissions.score), desc(submissions.createdAt))
  .limit(take);

return rows.map(mapTopShameRow);
```

- [ ] **Step 3: Keep existing error strategy unchanged**

Maintain `try/catch` fallback `return []` for runtime query failures only.

- [ ] **Step 4: Run mapper tests after integration**

Run: `npx tsx --test src/trpc/routers/leaderboard.mapper.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/trpc/routers/leaderboard.ts src/trpc/routers/leaderboard.mapper.ts src/trpc/routers/leaderboard.mapper.test.ts
git commit -m "feat: parametrize topShame with optional limit up to 20"
```

### Task 3: Wire `/leaderboard` Page to Backend Data

**Files:**
- Modify: `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Capture baseline behavior before refactor**

Run: `npm run dev`
Expected: `/leaderboard` currently renders 5 static mock cards.

- [ ] **Step 2: Replace static data with `caller` fetches**

Page changes:
- Convert to `export default async function LeaderboardPage()`.
- Import `caller` from `@/trpc/server`.
- Fetch with `Promise.all`:
  - `caller.leaderboard.topShame({ limit: 20 })`
  - `caller.leaderboard.stats()`
- Remove `ENTRIES`, `TOTAL_SUBMISSIONS`, `AVG_SCORE` constants.

- [ ] **Step 3: Render dynamic entries + empty state**

Rendering rules:
- Use `entries.map((entry, index) => ...)` with `rank={index + 1}`.
- Use `LeaderboardEntryMeta` with `score`, `language`, `linesCount`.
- Wrap `CodeBlock` in `LeaderboardEntryCode lineCount={entry.linesCount}`.
- If `entries.length === 0`, render a single message card with `// no roasted submissions yet` and no rank/score meta row.

- [ ] **Step 4: Verify page behavior in dev**

Run: `npm run dev`
Expected:
- `/leaderboard` shows up to 20 entries from DB.
- Collapsible toggle appears only when line threshold is reached.
- Hero stats render from backend values.

- [ ] **Step 5: Commit**

```bash
git add src/app/leaderboard/page.tsx
git commit -m "feat: wire leaderboard page to topShame limit 20"
```

### Task 4: Verify Ranking, Filtering, and Input Validation

**Files:**
- Verify: `src/trpc/routers/leaderboard.ts`
- Verify: `src/app/_components/homepage-leaderboard.tsx`
- Verify: `src/app/leaderboard/page.tsx`

- [ ] **Step 1: Seed controlled data for deterministic checks**

Run: `npm run db:seed`
Expected: database has enough rows to verify ordering/filter behavior.

- [ ] **Step 2: Verify homepage default remains top 3**

Run app and inspect homepage leaderboard.
Expected: still 3 rows from `caller.leaderboard.topShame()` with no input.

- [ ] **Step 3: Verify `/leaderboard` ranking and null-score filtering**

Check on `/leaderboard`:
- Rows with null score are excluded.
- For equal score rows, newer `createdAt` appears first.

- [ ] **Step 4: Verify invalid input behavior explicitly**

Use temporary script or REPL calling router/caller with invalid input.
Example call: `caller.leaderboard.topShame({ limit: 21 })`
Expected: input validation error from tRPC/zod (not `[]`).

- [ ] **Step 5: Add lightweight automated contract test for input schema**

Create a focused test for the exported zod input schema (or a tiny router-level contract helper) asserting:
- `limit: 1` and `limit: 20` are accepted.
- `limit: 0` and `limit: 21` are rejected.

Run: `npx tsx --test src/trpc/routers/leaderboard.mapper.test.ts`
Expected: PASS (or add a dedicated schema test file and run it).

- [ ] **Step 6: Run repo checks**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 7: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 8: Verify syntax highlighting is visible on `/leaderboard`**

Check at least one rendered entry and confirm tokenized highlighting is present in `CodeBlock` output.

- [ ] **Step 9: Final commit for verification-related adjustments**

```bash
git add src/trpc/routers/leaderboard.ts src/trpc/routers/leaderboard.mapper.ts src/trpc/routers/leaderboard.mapper.test.ts src/app/leaderboard/page.tsx
git commit -m "chore: finalize leaderboard top 20 integration verification"
```

## Done Criteria

- `topShame` accepts optional input with `limit` validation (`1..20`) and default `3`.
- Homepage still uses `topShame()` and displays 3 rows.
- `/leaderboard` no longer uses static mock entries and requests `topShame({ limit: 20 })`.
- `/leaderboard` renders 20 rows when at least 20 eligible rows exist (otherwise fewer).
- Ranking is `score ASC`, tie-breaker `createdAt DESC`.
- Rows with null score are excluded.
- Entry code is collapsible via `LeaderboardEntryCode` and highlighted via `CodeBlock`.
- `npm run check` and `npm run build` pass.
