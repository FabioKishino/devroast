import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapTopShameRow } from "./leaderboard.mapper";

describe("mapTopShameRow", () => {
  it("maps score to number and preserves linesCount", () => {
    const result = mapTopShameRow({
      id: "row-1",
      score: "2.50",
      code: "a\nb\nc\nd",
      language: "typescript",
      linesCount: 4,
    });

    assert.deepEqual(result, {
      id: "row-1",
      score: 2.5,
      code: "a\nb\nc\nd",
      language: "typescript",
      linesCount: 4,
      codeLines: ["a", "b", "c"],
    });
  });

  it("falls back to code-derived linesCount when missing", () => {
    const result = mapTopShameRow({
      id: "row-2",
      score: "1.00",
      code: "x\ny",
      language: "javascript",
      linesCount: undefined,
    });

    assert.equal(result.linesCount, 2);
  });

  it("accepts numeric score input", () => {
    const result = mapTopShameRow({
      id: "row-3",
      score: 7.25,
      code: "const a = 1;",
      language: "typescript",
      linesCount: 1,
    });

    assert.equal(result.score, 7.25);
  });

  it("falls back to 0 for invalid score input", () => {
    const result = mapTopShameRow({
      id: "row-4",
      score: "not-a-number",
      code: "console.log('x')",
      language: "javascript",
      linesCount: 1,
    });

    assert.equal(result.score, 0);
    assert.equal(Number.isFinite(result.score), true);
  });

  it("normalizes CRLF line endings when deriving code lines", () => {
    const result = mapTopShameRow({
      id: "row-5",
      score: "3.00",
      code: "first\r\nsecond\r\nthird\r\nfourth",
      language: "typescript",
      linesCount: undefined,
    });

    assert.equal(result.linesCount, 4);
    assert.deepEqual(result.codeLines, ["first", "second", "third"]);
  });

  it("handles empty code with zero derived linesCount", () => {
    const result = mapTopShameRow({
      id: "row-6",
      score: "4.00",
      code: "",
      language: "typescript",
      linesCount: undefined,
    });

    assert.equal(result.linesCount, 0);
    assert.deepEqual(result.codeLines, []);
  });
});
