import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

const root = tv({
  base: ["flex flex-col gap-3 border border-border-primary", "p-5 font-mono"],
});

export function AnalysisCardRoot({
  className,
  children,
  ...props
}: ComponentProps<"div">) {
  return (
    <div className={root({ className })} {...props}>
      {children}
    </div>
  );
}

export function AnalysisCardTitle({
  className,
  children,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={twMerge(
        "text-sm font-normal text-text-primary font-mono",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}

export function AnalysisCardDescription({
  className,
  children,
  ...props
}: ComponentProps<"p">) {
  return (
    <p
      className={twMerge(
        "font-secondary text-xs leading-relaxed text-text-secondary",
        className
      )}
      {...props}
    >
      {children}
    </p>
  );
}
