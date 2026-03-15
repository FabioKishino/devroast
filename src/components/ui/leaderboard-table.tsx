import Link from "next/link";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

// ── Root ─────────────────────────────────────────────────────────────────────

export function LeaderboardTableRoot({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={twMerge("flex flex-col gap-6", className)} {...props}>
      {children}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────

export function LeaderboardTableHeader({
  className,
  ...props
}: Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={twMerge("flex flex-col gap-3", className)} {...props}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="font-secondary text-sm font-bold text-accent-green">
            {"//"}
          </span>
          <span className="font-secondary text-sm font-bold text-text-primary">
            shame_leaderboard
          </span>
        </div>
        <Link
          href="/leaderboard"
          className="flex items-center font-secondary text-xs text-text-secondary hover:text-text-primary transition-colors border border-border-primary px-3 py-1.5"
        >
          {"$ view_all >>"}
        </Link>
      </div>
      <p className="font-secondary text-sm text-text-tertiary">
        {"// the worst code on the internet, ranked by shame"}
      </p>
    </div>
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

export function LeaderboardTableGrid({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={twMerge("border border-border-primary w-full", className)}
      {...props}
    >
      {/* Column headers */}
      <div className="flex items-center h-10 px-5 bg-bg-surface border-b border-border-primary">
        <span className="font-secondary text-xs font-medium text-text-tertiary w-12 shrink-0">
          #
        </span>
        <span className="font-secondary text-xs font-medium text-text-tertiary w-16 shrink-0">
          score
        </span>
        <span className="font-secondary text-xs font-medium text-text-tertiary flex-1">
          code
        </span>
        <span className="font-secondary text-xs font-medium text-text-tertiary w-24 shrink-0 text-right">
          lang
        </span>
      </div>
      {children}
    </div>
  );
}

// ── Row ───────────────────────────────────────────────────────────────────────

function scoreColorClass(score: number): string {
  if (score >= 7) return "text-accent-green";
  if (score >= 4) return "text-accent-amber";
  return "text-accent-red";
}

type LeaderboardTableRowProps = Omit<ComponentProps<"div">, "children"> & {
  rank: number;
  score: number;
  codeLines: string[];
  language: string;
  isLast?: boolean;
};

export function LeaderboardTableRow({
  rank,
  score,
  codeLines,
  language,
  isLast = false,
  className,
  ...props
}: LeaderboardTableRowProps) {
  return (
    <div
      className={twMerge(
        "flex items-start p-4 px-5 hover:bg-bg-elevated transition-colors",
        !isLast && "border-b border-border-primary",
        className
      )}
      {...props}
    >
      <span className="font-secondary text-xs text-text-secondary w-12 shrink-0 pt-0.5">
        {rank}
      </span>
      <span
        className={twMerge(
          "font-secondary text-xs font-bold w-16 shrink-0 pt-0.5",
          scoreColorClass(score)
        )}
      >
        {score.toFixed(1)}
      </span>
      <div className="flex flex-col gap-0.5 flex-1">
        {codeLines.map((line) => (
          <span
            key={line}
            className={twMerge(
              "font-secondary text-xs",
              line.startsWith("//") || line.startsWith("--")
                ? "text-text-tertiary"
                : "text-text-primary"
            )}
          >
            {line}
          </span>
        ))}
      </div>
      <span className="font-secondary text-xs text-text-secondary w-24 shrink-0 text-right pt-0.5">
        {language}
      </span>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function LeaderboardTableFooter({
  className,
  ...props
}: Omit<ComponentProps<"div">, "children">) {
  return (
    <div className={twMerge("flex justify-center py-4", className)} {...props}>
      <Link
        href="/leaderboard"
        className="font-secondary text-xs text-text-tertiary hover:text-text-secondary transition-colors"
      >
        {"showing top 3 of 2,847 · view full leaderboard >>"}
      </Link>
    </div>
  );
}
