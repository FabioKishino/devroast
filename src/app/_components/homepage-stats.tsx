import { cacheLife } from "next/cache";
import { caller } from "@/trpc/server";
import { StatsNumbers } from "./stats-numbers";

export async function HomepageStats() {
  "use cache";
  cacheLife("hours");

  const stats = await caller.leaderboard.stats();

  return (
    <StatsNumbers totalCount={stats.totalCount} avgScore={stats.avgScore} />
  );
}
