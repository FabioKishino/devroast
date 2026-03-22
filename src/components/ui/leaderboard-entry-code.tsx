"use client";

import { Collapsible } from "@base-ui/react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";
import { twMerge } from "tailwind-merge";

const COLLAPSED_HEIGHT = 120;
const COLLAPSIBLE_THRESHOLD = 5;

type LeaderboardEntryCodeProps = Omit<ComponentProps<"div">, "children"> & {
  children: ReactNode;
  lineCount: number;
};

export function LeaderboardEntryCode({
  children,
  lineCount,
  className,
  ...props
}: LeaderboardEntryCodeProps) {
  const [open, setOpen] = useState(false);

  if (lineCount < COLLAPSIBLE_THRESHOLD) {
    return (
      <div
        className={twMerge(
          "border border-border-primary bg-bg-input px-4 py-3",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <Collapsible.Root
      open={open}
      onOpenChange={setOpen}
      className={twMerge(
        "group flex flex-col border border-border-primary bg-bg-input",
        className
      )}
      {...props}
    >
      <div
        className="relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "none" : COLLAPSED_HEIGHT }}
      >
        <div className="px-4 py-3">{children}</div>
        {!open && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-bg-input to-transparent" />
        )}
      </div>

      <Collapsible.Trigger className="flex items-center justify-center gap-1.5 h-8 border-t border-border-primary font-secondary text-xs text-text-tertiary hover:text-text-secondary hover:bg-bg-elevated transition-colors">
        <span className="group-data-[open]:hidden">show more</span>
        <span className="hidden group-data-[open]:inline">show less</span>
        <span className="inline-block text-xs transition-transform group-data-[open]:rotate-180">
          ⌄
        </span>
      </Collapsible.Trigger>
    </Collapsible.Root>
  );
}
