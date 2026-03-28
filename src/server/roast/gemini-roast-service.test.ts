import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { describe, it } from "node:test";
import { parseRoastAnalysisResult } from "./types";

function runServiceEval(script: string, apiKey?: string | null) {
  const env = { ...process.env };

  if (apiKey === null) {
    delete env.GEMINI_API_KEY;
  } else if (apiKey !== undefined) {
    env.GEMINI_API_KEY = apiKey;
  }

  return spawnSync(
    process.execPath,
    ["--conditions=react-server", "--import", "tsx", "--eval", script],
    { encoding: "utf8", env }
  );
}

function buildPromptWithService(roastMode: boolean): string {
  const servicePath = new URL("./gemini-roast-service.ts", import.meta.url)
    .pathname;
  const result = runServiceEval(
    [
      `import * as service from ${JSON.stringify(servicePath)};`,
      "const api = service.default ?? service;",
      `const prompt = api.buildRoastPrompt({ code: "const x = 1;", roastMode: ${String(roastMode)}, language: "typescript" });`,
      "process.stdout.write(prompt);",
    ].join(""),
    "test-key"
  );

  assert.equal(result.status, 0, result.stderr);
  return result.stdout;
}

function runAnalyzeInService(options: {
  apiKey?: string | null;
  generatedText?: string;
  throwsMessage?: string;
}) {
  const servicePath = new URL("./gemini-roast-service.ts", import.meta.url)
    .pathname;
  const result = runServiceEval(
    [
      `import * as service from ${JSON.stringify(servicePath)};`,
      "const api = service.default ?? service;",
      "const output = {};",
      "try {",
      "  const response = await api.analyzeCodeWithGemini({",
      '    code: "const x = 1;",',
      "    roastMode: false,",
      '    language: "typescript",',
      "    clientFactory: () => ({",
      "      models: {",
      options.throwsMessage
        ? `        generateContent: async () => { throw new Error(${JSON.stringify(options.throwsMessage)}); },`
        : `        generateContent: async () => ({ text: ${JSON.stringify(options.generatedText ?? "")} }),`,
      "      },",
      "    }),",
      "  });",
      "  output.ok = true;",
      "  output.response = response;",
      "} catch (error) {",
      "  output.ok = false;",
      "  output.message = error instanceof Error ? error.message : String(error);",
      "  output.cause =",
      "    error instanceof Error && error.cause instanceof Error",
      "      ? error.cause.message",
      "      : undefined;",
      "}",
      "process.stdout.write(JSON.stringify(output));",
    ].join("\n"),
    options.apiKey
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.length > 0, true);

  return JSON.parse(result.stdout) as {
    ok: boolean;
    message?: string;
    cause?: string;
    response?: {
      score: number;
      roastQuote: string;
    };
  };
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

describe("analyzeCodeWithGemini", () => {
  it("throws clear config error when API key is missing", () => {
    const output = runAnalyzeInService({ apiKey: null, generatedText: "{}" });

    assert.equal(output.ok, false);
    assert.match(output.message ?? "", /GEMINI_API_KEY/);
  });

  it("throws clear config error when API key is blank", () => {
    const output = runAnalyzeInService({ apiKey: "   ", generatedText: "{}" });

    assert.equal(output.ok, false);
    assert.match(output.message ?? "", /GEMINI_API_KEY/);
  });

  it("rejects empty response text", () => {
    const output = runAnalyzeInService({
      apiKey: "test-key",
      generatedText: "",
    });

    assert.equal(output.ok, false);
    assert.match(output.message ?? "", /empty response/i);
  });

  it("returns parsed analysis from successful JSON response", () => {
    const output = runAnalyzeInService({
      apiKey: "test-key",
      generatedText: JSON.stringify({
        score: 2.5,
        roastQuote: "solid effort",
        analysisItems: [
          {
            severity: "warning",
            title: "unused variable",
            description: "remove dead code",
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
      }),
    });

    assert.equal(output.ok, true);
    assert.equal(output.response?.score, 2.5);
    assert.equal(output.response?.roastQuote, "solid effort");
  });

  it("wraps SDK failures with context and preserves cause", () => {
    const output = runAnalyzeInService({
      apiKey: "test-key",
      throwsMessage: "network down",
    });

    assert.equal(output.ok, false);
    assert.match(output.message ?? "", /gemini request failed/i);
    assert.match(output.cause ?? "", /network down/i);
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
