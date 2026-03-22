import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createRoastAction,
  getCreateRoastActionConfig,
  persistRoastInTransaction,
} from "./create-roast-action";

type CreateRoastActionDeps = {
  analyzeCodeWithGemini: (input: {
    code: string;
    roastMode: boolean;
    language?: string;
  }) => Promise<{
    score: number;
    roastQuote: string;
    analysisItems: Array<{
      severity: "critical" | "warning" | "good";
      title: string;
      description: string;
      sortOrder: number;
    }>;
    diffSuggestions: Array<{
      lineType: "added" | "removed" | "context";
      content: string;
      lineNumber: number;
    }>;
  }>;
  persistRoast: (input: {
    submission: {
      code: string;
      language: string;
      linesCount: number;
      roastMode: boolean;
      score: number;
      roastQuote: string;
    };
    analysisItems: Array<unknown>;
    diffSuggestions: Array<unknown>;
  }) => Promise<{ id: string }>;
  redirect: (url: string) => never;
};

function makeFormData(input: {
  code: string;
  roastMode?: string;
  language?: string;
}): FormData {
  const formData = new FormData();
  formData.set("code", input.code);

  if (input.roastMode !== undefined) {
    formData.set("roastMode", input.roastMode);
  }

  if (input.language !== undefined) {
    formData.set("language", input.language);
  }

  return formData;
}

function makeDeps(
  overrides?: Partial<CreateRoastActionDeps>
): CreateRoastActionDeps & {
  calls: {
    analyze: Array<unknown>;
    persist: Array<unknown>;
    redirect: Array<string>;
  };
} {
  const calls = {
    analyze: [] as Array<unknown>,
    persist: [] as Array<unknown>,
    redirect: [] as Array<string>,
  };

  const deps: CreateRoastActionDeps = {
    analyzeCodeWithGemini: async (input) => {
      calls.analyze.push(input);

      return {
        score: 3.5,
        roastQuote: "oof",
        analysisItems: [
          {
            severity: "warning",
            title: "issue",
            description: "desc",
            sortOrder: 0,
          },
        ],
        diffSuggestions: [
          {
            lineType: "context",
            content: "const value = 1;",
            lineNumber: 1,
          },
        ],
      };
    },
    persistRoast: async (input) => {
      calls.persist.push(input);
      return { id: "submission-1" };
    },
    redirect: (url) => {
      calls.redirect.push(url);
      throw new Error(`REDIRECT:${url}`);
    },
  };

  return {
    ...deps,
    ...overrides,
    calls,
  };
}

describe("createRoastAction", () => {
  it("exposes MAX_CODE_LENGTH config", async () => {
    const config = await getCreateRoastActionConfig();

    assert.equal(config.MAX_CODE_LENGTH, 20000);
  });

  it("returns error for empty/invalid code", async () => {
    const deps = makeDeps();
    const formData = makeFormData({ code: "   ", roastMode: "false" });

    const result = await createRoastAction(null, formData, deps);

    assert.deepEqual(result, {
      error: "Please provide valid code before generating a roast.",
    });
    assert.equal(deps.calls.analyze.length, 0);
    assert.equal(deps.calls.persist.length, 0);
  });

  it("returns error when code exceeds MAX_CODE_LENGTH before Gemini call", async () => {
    const config = await getCreateRoastActionConfig();
    const deps = makeDeps();
    const formData = makeFormData({
      code: "x".repeat(config.MAX_CODE_LENGTH + 1),
      roastMode: "false",
    });

    const result = await createRoastAction(null, formData, deps);

    assert.deepEqual(result, {
      error: `Code must be at most ${config.MAX_CODE_LENGTH} characters.`,
    });
    assert.equal(deps.calls.analyze.length, 0);
    assert.equal(deps.calls.persist.length, 0);
  });

  it("coerces roastMode string values", async () => {
    const trueDeps = makeDeps();
    const falseDeps = makeDeps();

    await assert.rejects(
      () =>
        createRoastAction(
          null,
          makeFormData({ code: "const a = 1;", roastMode: "true" }),
          trueDeps
        ),
      /REDIRECT:\/roast\/submission-1/
    );

    await assert.rejects(
      () =>
        createRoastAction(
          null,
          makeFormData({ code: "const a = 1;", roastMode: "false" }),
          falseDeps
        ),
      /REDIRECT:\/roast\/submission-1/
    );

    assert.equal(
      (trueDeps.calls.analyze[0] as { roastMode: boolean }).roastMode,
      true
    );
    assert.equal(
      (falseDeps.calls.analyze[0] as { roastMode: boolean }).roastMode,
      false
    );
  });

  it("returns validation error when roastMode is missing", async () => {
    const deps = makeDeps();

    const result = await createRoastAction(
      null,
      makeFormData({ code: "const a = 1;" }),
      deps
    );

    assert.equal(typeof result?.error, "string");
    assert.equal(deps.calls.analyze.length, 0);
    assert.equal(deps.calls.persist.length, 0);
  });

  it("returns validation error when roastMode is invalid", async () => {
    const deps = makeDeps();

    const result = await createRoastAction(
      null,
      makeFormData({ code: "const a = 1;", roastMode: "maybe" }),
      deps
    );

    assert.equal(typeof result?.error, "string");
    assert.equal(deps.calls.analyze.length, 0);
    assert.equal(deps.calls.persist.length, 0);
  });

  it("preserves raw code and counts trailing newline as an extra line", async () => {
    const deps = makeDeps();
    const code = "  const a = 1;\n";

    await assert.rejects(
      () =>
        createRoastAction(
          null,
          makeFormData({ code, roastMode: "false" }),
          deps
        ),
      /REDIRECT:\/roast\/submission-1/
    );

    assert.equal((deps.calls.analyze[0] as { code: string }).code, code);
    const payload = deps.calls.persist[0] as {
      submission: {
        code: string;
        linesCount: number;
      };
    };

    assert.equal(payload.submission.code, code);
    assert.equal(payload.submission.linesCount, 2);
  });

  it("falls back to plaintext when language is unsupported", async () => {
    const deps = makeDeps();

    await assert.rejects(
      () =>
        createRoastAction(
          null,
          makeFormData({
            code: "const a = 1;",
            roastMode: "false",
            language: "totally-unknown-lang",
          }),
          deps
        ),
      /REDIRECT:\/roast\/submission-1/
    );

    assert.equal(
      (deps.calls.analyze[0] as { language?: string }).language,
      "plaintext"
    );
  });

  it("returns error when Gemini analysis fails and does not persist", async () => {
    const deps = makeDeps({
      analyzeCodeWithGemini: async () => {
        throw new Error("Gemini failed");
      },
    });

    const result = await createRoastAction(
      null,
      makeFormData({ code: "const a = 1;", roastMode: "false" }),
      deps
    );

    assert.deepEqual(result, {
      error: "Could not generate roast. Please try again.",
    });
    assert.equal(deps.calls.persist.length, 0);
  });

  it("persists submission, analysis items and diff suggestions then redirects", async () => {
    const deps = makeDeps();

    await assert.rejects(
      () =>
        createRoastAction(
          null,
          makeFormData({ code: "line1\nline2", roastMode: "true" }),
          deps
        ),
      /REDIRECT:\/roast\/submission-1/
    );

    assert.equal(deps.calls.persist.length, 1);
    const payload = deps.calls.persist[0] as {
      submission: {
        code: string;
        language: string;
        linesCount: number;
        roastMode: boolean;
      };
      analysisItems: unknown[];
      diffSuggestions: unknown[];
    };

    assert.equal(payload.submission.code, "line1\nline2");
    assert.equal(payload.submission.language, "plaintext");
    assert.equal(payload.submission.linesCount, 2);
    assert.equal(payload.submission.roastMode, true);
    assert.equal(payload.analysisItems.length > 0, true);
    assert.equal(payload.diffSuggestions.length > 0, true);
    assert.equal(deps.calls.redirect[0], "/roast/submission-1");
  });

  it("rolls back pending writes when a child insert fails in transaction path", async () => {
    const committed = {
      submissions: 0,
      analysis: 0,
      diff: 0,
    };

    await assert.rejects(
      () =>
        persistRoastInTransaction(
          {
            submission: {
              code: "const a = 1;",
              language: "typescript",
              linesCount: 1,
              roastMode: false,
              score: 4.2,
              roastQuote: "quote",
            },
            analysisItems: [
              {
                severity: "warning",
                title: "title",
                description: "desc",
                sortOrder: 0,
              },
            ],
            diffSuggestions: [],
          },
          async (
            work: (operations: {
              insertSubmission: () => Promise<{ id: string }>;
              insertAnalysisItems: () => Promise<void>;
              insertDiffSuggestions: () => Promise<void>;
            }) => Promise<{ id: string }>
          ) => {
            const pending = {
              submissions: 0,
              analysis: 0,
              diff: 0,
            };

            const operations = {
              insertSubmission: async () => {
                pending.submissions += 1;
                return { id: "submission-1" };
              },
              insertAnalysisItems: async () => {
                throw new Error("analysis insert failed");
              },
              insertDiffSuggestions: async () => {
                pending.diff += 1;
              },
            };

            const result = await work(operations);
            committed.submissions += pending.submissions;
            committed.analysis += pending.analysis;
            committed.diff += pending.diff;
            return result;
          }
        ),
      /analysis insert failed/
    );

    assert.equal(committed.submissions, 0);
    assert.equal(committed.analysis, 0);
    assert.equal(committed.diff, 0);
  });
});
