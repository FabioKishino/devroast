import { Suspense } from "react";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { StatsNumbers } from "./stats-numbers";
import { StatsSkeleton } from "./stats-skeleton";

export function HomepageStats() {
  prefetch(trpc.leaderboard.stats.queryOptions());
  return (
    <HydrateClient>
      <Suspense fallback={<StatsSkeleton />}>
        <StatsNumbers />
      </Suspense>
    </HydrateClient>
  );
}
