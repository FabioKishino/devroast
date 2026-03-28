import assert from "node:assert/strict";
import { describe, it } from "node:test";

type MockDbData = {
  submissionRows: Array<{
    id: string;
    code: string;
    language: string;
    linesCount: number;
    roastMode: boolean;
    score: string | number | null;
    roastQuote: string | null;
    createdAt: Date;
  }>;
  analysisRows: Array<{
    id: string;
    submissionId: string;
    severity: "critical" | "warning" | "good";
    title: string;
    description: string;
    sortOrder: number;
  }>;
  diffRows: Array<{
    id: string;
    submissionId: string;
    lineType: "added" | "removed" | "context";
    content: string;
    lineNumber: number;
  }>;
};

function createMockDb(data: MockDbData) {
  let whereCalls = 0;

  return {
    select: () => ({
      from: () => ({
        where: async () => {
          whereCalls += 1;

          if (whereCalls === 1) {
            return data.submissionRows;
          }

          if (whereCalls === 2) {
            return data.analysisRows;
          }

          return data.diffRows;
        },
      }),
    }),
  };
}

describe("roastRouter.byId", () => {
  it("normalizes score to number and applies deterministic child ordering", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { roastRouter } = await import("./roast");
    const submissionId = "11111111-1111-4111-8111-111111111111";
    const caller = roastRouter.createCaller({
      db: createMockDb({
        submissionRows: [
          {
            id: submissionId,
            code: "const x = 1;",
            language: "typescript",
            linesCount: 1,
            roastMode: true,
            score: "4.20",
            roastQuote: "quote",
            createdAt: new Date("2026-03-22T00:00:00.000Z"),
          },
        ],
        analysisRows: [
          {
            id: "b-item",
            submissionId,
            severity: "warning",
            title: "b",
            description: "b",
            sortOrder: 2,
          },
          {
            id: "a-item",
            submissionId,
            severity: "warning",
            title: "a",
            description: "a",
            sortOrder: 2,
          },
          {
            id: "c-item",
            submissionId,
            severity: "critical",
            title: "c",
            description: "c",
            sortOrder: 1,
          },
        ],
        diffRows: [
          {
            id: "b-diff",
            submissionId,
            lineType: "context",
            content: "b",
            lineNumber: 10,
          },
          {
            id: "a-diff",
            submissionId,
            lineType: "context",
            content: "a",
            lineNumber: 10,
          },
          {
            id: "c-diff",
            submissionId,
            lineType: "added",
            content: "c",
            lineNumber: 2,
          },
        ],
      }) as never,
    });

    const result = await caller.byId({ id: submissionId });

    assert.equal(typeof result?.score, "number");
    assert.equal(result?.score, 4.2);
    assert.deepEqual(
      result?.analysisItems.map((item: { id: string }) => item.id),
      ["c-item", "a-item", "b-item"]
    );
    assert.deepEqual(
      result?.diffSuggestions.map((item: { id: string }) => item.id),
      ["c-diff", "a-diff", "b-diff"]
    );
  });

  it("returns null when submission id does not exist", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { roastRouter } = await import("./roast");
    const caller = roastRouter.createCaller({
      db: createMockDb({
        submissionRows: [],
        analysisRows: [],
        diffRows: [],
      }) as never,
    });

    const result = await caller.byId({
      id: "22222222-2222-4222-8222-222222222222",
    });

    assert.equal(result, null);
  });

  it("normalizes non-numeric score payloads to zero", async () => {
    process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
    const { roastRouter } = await import("./roast");
    const submissionId = "33333333-3333-4333-8333-333333333333";
    const caller = roastRouter.createCaller({
      db: createMockDb({
        submissionRows: [
          {
            id: submissionId,
            code: "const y = 2;",
            language: "typescript",
            linesCount: 1,
            roastMode: false,
            score: true as never,
            roastQuote: "quote",
            createdAt: new Date("2026-03-22T00:00:00.000Z"),
          },
        ],
        analysisRows: [],
        diffRows: [],
      }) as never,
    });

    const result = await caller.byId({ id: submissionId });

    assert.equal(result?.score, 0);
  });
});
