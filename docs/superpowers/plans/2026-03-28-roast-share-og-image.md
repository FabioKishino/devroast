# Roast Share OG Image with Takumi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generate dynamic Open Graph images for `/roast/[id]` links using Takumi, with short cache headers and resilient fallback images when data/rendering fails.

**Architecture:** Keep roast data sourcing in existing server-side paths (`caller.roast.byId`) and add a dedicated OG image rendering route at `src/app/roast/[id]/opengraph-image.tsx`. Split pure transformation logic (view model, truncation, verdict labels, cache constants) into small server utilities with unit tests. Add `generateMetadata` to the roast page so Open Graph and Twitter embeds always point to the roast-specific image URL.

**Tech Stack:** Next.js 16 App Router, TypeScript, Takumi (`@takumi-rs/image-response`), tRPC caller, Node test runner (`tsx --test`), Biome.

---

## File Structure and Responsibilities

- Create: `src/server/og/roast-og-view-model.ts`
  - Pure mapping from roast entity to OG render model, including quote truncation and fallback copy.
- Create: `src/server/og/roast-og-view-model.test.ts`
  - Unit tests for mapping logic, truncation, and deterministic labels.
- Create: `src/server/og/roast-og-cache.ts`
  - Shared constants for cache-control policy and helper to build header value.
- Create: `src/server/og/roast-og-cache.test.ts`
  - Unit tests that lock exact cache header output.
- Create: `src/server/og/roast-og-metadata.ts`
  - Pure metadata helper for roast-aware and fallback title/description + image URL.
- Create: `src/server/og/roast-og-metadata.test.ts`
  - Unit tests that lock valid/fallback metadata copy and URL composition.
- Create: `src/app/roast/[id]/opengraph-image.tsx`
  - Dynamic image route rendering roast OG card with Takumi and fallback image paths.
- Modify: `src/app/roast/[id]/page.tsx`
  - Add `generateMetadata` and wire Open Graph/Twitter image URL for each roast id.
- Modify: `next.config.ts`
  - Add `@takumi-rs/core` to `serverExternalPackages` for Next.js native module loading.
- Modify: `package.json`
  - Add `@takumi-rs/image-response` dependency.

---

### Task 1: Add OG View Model Module with RED->GREEN Unit Tests

**Files:**
- Create: `src/server/og/roast-og-view-model.ts`
- Create: `src/server/og/roast-og-view-model.test.ts`

- [ ] **Step 1: Write failing tests for view model mapping and truncation**

Create tests for:
- roast score and verdict label mapping
- inclusion of `language` + `linesCount`
- quote truncation rule (set explicit max: 120 chars, append ellipsis)
- quote sanitization (collapse tabs/newlines into single spaces and trim)
- fallback model text for not-found and render-error states

Example test shape:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRoastOgModel,
  buildRoastOgNotFoundModel,
  buildRoastOgRenderErrorModel,
} from "./roast-og-view-model";

describe("buildRoastOgModel", () => {
  it("maps score/language/linesCount and truncates quote", () => {
    const model = buildRoastOgModel({
      score: 3.5,
      language: "typescript",
      linesCount: 7,
      roastQuote: "x".repeat(140),
    });

    assert.equal(model.verdictLabel, "room_for_improvement");
    assert.equal(model.language, "typescript");
    assert.equal(model.linesCount, 7);
    assert.equal(model.roastQuote.endsWith("..."), true);
  });
});
```

- [ ] **Step 2: Run tests to verify RED state**

Run: `npx tsx --test src/server/og/roast-og-view-model.test.ts`
Expected: FAIL (module not implemented).

- [ ] **Step 3: Implement minimal view-model module**

In `roast-og-view-model.ts` implement:
- `toVerdictLabel(score: number)` using same thresholds as roast page
- `truncateQuote(value: string | null, maxChars = 120)`
- `sanitizeQuote(value: string | null)` before truncation
- `buildRoastOgModel(...)`
- `buildRoastOgNotFoundModel()`
- `buildRoastOgRenderErrorModel()` with required message: `something went wrong generating this roast preview`

- [ ] **Step 4: Run tests to verify GREEN state**

Run: `npx tsx --test src/server/og/roast-og-view-model.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/og/roast-og-view-model.ts src/server/og/roast-og-view-model.test.ts
git commit -m "test: define roast OG view-model mapping contract"
```

---

### Task 2: Add Cache Policy Module with Locked Header Tests

**Files:**
- Create: `src/server/og/roast-og-cache.ts`
- Create: `src/server/og/roast-og-cache.test.ts`

- [ ] **Step 1: Write failing tests for cache policy constants**

Tests should enforce exact selected policy:
- `max-age=60`
- `s-maxage=300`
- `stale-while-revalidate=600`
- `public` directive included

- [ ] **Step 2: Run tests to verify RED state**

Run: `npx tsx --test src/server/og/roast-og-cache.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement cache helper module**

In `roast-og-cache.ts` implement:
- exported constants for numeric TTL values
- `buildRoastOgCacheControlHeader(): string`

- [ ] **Step 4: Run tests to verify GREEN state**

Run: `npx tsx --test src/server/og/roast-og-cache.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/og/roast-og-cache.ts src/server/og/roast-og-cache.test.ts
git commit -m "test: lock roast OG cache header policy"
```

---

### Task 3: Install Takumi and Configure Next External Package

**Files:**
- Modify: `package.json`
- Modify: `next.config.ts`

- [ ] **Step 1: Add failing build check for missing Takumi package (baseline)**

Run: `npm run build`
Expected: PASS baseline before package/config change (capture baseline state).

- [ ] **Step 2: Install Takumi image-response package**

Run: `npm install @takumi-rs/image-response`
Expected: `package.json` and lockfile updated.

- [ ] **Step 3: Update Next config for Takumi native core**

Modify `next.config.ts`:
- append `"@takumi-rs/core"` to `serverExternalPackages`

- [ ] **Step 4: Run build to verify compatibility**

Run: `npm run build`
Expected: PASS with no bundling error for Takumi core.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "chore: configure takumi package and next external core"
```

---

### Task 4: Implement Dynamic OG Image Route with Fallback Paths

**Files:**
- Create: `src/app/roast/[id]/opengraph-image.tsx`
- Create: `src/app/roast/[id]/opengraph-image.test.ts`
- Modify: `src/server/og/roast-og-view-model.ts` (only if minor export adjustments needed)
- Modify: `src/server/og/roast-og-cache.ts` (only if helper usage requires small additions)

- [ ] **Step 1: Write failing tests for any new pure helpers introduced by route work**

If route requires pure helpers (for example `isUuid` or render prop formatter), add test-first in existing OG test files before implementing.

Create route-level tests in `src/app/roast/[id]/opengraph-image.test.ts` for:
- valid roast id returns `content-type` containing `image/png`
- invalid UUID returns fallback PNG response
- missing roast returns fallback PNG response
- renderer failure path returns fallback PNG response

- [ ] **Step 2: Run focused tests to verify RED state**

Run: `npm run test -- src/server/og/roast-og-view-model.test.ts src/server/og/roast-og-cache.test.ts src/app/roast/[id]/opengraph-image.test.ts`
Expected: FAIL for unimplemented route behavior and/or new helper contracts.

- [ ] **Step 3: Implement `opengraph-image` route**

Implement route behavior:
- export dimensions (`size`) as `1200x630`
- set `runtime = "nodejs"` for Takumi native compatibility
- validate roast id format
- fetch roast via `caller.roast.byId`
- build dynamic model from roast data
- render with `ImageResponse` from `@takumi-rs/image-response`
- return short cache headers using shared cache helper
- catch renderer/runtime errors and return fallback image with explicit error message
- for missing roast/invalid id return fallback not-found image
- apply the same cache header for success and fallback image responses

Use visual structure from Pencil frame (`4J5QT`):
- dark background
- top brand marker
- large score
- verdict row
- `language / linesCount` row
- quote row

- [ ] **Step 4: Run OG module tests and a full test sweep**

Run:
- `npm run test -- src/server/og/roast-og-view-model.test.ts src/server/og/roast-og-cache.test.ts`
- `npm run test -- src/app/roast/[id]/opengraph-image.test.ts`
- `npm run test`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/roast/[id]/opengraph-image.tsx src/app/roast/[id]/opengraph-image.test.ts src/server/og/roast-og-view-model.ts src/server/og/roast-og-cache.ts src/server/og/roast-og-view-model.test.ts src/server/og/roast-og-cache.test.ts
git commit -m "feat: add dynamic roast OG image route with takumi and fallbacks"
```

---

### Task 5: Add Roast Page `generateMetadata` for OG/Twitter Images

**Files:**
- Create: `src/server/og/roast-og-metadata.ts`
- Create: `src/server/og/roast-og-metadata.test.ts`
- Modify: `src/app/roast/[id]/page.tsx`

- [ ] **Step 1: Write failing tests for metadata helper contract**

Create `src/server/og/roast-og-metadata.test.ts` to cover:
- valid roast produces roast-aware `title` and `description`
- fallback copy exactly matches spec for missing/invalid roast
- OG image URL generation uses provided base origin and roast id
- Twitter/OpenGraph image URL values are aligned

- [ ] **Step 2: Run focused tests to verify RED state**

Run: `npm run test -- src/server/og/roast-og-metadata.test.ts`
Expected: FAIL (metadata helper not implemented).

- [ ] **Step 3: Implement `generateMetadata` on roast page**

Add to `src/app/roast/[id]/page.tsx`:
- `import type { Metadata } from "next"`
- `export async function generateMetadata(...)`
- use helper from `src/server/og/roast-og-metadata.ts` to keep logic testable
- build absolute origin using same pattern as tRPC client server path:
  - `https://${process.env.VERCEL_URL}` when present
  - fallback `http://localhost:3000`
- set `title`, `description`, `openGraph.images`, and `twitter.images`
- use roast-aware `title` and `description` when roast exists
- when roast missing/invalid, use fixed fallback copy from spec:
  - `Roast not found - DevRoast`
  - `This roast link is invalid or no longer available.`

- [ ] **Step 4: Run tests and build checks**

Run:
- `npm run test -- src/server/og/roast-og-metadata.test.ts`
- `npm run test`
- `npm run build`

Expected: PASS and metadata route compile succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/server/og/roast-og-metadata.ts src/server/og/roast-og-metadata.test.ts src/app/roast/[id]/page.tsx
git commit -m "feat: add roast metadata with dynamic OG and twitter image URLs"
```

---

### Task 6: End-to-End Verification for OG Behavior

**Files:**
- Verify only (no required code changes)

- [ ] **Step 1: Run repository checks**

Run: `npm run check`
Expected: PASS (Biome lint/format).

- [ ] **Step 2: Run full test suite**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Manual OG image smoke checks (dev server)**

Run: `npm run dev`

Check:
- open existing roast image URL: `/roast/<valid-id>/opengraph-image`
  - expect PNG image with dynamic data
- open missing roast image URL: `/roast/<missing-id>/opengraph-image`
  - expect fallback PNG (not-found copy)
- simulate render failure path (temporary forced throw in local branch only)
  - expect fallback PNG with `something went wrong generating this roast preview`

- [ ] **Step 5: Optional commit only if verification produced code changes**

If no files changed during verification, skip commit.
If files changed, run:

```bash
git add src/app/roast/[id]/opengraph-image.tsx src/app/roast/[id]/opengraph-image.test.ts src/app/roast/[id]/page.tsx src/server/og/roast-og-view-model.ts src/server/og/roast-og-cache.ts src/server/og/roast-og-view-model.test.ts src/server/og/roast-og-cache.test.ts
git commit -m "chore: finalize roast OG image verification adjustments"
```

- [ ] **Step 6: Manual embed validation in social platforms**

Validate final roast link preview behavior in:
- Discord
- X
- WhatsApp
- LinkedIn

Expected: preview image appears, layout is readable, fallback message appears only on failure scenarios.

---

## Done Criteria

- `/roast/[id]` metadata includes roast-specific Open Graph and Twitter image URLs.
- `src/app/roast/[id]/opengraph-image.tsx` returns dynamic Takumi-generated PNG for valid roasts.
- Image shows `score`, `verdict`, `language`, `linesCount`, and truncated `roastQuote`.
- Invalid/missing roast ids return deterministic fallback image copy.
- Takumi render/runtime errors return branded fallback image with explicit error message.
- Cache header is exactly: `public, max-age=60, s-maxage=300, stale-while-revalidate=600`.
- `npm run check`, `npm run test`, and `npm run build` pass.
