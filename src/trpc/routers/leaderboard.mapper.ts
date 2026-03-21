type TopShameDbRow = {
  id: string;
  score: number | string;
  code: string;
  language: string;
  linesCount?: number;
};

function toFiniteScore(value: number | string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return parsed;
}

export function mapTopShameRow(row: TopShameDbRow) {
  const lines = row.code === "" ? [] : row.code.split(/\r?\n/);

  return {
    id: row.id,
    score: toFiniteScore(row.score),
    code: row.code,
    language: row.language,
    linesCount: row.linesCount ?? lines.length,
    codeLines: lines.slice(0, 3),
  };
}
