import {
  LeaderboardTableFooter,
  LeaderboardTableGrid,
  LeaderboardTableHeader,
  LeaderboardTableRoot,
  LeaderboardTableRow,
} from "@/components/ui/leaderboard-table";

export function LeaderboardSkeleton() {
  return (
    <LeaderboardTableRoot>
      <LeaderboardTableHeader />
      <LeaderboardTableGrid>
        {[1, 2, 3].map((rank, i) => (
          <LeaderboardTableRow
            key={rank}
            rank={rank}
            score={0}
            codeLines={["—", "—"]}
            language="—"
            isLast={i === 2}
            className="opacity-40"
          />
        ))}
      </LeaderboardTableGrid>
      <LeaderboardTableFooter totalCount={0} />
    </LeaderboardTableRoot>
  );
}
