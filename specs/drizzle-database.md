# Drizzle ORM — Database Specification

> DevRoast database layer: Postgres via Docker Compose + Drizzle ORM

---

## Context

DevRoast needs persistent storage for two core flows:

1. **Roast submission** — user pastes code, optionally enables roast mode, hits `$ roast_my_code`
2. **Shame Leaderboard** — public ranking of worst submissions sorted by shame score (ascending)

The data model is derived from the three designed screens:

- **Screen 1 (Code Input):** `code`, `language`, `roast_mode` toggle, aggregate stats (`2,847 codes roasted`, `avg score: 4.2/10`)
- **Screen 2 (Roast Results):** `score` (0–10 float), roast headline, `lang`, `lines` count, analysis cards (severity × title × description), and a diff suggestion block (removed/added lines with context)
- **Screen 3 (Shame Leaderboard):** ranked entries with `rank`, `score`, `language`, `lines`, and a code preview block

---

## Enums

```ts
// src/db/schema.ts

export const severityEnum = pgEnum("severity", [
  "critical",
  "warning",
  "good",
]);

export const diffLineTypeEnum = pgEnum("diff_line_type", [
  "added",
  "removed",
  "context",
]);
```

| Enum | Values | Source |
|---|---|---|
| `severity` | `critical` · `warning` · `good` | Analysis card badge variants (Screen 2) |
| `diff_line_type` | `added` · `removed` · `context` | Diff block line prefix `+` / `-` / ` ` (Screen 2) |

---

## Tables

### `submissions`

Core record created when a user submits code for roasting.

```ts
export const submissions = pgTable("submissions", {
  id:          uuid("id").defaultRandom().primaryKey(),
  code:        text("code").notNull(),
  language:    varchar("language", { length: 64 }).notNull().default("plaintext"),
  lines_count: integer("lines_count").notNull(),
  roast_mode:  boolean("roast_mode").notNull().default(false),
  score:       numeric("score", { precision: 4, scale: 2 }),  // null until AI responds
  roast_quote: text("roast_quote"),                           // the brutal one-liner headline
  created_at:  timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Random UUID, primary key |
| `code` | `text` | Raw code pasted by the user |
| `language` | `varchar(64)` | Detected or passed language (e.g. `"javascript"`, `"typescript"`) |
| `lines_count` | `integer` | Total line count shown on leaderboard meta row |
| `roast_mode` | `boolean` | Whether max-sarcasm mode was enabled at submission time |
| `score` | `numeric(4,2)` | AI-assigned shame score 0.00–10.00; `null` while analysis is pending |
| `roast_quote` | `text` | The punchy one-liner shown on Screen 2 (e.g. `"this code looks like it was written during a power outage..."`) |
| `created_at` | `timestamptz` | Submission timestamp |

---

### `analysis_items`

One row per issue card shown in the "detailed_analysis" section (Screen 2). A submission has multiple items.

```ts
export const analysisItems = pgTable("analysis_items", {
  id:            uuid("id").defaultRandom().primaryKey(),
  submission_id: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  severity:      severityEnum("severity").notNull(),
  title:         varchar("title", { length: 255 }).notNull(),
  description:   text("description").notNull(),
  sort_order:    integer("sort_order").notNull().default(0),
});
```

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `submission_id` | `uuid` FK → `submissions.id` | Cascades on delete |
| `severity` | `severity` enum | Maps to badge variant: `critical` / `warning` / `good` |
| `title` | `varchar(255)` | Short issue title (e.g. `"using var instead of const/let"`) |
| `description` | `text` | Longer explanation shown under the title |
| `sort_order` | `integer` | Display order within the analysis grid |

---

### `diff_suggestions`

Lines that make up the "suggested_fix" diff block on Screen 2. Each submission has one diff block; each row is one line.

```ts
export const diffSuggestions = pgTable("diff_suggestions", {
  id:            uuid("id").defaultRandom().primaryKey(),
  submission_id: uuid("submission_id")
    .notNull()
    .references(() => submissions.id, { onDelete: "cascade" }),
  line_type:     diffLineTypeEnum("line_type").notNull(),
  content:       text("content").notNull(),
  line_number:   integer("line_number").notNull(),
});
```

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | |
| `submission_id` | `uuid` FK → `submissions.id` | Cascades on delete |
| `line_type` | `diff_line_type` enum | `added` (+) / `removed` (-) / `context` (space) |
| `content` | `text` | Raw line content (without the prefix character) |
| `line_number` | `integer` | Ordered position in the diff block |

---

## Relations

```
submissions (1) ──< analysis_items (N)
submissions (1) ──< diff_suggestions (N)
```

---

## Indexes

```ts
// Fast leaderboard query: lowest score first, then most recent
export const submissionsScoreIdx = index("submissions_score_idx")
  .on(submissions.score.asc().nullsLast(), submissions.created_at.desc());

// Fast lookup of all items for a given submission
export const analysisItemsSubmissionIdx = index("analysis_items_submission_idx")
  .on(analysisItems.submission_id);

// Fast lookup of all diff lines for a given submission, ordered
export const diffSuggestionsSubmissionIdx = index("diff_suggestions_submission_idx")
  .on(diffSuggestions.submission_id, diffSuggestions.line_number);
```

---

## File Structure

```
devroast/
├── docker-compose.yml          # Postgres service
├── drizzle.config.ts           # Drizzle Kit config
├── .env.local                  # DATABASE_URL (git-ignored)
├── .env.example                # Template for DATABASE_URL
└── src/
    └── db/
        ├── index.ts            # Drizzle client singleton (postgres-js)
        └── schema.ts           # All tables, enums, and indexes
```

---

## Docker Compose

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: devroast
      POSTGRES_PASSWORD: devroast
      POSTGRES_DB: devroast
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

```bash
# .env.example
DATABASE_URL=postgresql://devroast:devroast@localhost:5432/devroast
```

---

## drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## src/db/index.ts

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

> Use `postgres-js` as the driver (lighter than `pg`, works well with Next.js edge/serverless).

---

## Implementation To-Dos

### Infrastructure

- [ ] Create `docker-compose.yml` with Postgres 16 Alpine service
- [ ] Create `.env.example` with `DATABASE_URL` template
- [ ] Add `.env.local` to `.gitignore` (if not already present)
- [ ] Add `docker-compose.yml` start/stop instructions to README

### Dependencies

- [ ] Install runtime deps: `drizzle-orm` + `postgres` (postgres-js driver)
- [ ] Install dev deps: `drizzle-kit`
- [ ] Add `db:generate`, `db:migrate`, `db:push`, `db:studio` scripts to `package.json`

```json
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate",
"db:push":     "drizzle-kit push",
"db:studio":   "drizzle-kit studio"
```

### Schema

- [ ] Create `src/db/schema.ts` with enums, tables, and indexes as defined above
- [ ] Create `src/db/index.ts` with the Drizzle client singleton
- [ ] Create `drizzle.config.ts` at the project root
- [ ] Run `npm run db:generate` to create the initial migration files
- [ ] Run `npm run db:migrate` (with Docker Compose running) to apply migrations

### API Routes

- [ ] `POST /api/roast` — accepts `{ code, language, roastMode }`, inserts a `submissions` row, calls AI, saves `analysis_items` and `diff_suggestions`, returns full result
- [ ] `GET /api/leaderboard` — queries `submissions` ordered by `score ASC NULLS LAST`, returns paginated list for Screen 3
- [ ] `GET /api/leaderboard/stats` — returns `{ totalCount, avgScore }` for the footer stats (`2,847 codes roasted · avg score: 4.2/10`)
- [ ] `GET /api/submissions/[id]` — returns a single submission with all related `analysis_items` and `diff_suggestions` for Screen 2

### Types

- [ ] Create `src/types/db.ts` (or co-locate in `src/db/schema.ts`) with inferred Drizzle types:
  ```ts
  export type Submission = typeof submissions.$inferSelect;
  export type NewSubmission = typeof submissions.$inferInsert;
  export type AnalysisItem = typeof analysisItems.$inferSelect;
  export type DiffSuggestion = typeof diffSuggestions.$inferSelect;
  ```

### Validation

- [ ] Add `zod` (or `valibot`) for request body validation on `POST /api/roast`
- [ ] Validate: `code` non-empty, `language` string ≤ 64 chars, `roastMode` boolean

### Page Wiring

- [ ] Replace mock data in `src/app/page.tsx` (`LeaderboardRow[]`) with a real `GET /api/leaderboard` fetch
- [ ] Wire `$ roast_my_code` button on Screen 1 to `POST /api/roast`
- [ ] Populate Screen 2 (Roast Results) from the API response
- [ ] Populate Screen 3 (Shame Leaderboard) from `GET /api/leaderboard`

---

## Notes

- `score` is nullable on `submissions` to support an async AI-analysis flow (submit → pending → score populated). The leaderboard query uses `NULLS LAST` so pending entries don't pollute the top.
- `lines_count` is stored denormalized on `submissions` rather than computed from `code` at query time to keep leaderboard queries fast.
- The diff block stores each line individually to preserve ordering and allow the `DiffLine` component variants (`added`/`removed`/`context`) to be driven directly from the enum.
- No auth is required per the README ("no account needed"), so there is no `users` table in scope.
