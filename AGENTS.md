# DevRoast — Agent Guidelines

## Project

**DevRoast** — paste code, get brutally honest AI feedback. Next.js 16 app with a shame leaderboard for the worst code on the internet.

- **Stack**: Next.js 16.1.6 · React 19 · TypeScript · Tailwind v4 · Biome 2.4.6
- **Router**: App Router, `src/` directory
- **Data layer**: tRPC · Drizzle ORM · Postgres (Docker)
- **Key libs**: `@base-ui/react` (interactive primitives) · `shiki` (syntax highlighting) · `tailwind-variants` · `tailwind-merge` · `@number-flow/react` (animated numbers)

## Structure

```
src/
  app/                   # Pages and layouts (App Router)
    _components/         # Page-specific components (see src/app/_components/AGENTS.md)
    globals.css          # @theme tokens (colors + fonts)
  components/ui/         # All UI primitives and compound components
    AGENTS.md            # Component-level authoring rules (Rules 1–12)
  trpc/                  # tRPC infrastructure
    AGENTS.md            # tRPC patterns and server/client boundaries
  db/                    # Drizzle ORM client and schema
    AGENTS.md            # Database patterns and conventions
```

## Global Rules

**Fonts** — `font-mono` (JetBrains Mono) for all UI; `font-secondary` (IBM Plex Mono) for descriptions/body. Never `font-sans` inside `ui/`.

**Colors** — always use tokens from `@theme` in `globals.css` (e.g. `text-text-primary`, `bg-bg-page`, `text-accent-green`). Never hardcode hex or use Tailwind palette classes.

**Classes** — use `twMerge` outside `tv()` context. Never string interpolation or `.join(" ")`.

**Sizes** — prefer native Tailwind classes (`text-sm`, `h-14`, `px-10`). No arbitrary values like `text-[13px]` or `h-[56px]`.

**Components** — see `src/components/ui/AGENTS.md` for the full 12-rule authoring guide (named exports, `tv()` variants, composition pattern, `@base-ui/react`, async Server Components, etc.).

## Commands

```bash
npm run dev      # dev server
npm run check    # Biome lint + format (auto-fix)
npm run build    # production build — must pass before committing
```

Always run `npm run check && npm run build` after changes.
