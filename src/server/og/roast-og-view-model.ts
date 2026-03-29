export type RoastOgModel = {
  scoreText: string;
  verdictLabel: string;
  metadataText: string;
  quoteText: string;
};

type BuildRoastOgModelInput = {
  score: number;
  language: string;
  linesCount: number;
  roastQuote: string | null;
};

export function toVerdictLabel(score: number): string {
  if (!Number.isFinite(score)) {
    return "needs_serious_help";
  }

  if (score <= 3) {
    return "needs_serious_help";
  }

  if (score <= 6) {
    return "room_for_improvement";
  }

  if (score <= 8) {
    return "solid_work";
  }

  return "clean_code_machine";
}

export function sanitizeQuote(value: string | null): string {
  if (!value) {
    return "";
  }

  return value
    .replace(/[\t\r\n]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function truncateQuote(value: string | null, maxChars = 120): string {
  const sanitized = sanitizeQuote(value);

  if (sanitized.length <= maxChars) {
    return sanitized;
  }

  return `${sanitized.slice(0, maxChars)}...`;
}

export function buildRoastOgModel(input: BuildRoastOgModelInput): RoastOgModel {
  const quoteText = truncateQuote(input.roastQuote);

  return {
    scoreText: `${input.score}/10`,
    verdictLabel: toVerdictLabel(input.score),
    metadataText: `${input.language} • ${input.linesCount} lines`,
    quoteText: quoteText || "no roast quote available.",
  };
}

export function buildRoastOgNotFoundModel(): RoastOgModel {
  return {
    scoreText: "--/10",
    verdictLabel: "not_found",
    metadataText: "unknown • 0 lines",
    quoteText: "this roast could not be found",
  };
}

export function buildRoastOgRenderErrorModel(): RoastOgModel {
  return {
    scoreText: "--/10",
    verdictLabel: "render_error",
    metadataText: "unknown • 0 lines",
    quoteText: "something went wrong generating this roast preview",
  };
}
