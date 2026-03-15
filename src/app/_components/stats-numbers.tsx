"use client";

import NumberFlow from "@number-flow/react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function StatsNumbers() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.leaderboard.stats.queryOptions());

  return (
    <div className="flex items-center justify-center gap-6">
      <span className="font-secondary text-xs text-text-tertiary inline-flex items-center gap-1">
        <NumberFlow
          value={data?.totalCount ?? 0}
          className="font-secondary text-xs text-text-tertiary tabular-nums"
        />
        {" codes roasted"}
      </span>
      <span className="font-mono text-xs text-text-tertiary">·</span>
      <span className="font-secondary text-xs text-text-tertiary inline-flex items-center gap-1">
        {"avg score: "}
        <NumberFlow
          value={data?.avgScore ?? 0}
          format={{ minimumFractionDigits: 1, maximumFractionDigits: 1 }}
          className="font-secondary text-xs text-text-tertiary tabular-nums"
        />
        {"/10"}
      </span>
    </div>
  );
}
