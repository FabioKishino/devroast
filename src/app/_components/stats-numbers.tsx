"use client";

import NumberFlow from "@number-flow/react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsNumbers() {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.leaderboard.stats.queryOptions());

  return (
    <div className="flex items-center justify-center gap-6">
      <span className="font-secondary text-xs text-text-tertiary inline-flex items-center gap-1">
        <NumberFlow
          value={data.totalCount}
          className="font-secondary text-xs text-text-tertiary tabular-nums"
        />
        {" codes roasted"}
      </span>
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <span className="font-secondary text-xs text-text-tertiary inline-flex items-center gap-1">
        {"avg score: "}
        <NumberFlow
          value={data.avgScore}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="font-secondary text-xs text-text-tertiary tabular-nums"
        />
        {"/10"}
      </span>
    </div>
  );
}
