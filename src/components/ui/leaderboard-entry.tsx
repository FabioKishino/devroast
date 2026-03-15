import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

// ── Types ─────────────────────────────────────────────────────────────────────

export type LeaderboardEntryData = {
  rank: number;
  score: number;
  language: string;
  linesCount: number;
  codeLines: string[];
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

// ── Code Preview ──────────────────────────────────────────────────────────────

type LeaderboardEntryCodeProps = Omit<ComponentProps<"div">, "children"> & {
  codeLines: string[];
};

export function LeaderboardEntryCode({
  codeLines,
  className,
  ...props
}: LeaderboardEntryCodeProps) {
  return (
    <div
      className={twMerge(
        "flex h-[120px] bg-bg-input overflow-hidden",
        className
      )}
      {...props}
    >
      {/* Line numbers */}
      <div className="flex flex-col gap-1.5 pt-3.5 pb-3.5 px-2.5 bg-bg-surface border-r border-border-primary w-10 shrink-0 items-end">
        {codeLines.map((line) => (
          <span
            key={`ln-${line}`}
            className="font-secondary text-xs text-text-tertiary leading-[1.625]"
          >
            {codeLines.indexOf(line) + 1}
          </span>
        ))}
      </div>

      {/* Code content */}
      <div className="flex flex-col gap-1.5 pt-3.5 pb-3.5 px-4 flex-1 overflow-hidden">
        {codeLines.map((line) => (
          <span
            key={`code-${line}`}
            className={twMerge(
              "font-secondary text-xs leading-[1.625] truncate",
              line.startsWith("//") || line.startsWith("--")
                ? "text-text-tertiary"
                : "text-text-primary"
            )}
          >
            {line}
          </span>
        ))}
      </div>
    </div>
  );
}
