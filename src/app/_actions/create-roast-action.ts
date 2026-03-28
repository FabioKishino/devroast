"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { LANGUAGE_OPTIONS } from "@/lib/languages";
import type { RoastAnalysisResult } from "@/server/roast/types";

const MAX_CODE_LENGTH = 20000;
const SUPPORTED_LANGUAGES = new Set(
  LANGUAGE_OPTIONS.flatMap((option) => {
    if (option.value === null) {
      return [];
    }

    return option.value === "text" ? ["plaintext"] : [option.value];
  })
);

const formSchema = z.object({
  code: z
    .string()
    .refine((value) => value.trim().length > 0, {
      message: "Please provide valid code before generating a roast.",
    })
    .refine((value) => value.length <= MAX_CODE_LENGTH, {
      message: `Code must be at most ${MAX_CODE_LENGTH} characters.`,
    }),
  roastMode: z.enum(["true", "false"]).transform((value) => value === "true"),
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

type TransactionOperations = {
  insertSubmission: () => Promise<{ id: string }>;
  insertAnalysisItems: () => Promise<void>;
  insertDiffSuggestions: () => Promise<void>;
};

type TransactionRunner = <T>(
  work: (operations: TransactionOperations) => Promise<T>
) => Promise<T>;

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

    return persistRoastInTransaction(input, async (work) => {
      return db.transaction(async (tx) => {
        let submissionId = "";

        return work({
          insertSubmission: async () => {
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

            const insertedId = insertedSubmission[0]?.id;

            if (!insertedId) {
              throw new Error("Failed to create submission");
            }

            submissionId = insertedId;

            return { id: submissionId };
          },
          insertAnalysisItems: async () => {
            if (input.analysisItems.length === 0) {
              return;
            }

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
          },
          insertDiffSuggestions: async () => {
            if (input.diffSuggestions.length === 0) {
              return;
            }

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
          },
        });
      });
    });
  },
  redirect,
};

export async function persistRoastInTransaction(
  input: PersistRoastInput,
  runTransaction: TransactionRunner
): Promise<{ id: string }> {
  void input;
  let submissionId = "";

  return runTransaction(async (operations) => {
    const inserted = await operations.insertSubmission();
    submissionId = inserted.id;

    await operations.insertAnalysisItems();
    await operations.insertDiffSuggestions();

    return { id: submissionId };
  });
}

export async function createRoastAction(
  _previousState: CreateRoastActionState | null,
  formData: FormData,
  deps: CreateRoastActionDeps = defaultDeps
): Promise<CreateRoastActionState | undefined> {
  const parsed = formSchema.safeParse({
    code: formData.get("code"),
    roastMode: formData.get("roastMode"),
    language: formData.get("language"),
  });

  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Please provide valid code before generating a roast.",
    };
  }

  const code = parsed.data.code;
  const roastMode = parsed.data.roastMode;
  const language = parsed.data.language;
  const linesCount = code.length === 0 ? 0 : code.split(/\r?\n/).length;

  let saved: { id: string };

  try {
    const analysis = await deps.analyzeCodeWithGemini({
      code,
      roastMode,
      language,
    });

    saved = await deps.persistRoast({
      submission: {
        code,
        language,
        linesCount,
        roastMode,
        score: analysis.score,
        roastQuote: analysis.roastQuote,
      },
      analysisItems: analysis.analysisItems,
      diffSuggestions: analysis.diffSuggestions,
    });
  } catch {
    return {
      error: "Could not generate roast. Please try again.",
    };
  }

  deps.redirect(`/roast/${saved.id}`);
}
