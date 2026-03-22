# Roast Creation with Gemini Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement end-to-end roast creation so users can submit code from homepage, get Gemini analysis persisted in database, and view real results at `/roast/[id]`.

**Architecture:** Use a Server Action write path (`createRoastAction`) to validate `FormData`, call a server-only Gemini service, and persist `submissions` + `analysis_items` + `diff_suggestions` in one transaction before redirecting. Use a new tRPC read router (`roast.byId`) to provide typed normalized data for `src/app/roast/[id]/page.tsx`. Keep UI composition patterns already used in the codebase.

**Tech Stack:** Next.js App Router (Server Actions), TypeScript, tRPC, Drizzle ORM, Postgres, Zod, `@google/genai`, Biome.

---

## File Structure and Responsibilities

- Create: `src/server/roast/types.ts`
  - Shared domain schemas/types for normalized roast payloads.
- Create: `src/server/roast/gemini-roast-service.ts`
  - Server-only Gemini integration, prompt building, strict response parsing.
- Create: `src/server/roast/gemini-roast-service.test.ts`
  - Unit tests for parser/normalization contract.
- Create: `src/app/_actions/create-roast-action.ts`
  - Server Action orchestration for form input validation, service call, transactional inserts, redirect.
- Create: `src/app/_actions/create-roast-action.test.ts`
  - Unit tests for action validation and error contract.
- Modify: `src/app/_components/home-page-client.tsx`
  - Form wiring to Server Action with hidden inputs (`code`, `roastMode`) and pending/error state.
- Create: `src/trpc/routers/roast.ts`
  - `roast.byId` typed read endpoint with normalized numeric score and ordered children.
- Modify: `src/trpc/routers/_app.ts`
  - Register `roastRouter`.
- Create: `src/trpc/routers/roast.test.ts`
  - Router-level tests for byId shape, null behavior, and ordering.
- Modify: `src/app/roast/[id]/page.tsx`
  - Replace mock data with real read from `caller.roast.byId` and `notFound()` flow.
- Modify: `package.json`
  - Add canonical `test` script for CI/local consistency.

### Task 1: Define Roast Domain Types and Gemini Parsing Contract

**Files:**
- Create: `src/server/roast/types.ts`
- Create: `src/server/roast/gemini-roast-service.ts`
- Create: `src/server/roast/gemini-roast-service.test.ts`

- [ ] **Step 1: Write failing tests for Gemini normalization contract**

Create `src/server/roast/gemini-roast-service.test.ts` with tests for:
- valid model JSON maps to typed output
- malformed JSON is rejected
- invalid enum values are rejected
- missing required keys are rejected

Example test shape:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGeminiRoastResponse } from "./gemini-roast-service";

describe("parseGeminiRoastResponse", () => {
  it("parses valid roast payload", () => {
    const parsed = parseGeminiRoastResponse(
      JSON.stringify({
        score: 3.2,
        roastQuote: "harsh quote",
        analysisItems: [
          {
            severity: "critical",
            title: "issue",
            description: "desc",
            sortOrder: 0,
          },
        ],
        diffSuggestions: [
          {
            lineType: "context",
            content: "const x = 1",
            lineNumber: 1,
          },
        ],
      })
    );

    assert.equal(parsed.score, 3.2);
  });
});
```

- [ ] **Step 2: Run tests to verify RED state**

Run: `npx tsx --test src/server/roast/gemini-roast-service.test.ts`
Expected: FAIL because parser/service contract is not implemented.

- [ ] **Step 3: Implement minimal domain types + parser**

In `src/server/roast/types.ts` define zod schemas and exported types for:
- `RoastAnalysisItem`
- `RoastDiffSuggestion`
- `RoastAnalysisResult`

In `src/server/roast/gemini-roast-service.ts`:
- add `import "server-only"`
- implement `parseGeminiRoastResponse(raw: string)` using zod.
- keep Gemini network call stubbed/minimal for this task.

- [ ] **Step 4: Re-run tests to verify GREEN state**

Run: `npx tsx --test src/server/roast/gemini-roast-service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/roast/types.ts src/server/roast/gemini-roast-service.ts src/server/roast/gemini-roast-service.test.ts
git commit -m "test: add roast domain parser contract for gemini output"
```

### Task 2: Implement Gemini Service Call and Prompt Modes

**Files:**
- Modify: `src/server/roast/gemini-roast-service.ts`
- Modify: `src/server/roast/gemini-roast-service.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add failing tests for roast mode prompt behavior**

Add tests that assert prompt builder includes mode instructions:
- roast mode ON => sarcastic persona instruction present
- roast mode OFF => technical/direct instruction present

- [ ] **Step 2: Run tests to confirm failure**

Run: `npx tsx --test src/server/roast/gemini-roast-service.test.ts`
Expected: FAIL for missing prompt builder/service functions.

- [ ] **Step 3: Install Gemini SDK dependency**

Run: `npm install @google/genai`
Expected: dependency and lockfile updated.

- [ ] **Step 4: Implement Gemini integration minimally**

In `gemini-roast-service.ts`:
- use `@google/genai`
- fixed model id constant: `gemini-2.5-flash`
- implement:
  - `buildRoastPrompt({ code, roastMode, language })`
  - `analyzeCodeWithGemini(input)` returning parsed `RoastAnalysisResult`
- enforce JSON-structured output and parse through `parseGeminiRoastResponse`

- [ ] **Step 5: Run tests for service module**

Run: `npx tsx --test src/server/roast/gemini-roast-service.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/server/roast/gemini-roast-service.ts src/server/roast/gemini-roast-service.test.ts
git commit -m "feat: implement gemini roast service with mode-specific prompts"
```

### Task 3: Add Create Roast Server Action with Transaction

**Files:**
- Create: `src/app/_actions/create-roast-action.ts`
- Create: `src/app/_actions/create-roast-action.test.ts`

- [ ] **Step 1: Write failing tests for action contract**

Tests should cover:
- invalid/empty code returns `{ error }`
- code above `MAX_CODE_LENGTH` returns `{ error }` before Gemini call
- `roastMode` string coercion works (`"true"` / `"false"`)
- Gemini service error returns `{ error }` and does not insert partial rows
- successful valid payload inserts `submissions` + `analysis_items` + `diff_suggestions` and triggers redirect to `/roast/[id]`

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/app/_actions/create-roast-action.test.ts`
Expected: FAIL because action not implemented.

- [ ] **Step 3: Implement action orchestration**

Implement in `create-roast-action.ts`:
- file-level `"use server"`
- zod `FormData` parsing with preprocess coercion for `roastMode`
- zod guard for `code.trim().length > 0` and `code.length <= MAX_CODE_LENGTH`
- derive `linesCount` and language fallback
- call `analyzeCodeWithGemini`
- transaction insert into `submissions`, `analysis_items`, `diff_suggestions`
- on success: `redirect(`/roast/${id}`)`
- on failure: return `{ error: "..." }`

- [ ] **Step 4: Re-run action tests**

Run: `npx tsx --test src/app/_actions/create-roast-action.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/_actions/create-roast-action.ts src/app/_actions/create-roast-action.test.ts
git commit -m "feat: add server action for roast creation with transactional writes"
```

### Task 4: Wire Homepage Form to Server Action

**Files:**
- Modify: `src/app/_components/home-page-client.tsx`

- [ ] **Step 1: Define deterministic manual interaction verification (explicit non-TDD exception)**

This task uses manual verification because the repository currently has no React DOM interaction test harness configured.

Checklist to verify before implementation:
- hidden input `code` mirrors editor state
- hidden input `roastMode` mirrors toggle state
- submit button reflects pending/disabled states

- [ ] **Step 2: Implement form wiring**

Update `home-page-client.tsx` to:
- import and bind `createRoastAction` via `useActionState`
- render `<form action={formAction}>`
- add hidden fields:
  - `name="code"` with state value
  - `name="roastMode"` with boolean string value
- render inline error text from action state
- use `useFormStatus()` for submit pending UI

- [ ] **Step 3: Verify manually in dev**

Run: `npm run dev`
Expected:
- submit disabled when code invalid
- roast mode reflected in hidden field
- failed action shows inline error

- [ ] **Step 4: Commit**

```bash
git add src/app/_components/home-page-client.tsx
git commit -m "feat: connect homepage roast form to create action"
```

### Task 5: Implement tRPC Roast Read Router

**Files:**
- Create: `src/trpc/routers/roast.ts`
- Modify: `src/trpc/routers/_app.ts`
- Create: `src/trpc/routers/roast.test.ts`

- [ ] **Step 1: Write failing router tests**

Cover:
- `byId` returns normalized score as `number`
- child arrays ordered with deterministic tie-breakers:
  - analysis by `sortOrder ASC, id ASC`
  - diff by `lineNumber ASC, id ASC`
- missing id returns `null`

- [ ] **Step 2: Run tests to verify failure**

Run: `npx tsx --test src/trpc/routers/roast.test.ts`
Expected: FAIL before router exists.

- [ ] **Step 3: Implement roast router and registration**

In `roast.ts`:
- `byId` input zod `{ id: z.string().uuid() }`
- query submission + related rows
- normalize numeric score to `number`
- deterministic ordering:
  - analysis: `sortOrder ASC, id ASC`
  - diff: `lineNumber ASC, id ASC`
- return `null` when missing

In `_app.ts`:
- register `roast: roastRouter`

- [ ] **Step 4: Run router tests**

Run: `npx tsx --test src/trpc/routers/roast.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/trpc/routers/roast.ts src/trpc/routers/_app.ts src/trpc/routers/roast.test.ts
git commit -m "feat: add roast byId tRPC read endpoint"
```

### Task 6: Replace Roast Result Page Mock with Real Data

**Files:**
- Modify: `src/app/roast/[id]/page.tsx`

- [ ] **Step 1: Capture baseline (mock-based page) with known id source**

Run: `npm run dev` and open any `/roast/<id>` (existing or random id; current page is mock and ignores id).
Expected: static mock content currently renders regardless of id value.

- [ ] **Step 2: Implement data-backed page**

Update page to:
- read dynamic route id
- call `caller.roast.byId({ id })`
- invoke `notFound()` on `null`
- bind real response values into existing sections (score, quote, code, analysis cards, diff lines)
- keep share button as non-functional placeholder

- [ ] **Step 3: Manual verify route behavior**

Run: `npm run dev`
Expected:
- existing id renders persisted roast
- missing id renders not-found page

- [ ] **Step 4: Commit**

```bash
git add "src/app/roast/[id]/page.tsx"
git commit -m "feat: render roast result page from persisted data"
```

### Task 7: Add Canonical Test Script and Full Verification

**Files:**
- Modify: `package.json`
- Verify: all changed roast-related files

- [ ] **Step 1: Add canonical `npm run test` script**

Set in `package.json`:

```json
"test": "tsx --test \"src/**/*.test.ts\""
```

- [ ] **Step 2: Run all tests**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 3: Run repository quality checks**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Final commit for verification adjustments**

```bash
git add package.json
git commit -m "chore: add canonical test command and finalize roast verification"
```

## Done Criteria

- Homepage can submit code + roast mode through a Server Action.
- Gemini service (server-only) returns validated structured roast payload.
- Persistence is transactional across submissions, analysis items, and diff suggestions.
- `/roast/[id]` uses real persisted data via `roast.byId` and no longer uses static mock object.
- Missing roast id resolves to `notFound()` behavior.
- `share_roast` remains intentionally unimplemented.
- `npm run test`, `npm run check`, and `npm run build` all pass.
