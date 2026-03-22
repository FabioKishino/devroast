import {
  LeaderboardTableFooter,
  LeaderboardTableGrid,
  LeaderboardTableHeader,
  LeaderboardTableRoot,
  LeaderboardTableRow,
} from "@/components/ui/leaderboard-table";

type LeaderboardRow = {
  id: string;
  score: number;
  code: string;
  language: string;
};

type LeaderboardTableServerProps = {
  rows: LeaderboardRow[];
  totalCount: number;
};

export async function LeaderboardTableServer({
  rows,
  totalCount,
}: LeaderboardTableServerProps) {
  return (
    <LeaderboardTableRoot>
      <LeaderboardTableHeader />
      <LeaderboardTableGrid>
        {
          await Promise.all(
            rows.map(async (row, i) => (
              <LeaderboardTableRow
                key={row.id}
                rank={i + 1}
                score={row.score}
                code={row.code}
                language={row.language}
                isLast={i === rows.length - 1}
              />
            ))
          )
        }
      </LeaderboardTableGrid>
      <LeaderboardTableFooter totalCount={totalCount} />
    </LeaderboardTableRoot>
  );
}
