import Link from "next/link";
import type { ComponentProps } from "react";

export function Navbar({ ...props }: ComponentProps<"header">) {
  return (
    <header
      className="w-full h-14 flex items-center justify-between px-10 bg-bg-page border-b border-border-primary shrink-0"
      {...props}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 no-underline">
        <span className="font-mono text-xl font-bold text-accent-green leading-none">
          {">"}
        </span>
        <span className="font-secondary text-lg font-medium text-text-primary leading-none">
          devroast
        </span>
      </Link>

      {/* Nav right */}
      <nav className="flex items-center gap-6">
        <Link
          href="/leaderboard"
          className="font-secondary text-sm text-text-secondary hover:text-text-primary transition-colors"
        >
          leaderboard
        </Link>
      </nav>
    </header>
  );
}
