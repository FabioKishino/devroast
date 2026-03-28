# App-level Components — `src/app/_components`

This directory contains page-specific components that are too coupled to a specific page to live in `src/components/ui`.

---

## When to use `_components`

- **Server Components** that prefetch data for a specific page (e.g. `HomepageStats`)
- **Client Components** that contain page-specific interactive logic (e.g. `HomePageClient`)
- Components that are tightly coupled to a single route and unlikely to be reused elsewhere

**Do not** use this directory for:
- Reusable UI primitives (those belong in `src/components/ui`)
- Shared layout components (those belong in `src/app/layout.tsx` or a shared layout file)

---

## Server/Client Component boundary pattern

When a page needs both server-side data fetching and client-side interactivity:

1. **Keep `page.tsx` as a Server Component** (no `"use client"` directive)
2. **Extract interactive logic** into a separate Client Component (e.g. `HomePageClient`)
3. **Extract data fetching** into a separate Server Component (e.g. `HomepageStats`)
4. **Compose them in `page.tsx`** using the React slot pattern

### Example: Homepage with stats

```tsx
// src/app/page.tsx (Server Component)
import { HomepageStats } from "./_components/homepage-stats";
import { HomePageClient } from "./_components/home-page-client";

export default function HomePage() {
  return <HomePageClient stats={<HomepageStats />} />;
}
```

```tsx
// src/app/_components/home-page-client.tsx
"use client";

import type { ReactNode } from "react";

type HomePageClientProps = {
  stats: ReactNode;
};

export function HomePageClient({ stats }: HomePageClientProps) {
  const [code, setCode] = useState("");
  // ... client interactive logic

  return (
    <main>
      {/* interactive UI */}
      {stats} {/* server-prefetched stats rendered here */}
    </main>
  );
}
```

```tsx
// src/app/_components/homepage-stats.tsx (Server Component)
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { StatsNumbers } from "./stats-numbers";

export function HomepageStats() {
  prefetch(trpc.leaderboard.stats.queryOptions());
  return (
    <HydrateClient>
      <StatsNumbers />
    </HydrateClient>
  );
}
```

This pattern:
- Keeps the server/client boundary clean
- Allows prefetching in the Server Component
- Passes the rendered result as a slot into the Client Component
- Avoids importing `"server-only"` code into `"use client"` files

---

## Animated data loading pattern (no Suspense)

When you want data to animate from a default value (e.g. `0`) to the real value without a skeleton loader:

1. **Do not** use `Suspense` or skeleton components
2. **Use `useQuery`** (not `useSuspenseQuery`) in the Client Component
3. **Provide default values** using nullish coalescing (`data?.field ?? defaultValue`)
4. **Use animation libraries** like `@number-flow/react` to animate the transition

### Example: Stats with NumberFlow animation

```tsx
// src/app/_components/stats-numbers.tsx
"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsNumbers() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

  return (
    <div className="flex items-center justify-center gap-6">
      <span className="font-secondary text-xs text-text-tertiary">
        <NumberFlow value={data?.totalCount ?? 0} />
        {" codes roasted"}
      </span>
    </div>
  );
}
```

This pattern:
- Renders immediately with `0` as the initial value
- Animates to the real value when the query resolves (prefetched data is instantly available after hydration)
- No flicker or layout shift from skeleton → content
- Better UX for metrics/counters

---

## Reference implementations

| Component | Pattern demonstrated |
|---|---|
| `homepage-stats.tsx` | Server Component prefetch + HydrateClient |
| `stats-numbers.tsx` | Client Component with useQuery + NumberFlow animation |
| `home-page-client.tsx` | Client Component accepting server-rendered slot |
