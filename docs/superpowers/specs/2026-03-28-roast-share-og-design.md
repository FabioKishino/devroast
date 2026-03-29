# Roast Share OG Image Design

Date: 2026-03-28
Status: Approved for planning
Owner: AI + user

## Goal

Add automatic Open Graph image generation for shareable roast result links so social embeds show a visual card with roast-specific data.

## Scope

In scope:
- Dynamic OG image for `roast/[id]` links
- Runtime generation with Takumi
- Short-lived caching strategy
- Resilient fallback image when generation fails
- Metadata wiring for Open Graph and Twitter cards

Out of scope:
- Persisting generated images in external storage
- Rendering raw submitted code in OG image
- Broader redesign of roast page UI

## User-Confirmed Decisions

1. Generation strategy: on-demand
2. Image content: dynamic per roast
3. Persistence strategy: no file persistence (render response directly)
4. Cache policy: short cache window
5. Failure behavior: fallback image that explicitly says something went wrong
6. Displayed fields: `score`, `verdict`, `language`, `linesCount`, `roastQuote` (truncated), no raw code
7. Visual baseline: Pencil `Screen 4 - OG Image` (`4J5QT`)

## Current Project Context

- Route exists at `src/app/roast/[id]/page.tsx`
- Global metadata currently static in `src/app/layout.tsx`
- Route-level metadata pattern already exists in `src/app/leaderboard/page.tsx`
- Roast detail page already derives verdict from score and fetches roast by id

## Proposed Architecture

### 1) Route metadata on roast detail page

Add `generateMetadata` to `src/app/roast/[id]/page.tsx` to generate per-roast share metadata.

Metadata responsibilities:
- Build absolute OG image URL for this roast id
- Set Open Graph fields and Twitter card image
- Use roast-aware title/description where possible
- Fall back to safe defaults if roast is missing/invalid

### 2) Dynamic image route

Create `src/app/roast/[id]/opengraph-image.tsx` to render a PNG for social crawlers.

Image route responsibilities:
- Validate `id`
- Fetch roast data by id
- Transform roast data into a display model:
  - `score`
  - `verdict`
  - `language`
  - `roastQuote` with truncation/sanitization
- Render a 1200x630 image aligned to the Pencil design (`4J5QT`)
- Return short-cache headers

### 3) Takumi integration boundary

Use Takumi as the renderer for the OG image output. Keep data mapping and rendering concerns separated:
- Data mapping layer: converts roast entity to OG view model
- Rendering layer: receives view model and returns image bytes

This keeps future fallback/migration paths open if renderer behavior changes.

## Visual Spec (from selected Pencil frame)

Reference frame screenshot: `Screen 4 - OG Image` (`4J5QT`)

Key visual structure:
- Dark background and centered composition
- Small top brand marker (`> devroast` style)
- Large score line (`3.5/10` pattern)
- Verdict line below score (severity color cue)
- Language and line-count metadata line
- Roast quote line at bottom, italicized/secondary tone

Content rules:
- Quote is truncated to avoid overflow
- No raw code block
- Keep text density low to preserve readability in embed previews
- Metadata line must include both `language` and `linesCount`

## Data Flow

1. Social crawler requests roast page URL
2. `generateMetadata` resolves roast-aware metadata and image URL
3. Crawler requests `opengraph-image` URL
4. Image route fetches roast data and attempts Takumi render
5. On success: return PNG with short cache headers
6. On render error: return fallback PNG with explicit error message

## Error Handling

### Roast missing / invalid id
- Metadata degrades gracefully (generic title/description)
- Image route returns fallback image labeled "roast not found"

### Takumi failure / timeout
- Return fallback DevRoast-branded image
- Include explicit text: "something went wrong generating this roast preview"
- Do not return blank image or raw 500 for social crawlers

## Caching Strategy

Use short-lived cache (option B selected by user).

Target behavior (fixed values):
- `Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600`
- This keeps browser cache very short while allowing CDN reuse for 5 minutes
- Stale-while-revalidate reduces request spikes on popular links

Metadata fallback copy (fixed):
- `title`: `Roast not found - DevRoast`
- `description`: `This roast link is invalid or no longer available.`

## Test Strategy

### Unit
- Roast -> OG view model mapping
- Verdict derivation alignment with roast page logic
- Quote truncation/sanitization behavior

### Route-level
- OG route returns `image/png`
- OG route returns fallback image on renderer failure path
- Invalid/missing roast id path is handled deterministically

### Manual verification
- Validate embeds across common consumers (Discord, X, WhatsApp, LinkedIn)
- Verify readability at small preview sizes

## Alternatives Considered

1. API endpoint for image + metadata indirection
   - Clear separation, but unnecessary extra wiring now
2. Dedicated OG service module from day one
   - Better long-term abstraction, but more setup for initial scope

Chosen approach: Next route metadata + route-local OG image generation with Takumi, because it is the smallest reliable change set that fits current app patterns.

## Risks and Mitigations

1. Runtime compatibility with Takumi
   - Mitigation: lock route runtime to known-compatible target and keep fallback path always available
2. Social crawler variance
   - Mitigation: stick to 1200x630 and verify in multiple platforms
3. Quote overflow in translated/unusual text
   - Mitigation: conservative truncation and layout-safe typography choices

## Acceptance Criteria

1. Sharing `roast/[id]` shows a dynamic OG card with roast-specific data
2. Card visual follows Pencil frame `4J5QT`
3. Short cache policy is applied to generated image responses
4. Takumi failures still return a valid branded fallback image with explicit error text
5. No raw submitted code is included in the OG image

## Next Step

After this spec is reviewed and approved, move to implementation planning using the `writing-plans` skill.
