import { eq } from "drizzle-orm";
import { z } from "zod";
import { analysisItems, diffSuggestions, submissions } from "@/db/schema";
import { baseProcedure, createTRPCRouter } from "../init";

const byIdInput = z.object({
  id: z.string().uuid(),
});

function toFiniteScore(value: number | string | null): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export const roastRouter = createTRPCRouter({
  byId: baseProcedure.input(byIdInput).query(async ({ ctx, input }) => {
    const submissionRows = await ctx.db
      .select({
        id: submissions.id,
        code: submissions.code,
        language: submissions.language,
        linesCount: submissions.linesCount,
        roastMode: submissions.roastMode,
        score: submissions.score,
        roastQuote: submissions.roastQuote,
        createdAt: submissions.createdAt,
      })
      .from(submissions)
      .where(eq(submissions.id, input.id));

    const submission = submissionRows[0];

    if (!submission) {
      return null;
    }

    const analysisRows = await ctx.db
      .select({
        id: analysisItems.id,
        submissionId: analysisItems.submissionId,
        severity: analysisItems.severity,
        title: analysisItems.title,
        description: analysisItems.description,
        sortOrder: analysisItems.sortOrder,
      })
      .from(analysisItems)
      .where(eq(analysisItems.submissionId, input.id));

    const diffRows = await ctx.db
      .select({
        id: diffSuggestions.id,
        submissionId: diffSuggestions.submissionId,
        lineType: diffSuggestions.lineType,
        content: diffSuggestions.content,
        lineNumber: diffSuggestions.lineNumber,
      })
      .from(diffSuggestions)
      .where(eq(diffSuggestions.submissionId, input.id));

    return {
      id: submission.id,
      code: submission.code,
      language: submission.language,
      linesCount: submission.linesCount,
      roastMode: submission.roastMode,
      score: toFiniteScore(submission.score),
      roastQuote: submission.roastQuote,
      createdAt: submission.createdAt,
      analysisItems: [...analysisRows].sort(
        (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)
      ),
      diffSuggestions: [...diffRows].sort(
        (a, b) => a.lineNumber - b.lineNumber || a.id.localeCompare(b.id)
      ),
    };
  }),
});
