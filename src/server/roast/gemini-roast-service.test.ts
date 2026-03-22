import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { describe, it } from "node:test";
import { parseRoastAnalysisResult } from "./types";

function buildPromptWithService(roastMode: boolean): string {
  const servicePath = new URL("./gemini-roast-service.ts", import.meta.url)
    .pathname;

  const output = execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      "--eval",
      [
        `import * as service from ${JSON.stringify(servicePath)};`,
        "const api = service.default ?? service;",
        `const prompt = api.buildRoastPrompt({ code: "const x = 1;", roastMode: ${String(roastMode)}, language: "typescript" });`,
        "process.stdout.write(prompt);",
      ].join(""),
    ],
    { encoding: "utf8" }
  );

  return output;
}

describe("buildRoastPrompt", () => {
  it("includes sarcastic instructions when roastMode is true", () => {
    const prompt = buildPromptWithService(true);

    assert.match(prompt, /sarcastic/i);
  });

  it("includes technical and direct instructions when roastMode is false", () => {
    const prompt = buildPromptWithService(false);

    assert.match(prompt, /technical/i);
    assert.match(prompt, /direct/i);
  });
});

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
