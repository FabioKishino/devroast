import { avg, count } from "drizzle-orm";
import { submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        totalCount: count(),
        avgScore: avg(submissions.score),
      })
      .from(submissions);

    const row = result[0];
    return {
      totalCount: row?.totalCount ?? 0,
      avgScore: row?.avgScore ? Number(row.avgScore) : 0,
    };
  }),
});
