# tRPC Guidelines — `src/trpc`

This directory contains all tRPC infrastructure: routers, context, query client, and server/client providers.

---

## Architecture

```
src/trpc/
  init.ts              # initTRPC, createTRPCContext, baseProcedure
  query-client.ts      # makeQueryClient (staleTime: 30s, pending dehydration)
  server.tsx           # "server-only" — trpc proxy, caller, HydrateClient, prefetch, getQueryClient
  client.tsx           # "use client" — TRPCReactProvider, useTRPC
  routers/
    _app.ts            # appRouter merging all sub-routers, exports AppRouter type
    leaderboard.ts     # leaderboard queries (stats, list, etc.)
```

---

## 1. Use `server-only` in `server.tsx`

The `server.tsx` file must import `"server-only"` at the top to prevent accidental bundling into the client.

```tsx
// src/trpc/server.tsx
import "server-only";
```

This file exports:
- `trpc` — the tRPC options proxy for Server Components (`trpc.leaderboard.stats.queryOptions()`)
- `caller` — direct procedure caller for use in Server Actions or API routes
- `HydrateClient` — wraps `HydrationBoundary` to dehydrate the query client state
- `prefetch` — prefetches a query in Server Components before render
- `getQueryClient` — cached query client factory

---

## 2. Use `"use client"` in `client.tsx`

The `client.tsx` file must have `"use client"` directive and exports:
- `TRPCReactProvider` — wraps children with `QueryClientProvider` and tRPC React context
- `useTRPC` — hook that returns the tRPC client proxy for use in Client Components

---

## 3. Server Component data fetching pattern

For Server Components that prefetch data:

```tsx
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { MyClientComponent } from "./my-client-component";

export function MyServerWrapper() {
  prefetch(trpc.leaderboard.stats.queryOptions());
  return (
    <HydrateClient>
      <MyClientComponent />
    </HydrateClient>
  );
}
```

- Call `prefetch()` to populate the server-side query cache
- Wrap client components in `<HydrateClient>` to hydrate the dehydrated state on the client
- Do **not** use `Suspense` unless you specifically need a loading boundary — prefer starting with default values (e.g. `0`) and letting the client component animate to the real value when data arrives

---

## 4. Client Component data consumption pattern

For Client Components that consume prefetched data:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function MyClientComponent() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

  return <div>{data?.totalCount ?? 0}</div>;
}
```

- Use `useQuery` (not `useSuspenseQuery`) to allow graceful loading states
- Use nullish coalescing (`data?.field ?? defaultValue`) for initial values
- This pattern allows animated transitions (e.g. NumberFlow animating from 0 to the real value)

---

## 5. Server/client boundary rules

**Problem:** `page.tsx` with `"use client"` cannot import Server Components or `"server-only"` modules.

**Solution:** Extract client logic into a separate Client Component and keep `page.tsx` as a Server Component that composes both server and client parts.

### Example: Homepage stats

**Before (broken):**
```tsx
// src/app/page.tsx
"use client";
import { HomepageStats } from "./_components/homepage-stats"; // ERROR: imports server-only code
```

**After (fixed):**
```tsx
// src/app/page.tsx (Server Component, no directive)
import { HomepageStats } from "./_components/homepage-stats";
import { HomePageClient } from "./_components/home-page-client";

export default function HomePage() {
  return <HomePageClient stats={<HomepageStats />} />;
}

// src/app/_components/home-page-client.tsx
"use client";
export function HomePageClient({ stats }: { stats: ReactNode }) {
  const [code, setCode] = useState("");
  return (
    <main>
      {/* client interactive UI */}
      {stats} {/* server-prefetched stats rendered here */}
    </main>
  );
}
```

This pattern:
- Keeps the Server Component boundary clean
- Allows prefetching in `HomepageStats` (Server Component)
- Passes the rendered result as a prop (React slot pattern) into the Client Component

---

## 6. Router structure

Each feature domain gets its own router file in `src/trpc/routers/`:

```tsx
// src/trpc/routers/leaderboard.ts
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    // query logic here
  }),
});
```

All sub-routers are merged in `_app.ts`:

```tsx
// src/trpc/routers/_app.ts
import { createTRPCRouter } from "../init";
import { leaderboardRouter } from "./leaderboard";

export const appRouter = createTRPCRouter({
  leaderboard: leaderboardRouter,
});

export type AppRouter = typeof appRouter;
```

---

## 7. Drizzle ORM imports

Always import aggregate functions from `drizzle-orm` directly:

```tsx
// correct
import { avg, count } from "drizzle-orm";

// wrong
import { avg, count } from "drizzle-orm/expressions"; // does not exist
```

---

## 8. Next.js config for server-only packages

Add Node.js-only packages to `serverExternalPackages` in `next.config.ts`:

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres"],
};
```

This prevents Next.js from attempting to bundle server-only modules (like `postgres`, `fs`, `net`) into the client bundle.

---

## 9. Type safety

- Export the `AppRouter` type from `routers/_app.ts`
- Use it to type the tRPC client in `client.tsx`
- All procedure inputs/outputs are automatically inferred

---

## 10. Error handling

tRPC errors are thrown as `TRPCClientErrorLike` and can be caught in Client Components:

```tsx
const { data, error, isLoading } = useQuery(trpc.leaderboard.stats.queryOptions());

if (error) {
  return <div>Error: {error.message}</div>;
}
```

---

## 11. Avoid `prefetch()` type issues

The `prefetch()` function uses `any` for the query options parameter to avoid complex tRPC generic type mismatches:

```tsx
// src/trpc/server.tsx
// biome-ignore lint/suspicious/noExplicitAny: tRPC query options are structurally correct at runtime
export function prefetch(queryOptions: any) {
  const qc = getQueryClient();
  if (queryOptions?.queryKey?.[1]?.type === "infinite") {
    void qc.prefetchInfiniteQuery(queryOptions);
  } else {
    void qc.prefetchQuery(queryOptions);
  }
}
```

This is acceptable because the runtime behavior is correct and the types are structurally sound — the generic constraint just doesn't align with tRPC v11's type system.

---

## Reference

- tRPC docs: https://trpc.io/docs/server/procedures
- TanStack Query docs: https://tanstack.com/query/latest/docs/framework/react/overview
- Next.js Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components
