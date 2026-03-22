"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { RoastAnalysisResult } from "@/server/roast/types";

const MAX_CODE_LENGTH = 20000;
const SUPPORTED_LANGUAGES = new Set([
  "plaintext",
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "json",
  "html",
  "css",
  "bash",
  "sql",
]);

const formSchema = z.object({
  code: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "Please provide valid code before generating a roast.",
    })
    .refine((value) => value.length <= MAX_CODE_LENGTH, {
      message: `Code must be at most ${MAX_CODE_LENGTH} characters.`,
    }),
  roastMode: z.preprocess((value) => value === "true", z.boolean()),
  language: z
    .preprocess(
      (value) => (typeof value === "string" ? value : undefined),
      z.string().optional()
    )
    .transform((value) => {
      const normalized = value?.trim().toLowerCase();

      if (!normalized || !SUPPORTED_LANGUAGES.has(normalized)) {
        return "plaintext";
      }

      return normalized;
    }),
});

type CreateRoastActionState = {
  error?: string;
};

type PersistRoastInput = {
  submission: {
    code: string;
    language: string;
    linesCount: number;
    roastMode: boolean;
    score: number;
    roastQuote: string;
  };
  analysisItems: RoastAnalysisResult["analysisItems"];
  diffSuggestions: RoastAnalysisResult["diffSuggestions"];
};

type CreateRoastActionDeps = {
  analyzeCodeWithGemini: (input: {
    code: string;
    roastMode: boolean;
    language?: string;
  }) => Promise<RoastAnalysisResult>;
  persistRoast: (input: PersistRoastInput) => Promise<{ id: string }>;
  redirect: (url: string) => never;
};

export async function getCreateRoastActionConfig() {
  return {
    MAX_CODE_LENGTH,
  };
}

const defaultDeps: CreateRoastActionDeps = {
  analyzeCodeWithGemini: async (input) => {
    const { analyzeCodeWithGemini } = await import(
      "@/server/roast/gemini-roast-service"
    );

    return analyzeCodeWithGemini(input);
  },
  persistRoast: async (input) => {
    const [{ db }, { analysisItems, diffSuggestions, submissions }] =
      await Promise.all([import("@/db"), import("@/db/schema")]);

    return db.transaction(async (tx) => {
      const insertedSubmission = await tx
        .insert(submissions)
        .values({
          code: input.submission.code,
          language: input.submission.language,
          linesCount: input.submission.linesCount,
          roastMode: input.submission.roastMode,
          score: input.submission.score.toFixed(2),
          roastQuote: input.submission.roastQuote,
        })
        .returning({ id: submissions.id });

      const submissionId = insertedSubmission[0]?.id;

      if (!submissionId) {
        throw new Error("Failed to create submission");
      }

      if (input.analysisItems.length > 0) {
        await tx.insert(analysisItems).values(
          input.analysisItems.map(
            (item: RoastAnalysisResult["analysisItems"][number]) => ({
              submissionId,
              severity: item.severity,
              title: item.title,
              description: item.description,
              sortOrder: item.sortOrder,
            })
          )
        );
      }

      if (input.diffSuggestions.length > 0) {
        await tx.insert(diffSuggestions).values(
          input.diffSuggestions.map(
            (item: RoastAnalysisResult["diffSuggestions"][number]) => ({
              submissionId,
              lineType: item.lineType,
              content: item.content,
              lineNumber: item.lineNumber,
            })
          )
        );
      }

      return { id: submissionId };
    });
  },
  redirect,
};

export async function createRoastAction(
  _previousState: CreateRoastActionState | null,
  formData: FormData,
  deps: CreateRoastActionDeps = defaultDeps
): Promise<CreateRoastActionState | undefined> {
  void _previousState;
  void formData;
  void deps;

  return {
    error: "Temporary red state",
  };
}
