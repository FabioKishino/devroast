import { asc, avg, count, desc, isNotNull } from "drizzle-orm";
import { z } from "zod";
import { submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";
import { mapTopShameRow } from "./leaderboard.mapper";

const topShameInput = z
  .object({
    limit: z.number().int().min(1).max(20).optional(),
  })
  .optional();

export const leaderboardRouter = createTRPCRouter({
  stats: baseProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          totalCount: count(),
          avgScore: avg(submissions.score).mapWith(Number),
        })
        .from(submissions);

      const row = result[0];
      return {
        totalCount: row?.totalCount ?? 0,
        avgScore: row?.avgScore ?? 0,
      };
    } catch {
      return {
        totalCount: 0,
        avgScore: 0,
      };
    }
  }),

  topShame: baseProcedure.input(topShameInput).query(async ({ ctx, input }) => {
    try {
      const take = input?.limit ?? 3;

      const rows = await ctx.db
        .select({
          id: submissions.id,
          score: submissions.score,
          code: submissions.code,
          language: submissions.language,
          linesCount: submissions.linesCount,
        })
        .from(submissions)
        .where(isNotNull(submissions.score))
        .orderBy(asc(submissions.score), desc(submissions.createdAt))
        .limit(take);

      return rows.map((row) =>
        mapTopShameRow({ ...row, score: row.score ?? 0 })
      );
    } catch {
      return [];
    }
  }),
});
