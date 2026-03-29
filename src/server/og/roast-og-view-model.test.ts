import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRoastOgModel,
  buildRoastOgNotFoundModel,
  buildRoastOgRenderErrorModel,
  sanitizeQuote,
  toVerdictLabel,
  truncateQuote,
} from "./roast-og-view-model";

describe("toVerdictLabel", () => {
  it("maps scores to the same verdict labels used on roast page", () => {
    assert.equal(toVerdictLabel(3), "needs_serious_help");
    assert.equal(toVerdictLabel(6), "room_for_improvement");
    assert.equal(toVerdictLabel(8), "solid_work");
    assert.equal(toVerdictLabel(9), "clean_code_machine");
  });

  it("maps NaN score to non-best fallback verdict", () => {
    assert.equal(toVerdictLabel(Number.NaN), "needs_serious_help");
  });
});

describe("sanitizeQuote", () => {
  it("collapses tabs/newlines into spaces and trims", () => {
    assert.equal(
      sanitizeQuote("  wow\tthis\n\ncode\r\nrocks  "),
      "wow this code rocks"
    );
    assert.equal(sanitizeQuote(null), "");
  });
});

describe("truncateQuote", () => {
  it("truncates to max chars and appends ellipsis", () => {
    const longValue = "x".repeat(140);

    assert.equal(truncateQuote(longValue, 120), `${"x".repeat(120)}...`);
    assert.equal(truncateQuote("short", 120), "short");
  });
});

describe("buildRoastOgModel", () => {
  it("builds model with score, verdict, metadata and sanitized+truncated quote", () => {
    const model = buildRoastOgModel({
      score: 7,
      language: "typescript",
      linesCount: 87,
      roastQuote: `\n\t${"y".repeat(130)}\n`,
    });

    assert.equal(model.scoreText, "7/10");
    assert.equal(model.verdictLabel, "solid_work");
    assert.equal(model.metadataText, "typescript • 87 lines");
    assert.equal(model.quoteText, `${"y".repeat(120)}...`);
  });

  it("returns non-empty fallback quote text for whitespace-only input", () => {
    const model = buildRoastOgModel({
      score: 7,
      language: "typescript",
      linesCount: 87,
      roastQuote: "   \n\t  ",
    });

    assert.equal(model.quoteText, "no roast quote available.");
  });
});

describe("fallback models", () => {
  it("returns fallback text model for not found", () => {
    assert.deepEqual(buildRoastOgNotFoundModel(), {
      scoreText: "--/10",
      verdictLabel: "not_found",
      metadataText: "unknown • 0 lines",
      quoteText: "this roast could not be found",
    });
  });

  it("returns fallback text model for render errors", () => {
    assert.deepEqual(buildRoastOgRenderErrorModel(), {
      scoreText: "--/10",
      verdictLabel: "render_error",
      metadataText: "unknown • 0 lines",
      quoteText: "something went wrong generating this roast preview",
    });
  });
});
