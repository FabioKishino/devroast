import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

// Score is 0–10. Color thresholds:
// < 4.0  → accent-red
// 4.0–6.9 → accent-amber
// ≥ 7.0  → accent-green

const BOX = 180;
const STROKE = 4;
const RADIUS = (BOX - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = BOX / 2;

type ScoreColor = "green" | "amber" | "red";

function scoreColor(score: number): ScoreColor {
  if (score >= 7) return "green";
  if (score >= 4) return "amber";
  return "red";
}

const colorMap: Record<ScoreColor, { stroke: string; text: string }> = {
  green: {
    stroke: "var(--color-accent-green)",
    text: "text-accent-green",
  },
  amber: {
    stroke: "var(--color-accent-amber)",
    text: "text-accent-amber",
  },
  red: {
    stroke: "var(--color-accent-red)",
    text: "text-accent-red",
  },
};

const wrapper = tv({
  base: "relative inline-flex shrink-0",
});

export type ScoreRingProps = Omit<ComponentProps<"div">, "children"> & {
  score: number;
};

export function ScoreRing({ score, className, ...props }: ScoreRingProps) {
  const color = scoreColor(score);
  const { stroke: arcColor, text: textClass } = colorMap[color];

  const fill = Math.max(0, Math.min(1, score / 10));
  const dashOffset = CIRCUMFERENCE * (1 - fill);

  return (
    <div
      className={wrapper({ className })}
      style={{ width: BOX, height: BOX }}
      {...props}
    >
      <svg
        width={BOX}
        height={BOX}
        viewBox={`0 0 ${BOX} ${BOX}`}
        fill="none"
        role="img"
        aria-label={`Score: ${score.toFixed(1)} out of 10`}
      >
        {/* Background track */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke="var(--color-border-primary)"
          strokeWidth={STROKE}
        />
        {/* Score arc */}
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          stroke={arcColor}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
      </svg>

      {/* Center label */}
      <div className="absolute inset-0 flex items-center justify-center gap-0.5">
        <span
          className={twMerge("font-mono font-bold leading-none", textClass)}
          style={{ fontSize: 48 }}
        >
          {score.toFixed(1)}
        </span>
        <span
          className="font-mono font-normal leading-none text-text-tertiary"
          style={{ fontSize: 16 }}
        >
          /10
        </span>
      </div>
    </div>
  );
}
