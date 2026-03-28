# Design Spec - Roast Creation with Gemini

## Context

DevRoast already has:

- Homepage code editor UI with roast mode toggle in `src/app/_components/home-page-client.tsx`
- Database schema for roast outputs in `submissions`, `analysis_items`, and `diff_suggestions`
- Leaderboard read paths and score-based ranking
- Roast result route `src/app/roast/[id]/page.tsx` still using static mock data

Goal: implement the core product flow where a user submits code, the backend analyzes it with Gemini, persists structured roast output, and redirects to a real `/roast/[id]` page.

## Scope

### In scope

- Create roast submission flow from homepage.
- Support roast mode flag (more sarcastic analysis when enabled).
- Integrate Gemini API on server side.
- Persist full roast payload:
  - submission score and quote
  - analysis items (critical/warning/good)
  - suggested diff lines (added/removed/context)
- Replace `/roast/[id]` mock rendering with database-backed data.
- Add tRPC read endpoint for roast result by id.

### Out of scope

- Share roast feature.
- Async job queue, polling, or streaming generation.
- Advanced language detection pipeline.
- Retry orchestration/backoff policy beyond basic error handling.

## Product Decisions (Validated)

- Submit behavior: create roast then redirect to `/roast/[id]`.
- AI integration: real Gemini API (using server-side API key).
- Output shape: full payload (score, roastQuote, analysisItems, diffSuggestions).
- Processing model: synchronous request lifecycle for V1.

## Approach Chosen

Chosen architecture: **Server Action for create + service layer for Gemini + tRPC for read**.

Why:

- Best fit for App Router form submit + server redirect semantics.
- Keeps write orchestration out of client components.
- Maintains tRPC as typed read model for route rendering.
- Preserves clean boundaries: UI submit -> action -> domain service -> persistence -> read API.

## Technical Design

## 1) Write Path (Create Roast)

### 1.1 Homepage submit integration

File: `src/app/_components/home-page-client.tsx`

- Wrap editor + actions in a form that posts to a Server Action.
- Because `CodeEditorRoot` and `Toggle` are not native form inputs, sync state through hidden inputs:
  - `<input type="hidden" name="code" value={code} />`
  - `<input type="hidden" name="roastMode" value={String(roastMode)} />`
- Use `useFormStatus()` to prevent duplicate submission and show pending state on submit button.

### 1.2 Server Action orchestration

File: `src/app/_actions/create-roast-action.ts` (new)

Responsibilities:

- Must be a Server Action module (`"use server"` at file top).
- Export action with `useActionState`-compatible shape, e.g.:
  - `(prevState: { error?: string } | null, formData: FormData) => Promise<{ error?: string } | void>`
- Validate input with zod (`code`, `roastMode`).
- Enforce code limits (empty/whitespace rejected, max length bounded).
- Parse `roastMode` from `FormData` with explicit coercion (`"true"/"false"` -> boolean via `z.preprocess` or equivalent).
- Derive metadata:
  - `linesCount`
  - initial `language` (simple heuristic or fallback `plaintext`)
- Call roast domain service (Gemini-backed).
- Persist results in a single DB transaction:
  - insert `submissions`
  - insert related `analysis_items`
  - insert related `diff_suggestions`
- Redirect to `/roast/[id]` on success.
- Action contract:
  - success path always `redirect(`/roast/${id}`)`
  - error path returns `{ error: string }` for client rendering via `useActionState`.

## 2) Gemini Domain Service

### 2.1 Service boundary

File: `src/server/roast/gemini-roast-service.ts` (new)

Responsibilities:

- Must be server-only (`import "server-only"`).
- Standardize integration on the official package `@google/genai`.
- Use one defined entrypoint and fixed model ID for V1: `gemini-2.5-flash` (no runtime model switching in this scope), with JSON-structured output mode.
- Build model prompt based on `roastMode`:
  - `roastMode = true`: sarcastic tone allowed
  - `roastMode = false`: direct technical tone
- Require strictly structured JSON output.
- Parse and validate model output with zod schema.
- Return normalized domain object ready for persistence.

### 2.2 Output contract from Gemini service

```ts
type RoastAnalysisResult = {
  score: number;
  roastQuote: string;
  analysisItems: Array<{
    severity: "critical" | "warning" | "good";
    title: string;
    description: string;
    sortOrder: number;
  }>;
  diffSuggestions: Array<{
    lineType: "added" | "removed" | "context";
    content: string;
    lineNumber: number;
  }>;
};
```

## 3) Read Path (Roast Detail)

### 3.1 tRPC read endpoint

Files:

- `src/trpc/routers/roast.ts` (new)
- `src/trpc/routers/_app.ts` (modify to register router)

Endpoint:

- `roast.byId({ id })`
- Missing-id contract: procedure returns `null` when not found (no throw).

Return shape:

- submission core fields (`id`, `code`, `language`, `linesCount`, `score`, `roastQuote`, `createdAt`, `roastMode`)
  - `score` is returned as `number` (never string)
- `roast.byId` performs DB-to-API normalization (including `score` coercion); page consumes already-normalized values without extra coercion.
- ordered `analysisItems` using `ORDER BY sort_order ASC, id ASC`
- ordered `diffSuggestions` using `ORDER BY line_number ASC, id ASC`

### 3.2 Roast page consumption

File: `src/app/roast/[id]/page.tsx`

- Remove static `ROAST` mock object.
- Fetch with `caller.roast.byId({ id })`.
- Use `notFound()` when returned value is `null`.
- Keep existing visual layout and bind real values to the same UI blocks.
- Keep `share_roast` button non-functional placeholder.

## Data Flow

1. User edits code and toggles roast mode on homepage.
2. User submits form.
3. Server Action validates and normalizes input.
4. Action calls Gemini roast service.
5. Service returns validated structured roast payload.
6. Action writes all entities in one transaction.
7. Action redirects to `/roast/[id]`.
8. Roast page calls `roast.byId` and renders persisted result.

## Error Handling and Resilience

- Input validation failures:
  - reject invalid payload before model call
  - return user-friendly form error state via action return `{ error }`
- Gemini failures (network/timeout/invalid JSON/schema mismatch):
  - fail request with safe message
  - do not persist partial or malformed roast
- Persistence safety:
  - transaction required across submission + analysis + diff rows
- Read errors:
  - unknown id => `notFound()`
- Secrets and security:
  - `GEMINI_API_KEY` read only on server
  - no API key access from client

## Testing Strategy

## 1) Unit tests

- Gemini output parser/validator:
  - valid structured output
  - malformed JSON
  - invalid severity/lineType values
  - missing required fields
- Mapping logic for DB insert payloads.

Execution contract: use Node built-in test runner (`node --test` / `tsx --test`) for new unit suites.

## 2) Server Action tests

- invalid input rejected before service call
- Gemini failure does not persist data
- successful run persists all records and redirects with id

## 3) tRPC router tests (`roast.byId`)

- returns complete shape with correctly ordered child arrays
- maps numeric score to `number`
- returns `null` for missing ids

## 4) Integration checks

- homepage submit (roastMode on/off) reaches `/roast/[id]`
- `/roast/[id]` renders persisted values for score, quote, analysis cards, and diff lines

## 5) Repository checks

- `node --test` (or `tsx --test` for TypeScript test files)
- `npm run test` (canonical test entrypoint for local and CI roast-related tests)
- `npm run check`
- `npm run build`

## Risks and Mitigations

- Risk: Gemini output drift causes parse failures.
  - Mitigation: strict schema validation + deterministic prompt format.
- Risk: synchronous latency may be high.
  - Mitigation: keep V1 synchronous but bounded by request timeout and clear user feedback.
- Risk: large inputs increase cost/latency.
  - Mitigation: input size cap at action boundary.

## Acceptance Criteria

- User can submit code from homepage with roast mode flag.
- Submission triggers Gemini analysis on server.
- Full structured roast is persisted to existing tables.
- User is redirected to `/roast/[id]` and sees real data (no mocks).
- Share roast remains intentionally unimplemented.
- Checks pass (`npm run check`, `npm run build`).
