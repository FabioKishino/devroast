import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const badge = tv({
  base: "inline-flex items-center gap-2 font-mono text-xs font-normal",
  variants: {
    variant: {
      critical: "text-accent-red",
      warning: "text-accent-amber",
      good: "text-accent-green",
    },
  },
  defaultVariants: {
    variant: "good",
  },
});

const dot = tv({
  base: "size-2 rounded-full shrink-0",
  variants: {
    variant: {
      critical: "bg-accent-red",
      warning: "bg-accent-amber",
      good: "bg-accent-green",
    },
  },
  defaultVariants: {
    variant: "good",
  },
});

type BadgeProps = ComponentProps<"span"> &
  VariantProps<typeof badge> & {
    children: React.ReactNode;
  };

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  return (
    <span className={badge({ variant, className })} {...props}>
      <span className={dot({ variant })} aria-hidden />
      {children}
    </span>
  );
}
