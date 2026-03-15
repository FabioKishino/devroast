import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeaderboardEntryData = {
  rank: number;
  score: number;
  language: string;
  linesCount: number;
  code: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function scoreColorClass(score: number): string {
  if (score >= 7) return "text-accent-green";
  if (score >= 4) return "text-accent-amber";
  return "text-accent-red";
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function LeaderboardEntryRoot({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={twMerge(
        "flex flex-col border border-border-primary w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ── Meta Row ──────────────────────────────────────────────────────────────────

type LeaderboardEntryMetaProps = Omit<ComponentProps<"div">, "children"> & {
  rank: number;
  score: number;
  language: string;
  linesCount: number;
};

export function LeaderboardEntryMeta({
  rank,
  score,
  language,
  linesCount,
  className,
  ...props
}: LeaderboardEntryMetaProps) {
  return (
    <div
      className={twMerge(
        "flex items-center justify-between h-12 px-5 border-b border-border-primary",
        className
      )}
      {...props}
    >
      {/* Left: rank + score */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-text-tertiary">#</span>
          <span className="font-mono text-sm font-bold text-accent-amber">
            {rank}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-text-tertiary">score:</span>
          <span
            className={twMerge(
              "font-mono text-sm font-bold",
              scoreColorClass(score)
            )}
          >
            {score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Right: language + line count */}
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs text-text-secondary">
          {language}
        </span>
        <span className="font-mono text-xs text-text-tertiary">
          {linesCount} {linesCount === 1 ? "line" : "lines"}
        </span>
      </div>
    </div>
  );
}
