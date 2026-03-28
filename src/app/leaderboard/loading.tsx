import {
  LeaderboardEntryMeta,
  LeaderboardEntryRoot,
} from "@/components/ui/leaderboard-entry";

const SKELETON_ROWS = [1, 2, 3, 4, 5];

export default function Loading() {
  return (
    <main className="flex flex-col w-full max-w-360 mx-auto px-20 py-10 gap-10">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-3xl font-bold text-accent-green">
              {">"}
            </span>
            <h1 className="font-mono text-3xl font-bold text-text-primary">
              shame_leaderboard
            </h1>
          </div>

          <p className="font-secondary text-sm text-text-secondary opacity-60">
            {"// loading the most roasted code on the internet..."}
          </p>

          <div className="flex items-center gap-2 opacity-50">
            <span className="font-secondary text-xs text-text-tertiary">
              loading submissions
            </span>
            <span className="font-secondary text-xs text-text-tertiary">.</span>
            <span className="font-secondary text-xs text-text-tertiary">
              loading average score
            </span>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5 w-full">
        {SKELETON_ROWS.map((rank, index) => (
          <LeaderboardEntryRoot key={rank} className="opacity-40">
            <LeaderboardEntryMeta
              rank={rank}
              score={0}
              language="-"
              linesCount={2}
            />

            <div className="bg-bg-input px-5 py-4 flex flex-col gap-2 border-t border-border-primary">
              <div className="h-4 w-2/3 bg-bg-elevated" />
              <div className="h-4 w-1/2 bg-bg-elevated" />
            </div>

            {index !== SKELETON_ROWS.length - 1 && (
              <div className="h-px w-full bg-border-primary" />
            )}
          </LeaderboardEntryRoot>
        ))}
      </section>
    </main>
  );
}
