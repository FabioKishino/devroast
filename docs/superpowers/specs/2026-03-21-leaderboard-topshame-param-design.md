# Design Spec - Leaderboard TopShame Parametrization

## Context

The `/leaderboard` page is currently static in `src/app/leaderboard/page.tsx`.
The homepage already uses tRPC (`caller.leaderboard.topShame()` and `caller.leaderboard.stats()`) and renders a compact top list.

Goal: implement backend + frontend integration for `/leaderboard` using the same ranking logic as the homepage, with collapsible code sections and syntax highlighting, showing only the 20 worst submissions without pagination.

## Scope

### In scope

- Parametrize `leaderboard.topShame` with optional `limit` input.
- Keep homepage behavior unchanged (still top 3 by default).
- Wire `/leaderboard` to real data through tRPC server calls.
- Keep `/leaderboard` card layout (`LeaderboardEntryRoot` + `LeaderboardEntryMeta` + `LeaderboardEntryCode` + `CodeBlock`).
- Ensure collapsible behavior for each leaderboard entry and syntax highlighting.
- Show up to 20 worst scored submissions (no pagination).

### Out of scope

- Database schema changes or migrations.
- New ranking formulas.
- Pagination or infinite loading.
- Unrelated UI refactors.

## Requirements Agreed

- Ranking: `score ASC`, tie-breaker `createdAt DESC`.
- Eligibility: only submissions with `score IS NOT NULL`.
- `/leaderboard` visual format: keep current card-based layout.
- Data volume: top 20 only.

## Approach Chosen

Chosen approach: **parametrize existing `topShame` procedure**.

Rationale:

- Reuses existing query and ranking semantics.
- Avoids introducing another endpoint for nearly identical behavior.
- Preserves homepage contract with a default limit.
- Keeps implementation small and focused.

## Technical Design

## 1) tRPC Router Contract

File: `src/trpc/routers/leaderboard.ts`

- Update `topShame` to accept optional input schema:
  - `{ limit?: number }`
  - Constraints: integer, min 1, max 20.
  - Default when omitted: `3`.
- Keep defensive error handling: return `[]` on failure.
- Input validation failures for invalid `limit` are expected tRPC errors and are not coerced to `[]`.
- Resolver `try/catch` fallback to `[]` applies only to runtime/query failures after input parsing.

Query behavior:

- `WHERE submissions.score IS NOT NULL`
- `ORDER BY submissions.score ASC, submissions.createdAt DESC`
- `LIMIT take`
- Select `submissions.linesCount` and return it as `linesCount`.

Returned fields for leaderboard pages:

- `id`
- `score` as `number`
- `code`
- `language`
- `linesCount`
- Backward compatibility:
  - Keep `codeLines` in `topShame` response for this change (deprecated compatibility output).
  - Defer homepage consumer migration to a follow-up spec.

## 2) Homepage Compatibility

File: `src/app/_components/homepage-leaderboard.tsx`

- Keep calling `caller.leaderboard.topShame()` with no input.
- Default limit keeps homepage at top 3.
- No UI behavior changes intended.

## 3) Leaderboard Page Data Integration

File: `src/app/leaderboard/page.tsx`

- Keep `page.tsx` as an `async` Server Component and fetch via `import { caller } from "@/trpc/server"`.
- Remove static mock arrays/constants used for entries and stats.
- Fetch page data server-side via:
  - `caller.leaderboard.topShame({ limit: 20 })`
  - `caller.leaderboard.stats()`
  - Execute with `Promise.all`.
- Map fetched rows to render entries:
  - `rank = index + 1`
  - `score`, `language`, `code`, `linesCount`
- Keep existing card composition (`LeaderboardEntryRoot` + `LeaderboardEntryMeta`).
- Use `LeaderboardEntryCode` as wrapper to preserve collapsible behavior with syntax highlighting.

## 4) Empty and Failure States

- If `topShame` returns `[]`, render one bordered empty card in entries with text: `// no roasted submissions yet`.
- Use the same entries section composition style as regular cards (reuse `LeaderboardEntryRoot` container-level styling for spacing/border consistency).
- Empty card does not render rank/score meta row; render message-only body for clarity.
- Keep hero stats visible even when entries are empty.
- If stats fail, rely on existing fallback values from `stats` procedure (`0` values).
- Page must not crash when data is unavailable.

## Data Flow

1. Server renders `/leaderboard` page.
2. Page requests `topShame({ limit: 20 })` + `stats()` via tRPC caller.
3. Router queries Postgres through Drizzle with agreed ranking/filter.
4. Page renders hero stats + 0-20 entries.
5. Each entry shows metadata + collapsible highlighted code block.

## Testing and Verification Plan

Mandatory project checks:

- `npm run check`
- `npm run build`

Functional verification:

- Homepage still displays top 3 entries.
- `caller.leaderboard.topShame()` with no input still returns exactly 3 items by default.
- `/leaderboard` shows up to 20 entries.
- Order is correct (`score ASC`, `createdAt DESC` on ties).
- Use controlled/seeded data with at least two rows sharing the same score and different `createdAt` to verify tie-break deterministically.
- Entries exclude rows with null score.
- Collapsible works for each entry.
- Syntax highlighting remains active.
- Empty database/failure path shows safe fallback UI.

## Risks and Mitigations

- Risk: changing `topShame` signature may affect existing callers.
  - Mitigation: optional input with stable default (`3`).
- Risk: larger render cost with 20 highlighted snippets.
  - Mitigation: cap at 20 and keep no pagination for now by explicit requirement.

## Acceptance Criteria

- `/leaderboard` is fully data-driven from tRPC/Drizzle.
- Exactly top 20 worst scored submissions are requested (or fewer if unavailable).
- Ranking/filter rules match agreed behavior.
- Homepage behavior remains unchanged.
- Checks pass (`npm run check` and `npm run build`).
