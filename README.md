# DevRoast

> Paste your code. Get roasted.

DevRoast is a web app that gives brutally honest AI feedback on code snippets. You can run in full sarcasm mode or technical mode, get a scored review, inspect line-by-line suggestions, and share result pages.

Built during **NLW Operator**, a hands-on event by [Rocketseat](https://rocketseat.com.br) focused on building real products with AI-powered development workflows.

---

## Features

### Roast creation and analysis

- **In-browser code editor** with language selection and character limits.
- **Roast mode toggle** to switch between sarcastic and technical review tone.
- **Gemini-powered analysis** (`gemini-2.5-flash`) with structured JSON output.
- **Persistent roast result pages** at `/roast/[id]` backed by Postgres.
- **Scored verdict system** (`needs_serious_help`, `room_for_improvement`, `solid_work`, `clean_code_machine`).
- **Detailed findings** with severity levels (`critical`, `warning`, `good`).
- **Suggested fix diff** rendered as added/removed/context lines.
- **Syntax-highlighted code rendering** for submission and leaderboard previews.

### Sharing and metadata

- **Shareable roast links** for every persisted roast.
- **Dynamic Open Graph image generation** at `/roast/[id]/opengraph-image`.
- **Takumi-based OG renderer** (`@takumi-rs/image-response`) with 1200x630 output.
- **Short-cache OG strategy** (`public, max-age=60, s-maxage=300, stale-while-revalidate=600`).
- **Resilient OG fallbacks** for invalid IDs, missing roasts, and renderer/runtime failures.
- **Roast-aware metadata** (`generateMetadata`) with Open Graph + Twitter image alignment.

### Leaderboard and homepage

- **Shame leaderboard page** at `/leaderboard` with top roasted submissions.
- **Leaderboard stats** (total submissions and average score).
- **Homepage prefetch + hydration flow** using tRPC + React Query.
- **Animated stats counters** via `@number-flow/react`.

### Architecture and DX

- **Next.js App Router** with server/client composition patterns.
- **tRPC API layer** for typed server reads (`roast.byId`, leaderboard queries).
- **Drizzle ORM + Postgres** for transactional persistence.
- **Server Actions** for roast submission flow.
- **Type-safe validation** using Zod.
- **Biome checks** for lint/format consistency.
- **Automated test suite** using Node test runner (`tsx --test`).

---

## How it works

1. Paste code into the editor.
2. Choose language and roast mode.
3. Submit with `$ roast_my_code`.
4. DevRoast generates a score, roast quote, analysis cards, and diff suggestions.
5. View the persisted result page and share its link.
6. Compare with others on the shame leaderboard.

---

## Tech stack

- Next.js 16 (App Router), React 19, TypeScript
- tRPC, React Query
- Drizzle ORM, Postgres
- Tailwind CSS v4, Base UI
- Shiki + highlight.js
- Takumi OG image response
- Biome

---

## Running locally

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create a `.env` file with at least:

```bash
DATABASE_URL=postgresql://...
GEMINI_API_KEY=...
```

Optional (recommended for canonical metadata URLs):

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3) Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Quality commands

```bash
npm run check
npm run test
npm run build
```

---

## About

DevRoast was created during **NLW Operator** by Rocketseat, where developers build production-ready apps with modern tooling and AI-assisted workflows.
