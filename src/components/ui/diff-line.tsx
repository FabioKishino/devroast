import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const diffLine = tv({
  base: "flex items-start gap-2 px-4 py-2 font-mono text-[13px]",
  variants: {
    variant: {
      added: "bg-diff-added-bg text-text-primary",
      removed: "bg-diff-removed-bg text-text-secondary",
      context: "bg-transparent text-text-secondary",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

const diffPrefix = tv({
  base: "w-3 shrink-0 select-none",
  variants: {
    variant: {
      added: "text-accent-green",
      removed: "text-accent-red",
      context: "text-text-tertiary",
    },
  },
  defaultVariants: {
    variant: "context",
  },
});

const prefixChar: Record<"added" | "removed" | "context", string> = {
  added: "+",
  removed: "-",
  context: " ",
};

type DiffLineProps = ComponentProps<"div"> &
  VariantProps<typeof diffLine> & {
    children: React.ReactNode;
  };

export function DiffLine({
  variant,
  className,
  children,
  ...props
}: DiffLineProps) {
  const v = variant ?? "context";
  return (
    <div className={diffLine({ variant, className })} {...props}>
      <span className={diffPrefix({ variant })}>{prefixChar[v]}</span>
      <span className="flex-1 whitespace-pre">{children}</span>
    </div>
  );
}
