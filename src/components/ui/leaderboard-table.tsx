import Link from "next/link";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { CodeBlock } from "./code-block";
import { LeaderboardEntryCode } from "./leaderboard-entry-code";

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
      className={twMerge("flex flex-col gap-5 w-full", className)}
      {...props}
    >
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
  language: string;
  isLast?: boolean;
} & (
    | { codeLines: string[]; code?: never }
    | { code: string; codeLines?: never }
  );

export async function LeaderboardTableRow({
  rank,
  score,
  codeLines,
  code,
  language,
  isLast = false,
  className,
  ...props
}: LeaderboardTableRowProps) {
  // Se code está presente, renderizar com syntax highlighting
  if (code) {
    const lineCount = code.split("\n").length;

    return (
      <div
        className={twMerge(
          "flex flex-col border border-border-primary overflow-hidden",
          !isLast && "border-b border-border-primary",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-text-tertiary">#</span>
              <span className="font-mono text-sm font-bold text-accent-amber">
                {rank}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs text-text-tertiary">
                score:
              </span>
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

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-text-secondary">
              {language}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
        </div>

        <LeaderboardEntryCode lineCount={lineCount}>
          <CodeBlock
            code={code}
            lang={language}
            className="[&>pre]:w-full [&>pre]:p-0 [&>pre]:bg-transparent [&>pre]:text-xs [&>pre]:leading-tight"
          />
        </LeaderboardEntryCode>
      </div>
    );
  }

  // Caso fallback para skeleton (usa codeLines simples)
  return (
    <div
      className={twMerge(
        "flex flex-col border border-border-primary overflow-hidden",
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between h-12 px-5 border-b border-border-primary">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 bg-bg-elevated animate-pulse rounded-sm" />
            <span className="inline-block w-4 h-3 bg-bg-elevated animate-pulse rounded-sm" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-10 h-3 bg-bg-elevated animate-pulse rounded-sm" />
            <span className="inline-block w-6 h-3 bg-bg-elevated animate-pulse rounded-sm" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block w-16 h-3 bg-bg-elevated animate-pulse rounded-sm" />
          <span className="inline-block w-14 h-3 bg-bg-elevated animate-pulse rounded-sm" />
        </div>
      </div>

      <div className="flex flex-col gap-2 p-4 bg-bg-input">
        <div className="flex flex-col gap-0.5">
          {codeLines?.[0] === "—" ? (
            <>
              <span className="inline-block w-4/5 h-3 bg-bg-elevated animate-pulse rounded-sm" />
              <span className="inline-block w-3/5 h-3 bg-bg-elevated animate-pulse rounded-sm" />
              <span className="inline-block w-2/3 h-3 bg-bg-elevated animate-pulse rounded-sm" />
              <span className="inline-block w-1/2 h-3 bg-bg-elevated animate-pulse rounded-sm" />
            </>
          ) : (
            codeLines?.map((line) => (
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
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

export function LeaderboardTableFooter({
  totalCount = 2847,
  className,
  ...props
}: Omit<ComponentProps<"div">, "children"> & { totalCount?: number }) {
  return (
    <div className={twMerge("flex justify-center py-4", className)} {...props}>
      <Link
        href="/leaderboard"
        className="font-secondary text-xs text-text-tertiary hover:text-text-secondary transition-colors"
      >
        {`showing top 3 of ${totalCount.toLocaleString()} · view full leaderboard >>`}
      </Link>
    </div>
  );
}
