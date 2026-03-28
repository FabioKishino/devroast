import type { ComponentProps } from "react";
import { codeToHtml } from "shiki";
import { twMerge } from "tailwind-merge";

// ── Header ────────────────────────────────────────────────────────────────────

type CodeBlockHeaderProps = Omit<ComponentProps<"div">, "children"> & {
  filename?: string;
  right?: React.ReactNode;
};

export function CodeBlockHeader({
  filename,
  right,
  className,
  ...props
}: CodeBlockHeaderProps) {
  return (
    <div
      className={twMerge(
        "flex items-center justify-between h-10 px-4 border-b border-border-primary shrink-0",
        className
      )}
      {...props}
    >
      {/* Traffic light dots */}
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-accent-red" />
        <span className="size-3 rounded-full bg-accent-amber" />
        <span className="size-3 rounded-full bg-accent-green" />
        {filename && (
          <span className="font-mono text-xs text-text-tertiary ml-2">
            {filename}
          </span>
        )}
      </div>

      {right && <div className="flex items-center">{right}</div>}
    </div>
  );
}

// ── Block ─────────────────────────────────────────────────────────────────────

type CodeBlockProps = {
  code: string;
  lang?: string;
  className?: string;
};

function isUnsupportedLanguageError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /language.+(not found|not included|invalid|unsupported)/i.test(
    error.message
  );
}

export async function CodeBlock({
  code,
  lang = "typescript",
  className,
}: CodeBlockProps) {
  let html: string;

  try {
    html = await codeToHtml(code, {
      lang,
      theme: "vesper",
    });
  } catch (error) {
    if (!isUnsupportedLanguageError(error)) {
      throw error;
    }

    html = await codeToHtml(code, {
      lang: "plaintext",
      theme: "vesper",
    });
  }

  return (
    <div
      className={twMerge(
        "font-mono text-sm",
        "[&>pre]:overflow-x-auto [&>pre]:scrollbar-thin",
        "[&>pre]:p-4",
        "[&>pre]:![background:transparent]",
        className
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
