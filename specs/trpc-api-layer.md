# Spec: tRPC API Layer

**Status:** Draft  
**Date:** 2026-03-15  
**Feature:** tRPC v11 as the API layer, integrated with Next.js App Router SSR and TanStack React Query

---

## Context

DevRoast currently has a Drizzle schema and static mock data on the pages. We need a typed API layer that:

1. Exposes server-side procedures backed by the Drizzle database
2. Supports **Server Components** — procedures can be called directly on the server (no HTTP round-trip)
3. Supports **Client Components** — mutations and reactive queries via TanStack React Query hooks

tRPC v11 with `@trpc/tanstack-react-query` is the chosen solution. It fits naturally into the App Router model: procedures are called via a server-side proxy in RSC, and via `useTRPC()` hooks in client components, both fully type-safe.

---

## Decision

**tRPC v11 + TanStack React Query integration** — the `@trpc/tanstack-react-query` package replaces the classic `@trpc/react-query`. It exposes `createTRPCContext` (for client providers) and `createTRPCOptionsProxy` (for server-side prefetch), which maps cleanly to the Next.js App Router RSC + Client Component split.

**No superjson.** The project has no `Date` or `BigInt` in its API surface — plain JSON serialization is sufficient.

**No separate API server.** tRPC is colocated with Next.js via the fetch adapter at `app/api/trpc/[trpc]/route.ts`. The server-side proxy (`trpc/server.ts`) calls the router directly without an HTTP round-trip.

---

## Technical Spec

### Architecture overview

```
trpc/
  init.ts          ← initTRPC, createTRPCContext, baseProcedure
  query-client.ts  ← makeQueryClient factory (shared server/client)
  server.ts        ← server-only: trpc proxy, getQueryClient, HydrateClient, prefetch
  client.tsx       ← "use client": TRPCProvider, useTRPC, TRPCReactProvider
  routers/
    _app.ts        ← root AppRouter (merges sub-routers)
    submissions.ts ← submit, getById
    leaderboard.ts ← list, stats

app/api/trpc/[trpc]/route.ts  ← fetch adapter (GET + POST)
```

### `trpc/init.ts`

```ts
import { initTRPC } from '@trpc/server';
import { cache } from 'react';
import { db } from '@/db';

export const createTRPCContext = cache(async () => {
  return { db };
});

const t = initTRPC.context<typeof createTRPCContext>().create();

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;
```

The context carries the Drizzle `db` instance. Using React's `cache()` ensures one context per request in SSR.

### `trpc/query-client.ts`

```ts
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30 * 1000 },
      dehydrate: {
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === 'pending',
      },
    },
  });
}
```

`shouldDehydrateQuery` is extended to include `pending` queries so that streaming prefetch works — a Server Component can fire a query without `await` and the client receives the result as it streams in.

### `trpc/server.ts`

```ts
import 'server-only';
import { createTRPCOptionsProxy } from '@trpc/tanstack-react-query';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { cache } from 'react';
import { makeQueryClient } from './query-client';
import { createTRPCContext } from './init';
import { appRouter } from './routers/_app';
import type { TRPCQueryOptions } from '@trpc/tanstack-react-query';

export const getQueryClient = cache(makeQueryClient);

export const trpc = createTRPCOptionsProxy({
  ctx: createTRPCContext,
  router: appRouter,
  queryClient: getQueryClient,
});

// Direct server caller (no HTTP, no query cache)
export const caller = appRouter.createCaller(createTRPCContext);

// Convenience wrappers for RSC usage
export function HydrateClient({ children }: { children: React.ReactNode }) {
  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      {children}
    </HydrationBoundary>
  );
}

export function prefetch<T extends ReturnType<TRPCQueryOptions<any>>>(
  queryOptions: T,
) {
  const qc = getQueryClient();
  if (queryOptions.queryKey[1]?.type === 'infinite') {
    void qc.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void qc.prefetchQuery(queryOptions);
  }
}
```

### `trpc/client.tsx`

```tsx
'use client';
import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import { useState } from 'react';
import { makeQueryClient } from './query-client';
import type { AppRouter } from './routers/_app';

export const { TRPCProvider, useTRPC } = createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient | undefined;

function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  if (!browserQueryClient) browserQueryClient = makeQueryClient();
  return browserQueryClient;
}

function getBaseUrl() {
  if (typeof window !== 'undefined') return '';
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
}

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [httpBatchLink({ url: `${getBaseUrl()}/api/trpc` })],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
```

### `app/api/trpc/[trpc]/route.ts`

```ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/trpc/init';
import { appRouter } from '@/trpc/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  });

export { handler as GET, handler as POST };
```

### Root layout

Mount `TRPCReactProvider` in `app/layout.tsx` wrapping `{children}`. It is a Client Component, but since it's only a provider it renders immediately without blocking SSR.

### Routers

#### `trpc/routers/submissions.ts`
```ts
// Procedures:
// submit    mutation  { code, language, linesCount, roastMode } → Submission (insert + AI call placeholder)
// getById   query     { id: uuid } → Submission & { analysisItems, diffSuggestions }
```

#### `trpc/routers/leaderboard.ts`
```ts
// Procedures:
// list   query  { limit?: number, offset?: number } → Submission[]  ordered by score ASC NULLS LAST
// stats  query  void → { totalCount: number, avgScore: number }
```

#### `trpc/routers/_app.ts`
```ts
export const appRouter = createTRPCRouter({
  submissions: submissionsRouter,
  leaderboard: leaderboardRouter,
});
export type AppRouter = typeof appRouter;
```

### Usage patterns

**Server Component — prefetch + stream to client:**
```tsx
// app/leaderboard/page.tsx (Server Component)
import { HydrateClient, prefetch, trpc } from '@/trpc/server';
import { LeaderboardClient } from './leaderboard-client';

export default function LeaderboardPage() {
  prefetch(trpc.leaderboard.list.queryOptions({ limit: 10 }));
  prefetch(trpc.leaderboard.stats.queryOptions());
  return (
    <HydrateClient>
      <LeaderboardClient />
    </HydrateClient>
  );
}
```

**Server Component — direct call (no cache):**
```tsx
import { caller } from '@/trpc/server';

export default async function RoastResultPage({ params }) {
  const result = await caller.submissions.getById({ id: params.id });
  // render directly — no client hydration needed
}
```

**Client Component:**
```tsx
'use client';
import { useMutation } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';

export function SubmitButton() {
  const trpc = useTRPC();
  const submit = useMutation(trpc.submissions.submit.mutationOptions());
  // ...
}
```

---

## File Structure

```
src/
  app/
    api/
      trpc/
        [trpc]/
          route.ts         ← fetch adapter
    layout.tsx             ← wrap children in TRPCReactProvider
  trpc/
    init.ts                ← initTRPC, context, baseProcedure
    query-client.ts        ← makeQueryClient
    server.ts              ← server-only: trpc proxy, caller, HydrateClient, prefetch
    client.tsx             ← "use client": TRPCReactProvider, useTRPC
    routers/
      _app.ts              ← AppRouter + AppRouter type
      submissions.ts       ← submit, getById
      leaderboard.ts       ← list, stats
```

---

## Dependencies

| Package | Role |
|---|---|
| `@trpc/server` | Router, procedures, fetch adapter |
| `@trpc/client` | HTTP batch link |
| `@trpc/tanstack-react-query` | `createTRPCContext`, `createTRPCOptionsProxy`, hooks |
| `@tanstack/react-query` | QueryClient, hooks |
| `zod` | Input validation on procedures |
| `server-only` | Prevents `trpc/server.ts` from being imported by client bundles |
| `client-only` | (optional) guard for `trpc/client.tsx` if needed |

`zod` is already a transitive dependency via Drizzle — verify it is available directly before skipping the install.

---

## Implementation To-Dos

### Infrastructure
- [ ] Install: `@trpc/server @trpc/client @trpc/tanstack-react-query @tanstack/react-query zod server-only`
- [ ] Create `src/trpc/init.ts`
- [ ] Create `src/trpc/query-client.ts`
- [ ] Create `src/trpc/server.ts`
- [ ] Create `src/trpc/client.tsx`
- [ ] Create `src/app/api/trpc/[trpc]/route.ts`
- [ ] Wrap `app/layout.tsx` children in `<TRPCReactProvider>`

### Routers
- [ ] Create `src/trpc/routers/_app.ts`
- [ ] Create `src/trpc/routers/leaderboard.ts` — `list` + `stats` queries backed by Drizzle
- [ ] Create `src/trpc/routers/submissions.ts` — `submit` mutation + `getById` query backed by Drizzle

### Page Wiring
- [ ] Replace static mock data in `app/leaderboard/page.tsx` with `prefetch` + `HydrateClient`
- [ ] Replace static mock data in `app/roast/[id]/page.tsx` with `caller.submissions.getById`
- [ ] Wire `$ roast_my_code` button on `app/page.tsx` to `submissions.submit` mutation

### Quality
- [ ] `npm run check && npm run build` pass with no errors
