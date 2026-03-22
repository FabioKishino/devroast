import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseRoastAnalysisResult } from "./types";

describe("parseGeminiRoastResponse", () => {
  it("parses valid roast payload", () => {
    const parsed = parseRoastAnalysisResult(
      JSON.stringify({
        score: 3.2,
        roastQuote: "harsh quote",
        analysisItems: [
          {
            severity: "critical",
            title: "issue",
            description: "desc",
            sortOrder: 0,
          },
        ],
        diffSuggestions: [
          {
            lineType: "context",
            content: "const x = 1",
            lineNumber: 1,
          },
        ],
      })
    );

    assert.equal(parsed.score, 3.2);
    assert.equal(parsed.analysisItems[0]?.severity, "critical");
    assert.equal(parsed.diffSuggestions[0]?.lineType, "context");
  });

  it("rejects malformed JSON", () => {
    assert.throws(() => parseRoastAnalysisResult("{ score: 3.2"));
  });

  it("rejects invalid enum values", () => {
    assert.throws(() =>
      parseRoastAnalysisResult(
        JSON.stringify({
          score: 3.2,
          roastQuote: "harsh quote",
          analysisItems: [
            {
              severity: "fatal",
              title: "issue",
              description: "desc",
              sortOrder: 0,
            },
          ],
          diffSuggestions: [
            {
              lineType: "context",
              content: "const x = 1",
              lineNumber: 1,
            },
          ],
        })
      )
    );
  });

  it("rejects missing required fields", () => {
    assert.throws(() =>
      parseRoastAnalysisResult(
        JSON.stringify({
          score: 3.2,
          analysisItems: [],
          diffSuggestions: [],
        })
      )
    );
  });

  it("rejects whitespace-only roastQuote", () => {
    assert.throws(() =>
      parseRoastAnalysisResult(
        JSON.stringify({
          score: 3.2,
          roastQuote: "   ",
          analysisItems: [],
          diffSuggestions: [],
        })
      )
    );
  });
});
