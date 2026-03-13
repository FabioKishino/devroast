"use client";

import { Toggle as BaseToggle } from "@base-ui/react";
import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { tv } from "tailwind-variants";

const toggleWrapper = tv({
  base: "inline-flex cursor-default select-none items-center gap-3",
});

const toggleButton = tv({
  base: [
    "relative inline-flex h-[22px] w-10 shrink-0 rounded-full border border-border-primary",
    "cursor-pointer transition-colors duration-150",
    "bg-border-primary",
    "data-[pressed]:bg-accent-green data-[pressed]:border-accent-green",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-green focus-visible:ring-offset-2 focus-visible:ring-offset-bg-page",
    "group",
  ],
});

const toggleLabel = tv({
  base: "font-mono text-xs text-text-secondary group-data-[pressed]:text-accent-green",
});

type ToggleProps = Omit<ComponentProps<typeof BaseToggle>, "className"> & {
  label?: string;
  className?: string;
};

export function Toggle({ label, className, ...props }: ToggleProps) {
  return (
    <div className={toggleWrapper({ className })}>
      <BaseToggle className={toggleButton()} {...props}>
        <span
          className={twMerge(
            "pointer-events-none absolute top-[3px] left-[3px] size-4 rounded-full",
            "bg-text-secondary transition-all duration-150",
            "group-data-[pressed]:translate-x-[18px] group-data-[pressed]:bg-bg-page"
          )}
        />
      </BaseToggle>
      {label && <span className={toggleLabel()}>{label}</span>}
    </div>
  );
}
