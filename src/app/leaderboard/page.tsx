import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { CodeBlock } from "@/components/ui/code-block";
import {
  LeaderboardEntryMeta,
  LeaderboardEntryRoot,
} from "@/components/ui/leaderboard-entry";
import { LeaderboardEntryCode } from "@/components/ui/leaderboard-entry-code";
import { caller } from "@/trpc/server";

// ── Metadata (SSR) ────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "Shame Leaderboard — devroast",
  description:
    "The most roasted code on the internet, ranked by shame. Browse the worst code submissions and their brutal AI feedback scores.",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function LeaderboardPage() {
  "use cache";
  cacheLife("hours");

  const [entries, stats] = await Promise.all([
    caller.leaderboard.topShame({ limit: 20 }),
    caller.leaderboard.stats(),
  ]);

  return (
    <main className="flex flex-col w-full max-w-360 mx-auto px-20 py-10 gap-10">
      {/* Hero section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-mono text-3xl font-bold text-text-primary">
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
              {stats.totalCount.toLocaleString("en-US")} submissions
            </span>
            <span className="font-secondary text-xs text-text-tertiary">·</span>
            <span className="font-secondary text-xs text-text-tertiary">
              avg score: {stats.avgScore.toFixed(1)}/10
            </span>
          </div>
        </div>
      </section>

      {/* Entries */}
      <section className="flex flex-col gap-5 w-full">
        {entries.length === 0 ? (
          <LeaderboardEntryRoot>
            <div className="px-5 py-6 font-secondary text-sm text-text-secondary">
              {"// no roasted submissions yet"}
            </div>
          </LeaderboardEntryRoot>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardEntryRoot key={entry.id}>
              <LeaderboardEntryMeta
                rank={index + 1}
                score={entry.score}
                language={entry.language}
                linesCount={entry.linesCount}
              />
              <LeaderboardEntryCode lineCount={entry.linesCount}>
                <CodeBlock code={entry.code} lang={entry.language} />
              </LeaderboardEntryCode>
            </LeaderboardEntryRoot>
          ))
        )}
      </section>
    </main>
  );
}
