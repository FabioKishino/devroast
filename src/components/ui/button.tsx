import type { ComponentProps } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: [
    "inline-flex items-center justify-center gap-2",
    "font-mono font-medium",
    "cursor-pointer transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
  ],
  variants: {
    variant: {
      primary: [
        "bg-accent-green text-bg-page",
        "enabled:hover:bg-accent-green/80",
        "focus-visible:ring-accent-green",
      ],
      secondary: [
        "bg-bg-page text-accent-green border border-border-primary",
        "enabled:hover:bg-bg-elevated",
        "focus-visible:ring-border-primary",
      ],
      outline: [
        "border border-accent-green text-accent-green bg-transparent",
        "enabled:hover:bg-accent-green/10",
        "focus-visible:ring-accent-green",
      ],
      ghost: [
        "bg-transparent text-text-primary",
        "enabled:hover:bg-bg-elevated",
        "focus-visible:ring-border-primary",
      ],
      danger: [
        "bg-accent-red text-white",
        "enabled:hover:bg-accent-red/80",
        "focus-visible:ring-accent-red",
      ],
    },
    size: {
      sm: "text-xs py-1.5 px-4",
      md: "text-sm py-2.5 px-6",
      lg: "text-sm py-3 px-8",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>;

export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={button({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
