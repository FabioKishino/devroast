import type { Metadata } from "next";
import {
  LeaderboardEntryCode,
  type LeaderboardEntryData,
  LeaderboardEntryMeta,
  LeaderboardEntryRoot,
} from "@/components/ui/leaderboard-entry";

// ── Metadata (SSR) ────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Shame Leaderboard — devroast",
  description:
    "The most roasted code on the internet, ranked by shame. Browse the worst code submissions and their brutal AI feedback scores.",
};

// ── Static data ───────────────────────────────────────────────────────────────

const ENTRIES: LeaderboardEntryData[] = [
  {
    rank: 1,
    score: 1.2,
    language: "javascript",
    linesCount: 3,
    codeLines: [
      'eval(prompt("enter code"))',
      "document.write(response)",
      "// trust the user lol",
    ],
  },
  {
    rank: 2,
    score: 1.8,
    language: "javascript",
    linesCount: 3,
    codeLines: [
      "if (x == true) { return true; }",
      "else if (x == false) { return false; }",
      "else { return !false; }",
    ],
  },
  {
    rank: 3,
    score: 2.1,
    language: "sql",
    linesCount: 2,
    codeLines: ["SELECT * FROM users WHERE 1=1", "-- TODO: add authentication"],
  },
  {
    rank: 4,
    score: 2.3,
    language: "java",
    linesCount: 3,
    codeLines: ["catch (e) {", "  // ignore", "}"],
  },
  {
    rank: 5,
    score: 2.5,
    language: "javascript",
    linesCount: 3,
    codeLines: [
      "const sleep = (ms) =>",
      "  new Date(Date.now() + ms)",
      "  while(new Date() < end) {}",
    ],
  },
];

const TOTAL_SUBMISSIONS = 2847;
const AVG_SCORE = 4.2;

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  return (
    <main className="flex flex-col w-full max-w-[1440px] mx-auto px-20 py-10 gap-10">
      {/* Hero section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-secondary text-3xl font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>

          {/* Subtitle */}
          <p className="font-secondary text-sm text-text-secondary">
            {"// the most roasted code on the internet"}
          </p>

          {/* Stats */}
          <div className="flex items-center gap-2">
            <span className="font-secondary text-xs text-text-tertiary">
              {TOTAL_SUBMISSIONS.toLocaleString("en-US")} submissions
            </span>
            <span className="font-secondary text-xs text-text-tertiary">·</span>
            <span className="font-secondary text-xs text-text-tertiary">
              avg score: {AVG_SCORE}/10
            </span>
          </div>
        </div>
      </section>

      {/* Entries */}
      <section className="flex flex-col gap-5 w-full">
        {ENTRIES.map((entry) => (
          <LeaderboardEntryRoot key={entry.rank}>
            <LeaderboardEntryMeta
              rank={entry.rank}
              score={entry.score}
              language={entry.language}
              linesCount={entry.linesCount}
            />
            <LeaderboardEntryCode codeLines={entry.codeLines} />
          </LeaderboardEntryRoot>
        ))}
      </section>
    </main>
  );
}
