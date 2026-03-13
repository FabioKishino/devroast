"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LeaderboardTableFooter,
  LeaderboardTableGrid,
  LeaderboardTableHeader,
  LeaderboardTableRoot,
  LeaderboardTableRow,
} from "@/components/ui/leaderboard-table";
import { Toggle } from "@/components/ui/toggle";

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

const LINE_COUNT = 16;

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

export default function HomePage() {
  const [code, setCode] = useState(PLACEHOLDER_CODE);

  const lineNumbers = Array.from({ length: LINE_COUNT }, (_, i) => i + 1);

  return (
    <main className="min-h-screen bg-bg-page">
      <div className="max-w-5xl mx-auto px-10 pt-20 pb-16 flex flex-col gap-8">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-bold text-accent-green leading-none">
              $
            </span>
            <span className="font-mono text-4xl font-bold text-text-primary leading-none">
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
        <div className="flex flex-col border border-border-primary bg-bg-input max-w-3xl w-full mx-auto">
          {/* Window header */}
          <div className="flex items-center h-10 px-4 border-b border-border-primary shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-accent-red" />
              <span className="size-3 rounded-full bg-accent-amber" />
              <span className="size-3 rounded-full bg-accent-green" />
            </div>
          </div>

          {/* Code area */}
          <div className="flex h-96">
            {/* Line numbers */}
            <div className="flex flex-col gap-2 w-12 shrink-0 bg-bg-surface border-r border-border-primary px-3 py-4">
              {lineNumbers.map((n) => (
                <span
                  key={n}
                  className="font-mono text-xs text-text-tertiary leading-none text-right"
                >
                  {n}
                </span>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              className="flex-1 bg-bg-input font-mono text-xs text-text-secondary p-4 resize-none outline-none leading-relaxed placeholder:text-text-tertiary"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Code input"
            />
          </div>
        </div>

        {/* ── Actions Bar ──────────────────────────────────── */}
        <div className="flex items-center justify-between max-w-3xl w-full mx-auto">
          <div className="flex items-center gap-4">
            <Toggle label="roast mode" defaultPressed />
            <span className="font-secondary text-xs text-text-tertiary">
              {"// maximum sarcasm enabled"}
            </span>
          </div>
          <Button variant="primary" size="md" disabled={!code.trim()}>
            $ roast_my_code
          </Button>
        </div>

        {/* ── Footer hint ──────────────────────────────────── */}
        <div className="flex items-center justify-center gap-6 max-w-3xl w-full mx-auto">
          <span className="font-secondary text-xs text-text-tertiary">
            2,847 codes roasted
          </span>
          <span className="font-mono text-xs text-text-tertiary">·</span>
          <span className="font-secondary text-xs text-text-tertiary">
            avg score: 4.2/10
          </span>
        </div>

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
