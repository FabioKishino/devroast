"use client";

import { type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import { CodeEditorRoot } from "@/components/ui/code-editor";
import {
  LeaderboardTableFooter,
  LeaderboardTableGrid,
  LeaderboardTableHeader,
  LeaderboardTableRoot,
  LeaderboardTableRow,
} from "@/components/ui/leaderboard-table";
import { Toggle } from "@/components/ui/toggle";

const MAX_CODE_LENGTH = 2000;

const PLACEHOLDER_CODE = `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }

  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }

  // TODO: handle tax calculation
  // TODO: handle currency conversion

  return total;
}`;

type LeaderboardRow = {
  rank: number;
  score: number;
  codeLines: string[];
  language: string;
};

const ROWS: LeaderboardRow[] = [
  {
    rank: 1,
    score: 1.2,
    codeLines: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ],
    language: "javascript",
  },
  {
    rank: 2,
    score: 1.8,
    codeLines: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ],
    language: "typescript",
  },
  {
    rank: 3,
    score: 2.1,
    codeLines: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"],
    language: "sql",
  },
];

type HomePageClientProps = {
  stats: ReactNode;
};

export function HomePageClient({ stats }: HomePageClientProps) {
  const [code, setCode] = useState(PLACEHOLDER_CODE);
  const isOverLimit = code.length > MAX_CODE_LENGTH;

  return (
    <main className="min-h-screen bg-bg-page">
      <div className="max-w-3xl mx-auto px-10 pt-20 pb-16 flex flex-col gap-8">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-bold text-accent-green leading-none">
              $
            </span>
            <span className="font-secondary text-4xl font-bold text-text-primary leading-none">
              paste your code. get roasted.
            </span>
          </div>
          <p className="font-secondary text-sm text-text-secondary">
            {
              "// drop your code below and we'll rate it — brutally honest or full roast mode"
            }
          </p>
        </div>

        {/* ── Code Editor ──────────────────────────────────── */}
        <CodeEditorRoot
          defaultCode={PLACEHOLDER_CODE}
          onCodeChange={setCode}
          maxLength={MAX_CODE_LENGTH}
        />

        {/* ── Actions Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <Toggle label="roast mode" defaultPressed />
            <span className="font-secondary text-xs text-text-tertiary">
              {"// maximum sarcasm enabled"}
            </span>
          </div>
          <Button
            variant="primary"
            size="md"
            disabled={!code.trim() || isOverLimit}
          >
            $ roast_my_code
          </Button>
        </div>

        {/* ── Footer hint ──────────────────────────────────── */}
        {stats}

        {/* ── Spacer ───────────────────────────────────────── */}
        <div className="h-16" />

        {/* ── Leaderboard Preview ──────────────────────────── */}
        <LeaderboardTableRoot>
          <LeaderboardTableHeader />
          <LeaderboardTableGrid>
            {ROWS.map((row, i) => (
              <LeaderboardTableRow
                key={row.rank}
                rank={row.rank}
                score={row.score}
                codeLines={row.codeLines}
                language={row.language}
                isLast={i === ROWS.length - 1}
              />
            ))}
          </LeaderboardTableGrid>
          <LeaderboardTableFooter />
        </LeaderboardTableRoot>
      </div>
    </main>
  );
}
