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
