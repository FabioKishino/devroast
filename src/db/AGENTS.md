# Database Guidelines — `src/db`

This directory contains the Drizzle ORM client, schema definitions, and seed scripts.

---

## Structure

```
src/db/
  index.ts      # Drizzle client (exports db)
  schema.ts     # Table schemas, enums, and types
  seed.ts       # Seed script for development data
```

---

## 1. Drizzle client configuration

The Drizzle client is configured in `src/db/index.ts` with **snake_case** column naming:

```tsx
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL);

export const db = drizzle(client, { casing: "snake_case" });
```

**Key points:**
- `casing: "snake_case"` — Drizzle automatically maps `camelCase` schema fields to `snake_case` column names in Postgres
- Example: `linesCount` in TypeScript → `lines_count` in SQL
- Always use `camelCase` in schema definitions; Drizzle handles the mapping

---

## 2. Schema naming conventions

**Tables:** `snake_case` (e.g. `submissions`, `analysis_items`, `diff_suggestions`)

**Columns in schema:** `camelCase` (e.g. `linesCount`, `roastMode`, `createdAt`) — Drizzle maps these to `snake_case` automatically

**Enums:** `camelCase` for the enum variable, `snake_case` for the Postgres enum name:

```tsx
export const severityEnum = pgEnum("severity", ["critical", "warning", "good"]);
export const diffLineTypeEnum = pgEnum("diff_line_type", ["added", "removed", "context"]);
```

---

## 3. Import aggregate functions from `drizzle-orm`

Always import aggregate functions (`avg`, `count`, `sum`, `max`, `min`, etc.) from `drizzle-orm` directly:

```tsx
// correct
import { avg, count } from "drizzle-orm";

// wrong
import { avg, count } from "drizzle-orm/expressions"; // does not exist
```

---

## 4. Exporting tables and types

Export both the table schema and inferred TypeScript types:

```tsx
// src/db/schema.ts
export const submissions = pgTable("submissions", {
  id: uuid().defaultRandom().primaryKey(),
  code: text().notNull(),
  // ...
});

// Export inferred types for use in app code
export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
```

---

## 5. Using the `db` client

Import the `db` client from `src/db/index.ts` in tRPC procedures or Server Components:

```tsx
import { db } from "@/db";
import { submissions } from "@/db/schema";
import { count, avg } from "drizzle-orm";

// Query example
const result = await db
  .select({
    totalCount: count(),
    avgScore: avg(submissions.score),
  })
  .from(submissions);
```

---

## 6. Environment variables

The `DATABASE_URL` environment variable must be set in `.env.local`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/devroast
```

The `db` client will throw an error if this variable is missing.

---

## 7. Running migrations

Drizzle migrations are managed via the `drizzle-kit` CLI:

```bash
# Generate migration
npx drizzle-kit generate

# Push to database (development)
npx drizzle-kit push

# Run migrations (production)
npx drizzle-kit migrate
```

---

## Reference

- Drizzle ORM docs: https://orm.drizzle.team/docs/overview
- Drizzle casing docs: https://orm.drizzle.team/docs/casing
- Postgres.js docs: https://github.com/porsager/postgres
