import { cacheLife } from "next/cache";
import { Suspense } from "react";
import { caller } from "@/trpc/server";
import { LeaderboardSkeleton } from "./leaderboard-skeleton";
import { LeaderboardTableServer } from "./leaderboard-table-server";

async function LeaderboardData() {
  "use cache";
  cacheLife("hours");

  const [leaderboardData, statsData] = await Promise.all([
    caller.leaderboard.topShame(),
    caller.leaderboard.stats(),
  ]);

  return (
    <LeaderboardTableServer
      rows={leaderboardData}
      totalCount={statsData.totalCount}
    />
  );
}

export function HomepageLeaderboard() {
  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <LeaderboardData />
    </Suspense>
  );
}
