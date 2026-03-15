"use client";

import {
  type ComponentProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { twMerge } from "tailwind-merge";
import { ensureLanguage, getHighlighter } from "@/lib/highlighter";
import { detectLanguage } from "@/lib/language-detect";
import { LANGUAGE_OPTIONS } from "@/lib/languages";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CodeEditorRootProps = {
  defaultCode?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
};

// ---------------------------------------------------------------------------
// CodeEditorRoot — state owner, layout shell
// ---------------------------------------------------------------------------

export function CodeEditorRoot({
  defaultCode = "",
  onCodeChange,
  className,
}: CodeEditorRootProps) {
  const [code, setCode] = useState(defaultCode);
  // null = auto-detect mode; string = user-selected override
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string>("text");
  // Initialize with plain-text so something is visible immediately on mount
  const [highlightedHtml, setHighlightedHtml] = useState<string>(
    defaultCode
      ? `<pre style="margin:0;padding:0">${escapeHtml(defaultCode)}</pre>`
      : ""
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLanguage = selectedLanguage ?? detectedLanguage;

  // Notify parent whenever code changes
  const handleCodeChange = useCallback(
    (newCode: string) => {
      setCode(newCode);
      onCodeChange?.(newCode);

      // Auto-detect with debounce (only when in auto mode)
      if (selectedLanguage === null) {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          setDetectedLanguage(detectLanguage(newCode));
        }, 300);
      }
    },
    [selectedLanguage, onCodeChange]
  );

  // Run initial detection on mount only — intentionally ignoring dep changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    if (defaultCode && selectedLanguage === null) {
      setDetectedLanguage(detectLanguage(defaultCode));
    }
  }, []);

  // Produce highlighted HTML whenever code or active language changes
  useEffect(() => {
    let cancelled = false;

    async function highlight() {
      const plainHtml = `<pre style="margin:0;padding:0">${escapeHtml(code)}</pre>`;

      // Plain text sentinel — no highlighting needed
      if (activeLanguage === "text" || !code.trim()) {
        if (!cancelled) setHighlightedHtml(plainHtml);
        return;
      }

      // Show plain text immediately so code is visible while the highlighter loads
      if (!cancelled) setHighlightedHtml(plainHtml);

      try {
        const hl = await getHighlighter();
        await ensureLanguage(hl, activeLanguage);
        if (cancelled) return;

        const html = hl.codeToHtml(code, {
          lang: activeLanguage,
          theme: "vesper",
        });
        if (!cancelled) setHighlightedHtml(html);
      } catch {
        // On any error keep the plain text already shown
      }
    }

    highlight();
    return () => {
      cancelled = true;
    };
  }, [code, activeLanguage]);

  return (
    <div
      className={twMerge(
        "flex flex-col border border-border-primary bg-bg-input w-full",
        className
      )}
    >
      <CodeEditorHeader
        activeLanguage={activeLanguage}
        selectedLanguage={selectedLanguage}
        detectedLanguage={detectedLanguage}
        onLanguageChange={setSelectedLanguage}
      />
      <CodeEditorBody
        code={code}
        highlightedHtml={highlightedHtml}
        onCodeChange={handleCodeChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeEditorHeader — window chrome + language select
// ---------------------------------------------------------------------------

type CodeEditorHeaderProps = {
  activeLanguage: string;
  selectedLanguage: string | null;
  detectedLanguage: string;
  onLanguageChange: (lang: string | null) => void;
  className?: string;
};

export function CodeEditorHeader({
  selectedLanguage,
  detectedLanguage,
  onLanguageChange,
  className,
}: CodeEditorHeaderProps) {
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      onLanguageChange(val === "" ? null : val);
    },
    [onLanguageChange]
  );

  // The label shown for the auto-detect option includes the detected lang
  const autoLabel =
    detectedLanguage === "text"
      ? "Auto-detect"
      : `Auto-detect (${LANGUAGE_OPTIONS.find((l) => l.value === detectedLanguage)?.label ?? detectedLanguage})`;

  return (
    <div
      className={twMerge(
        "flex items-center justify-between h-10 px-4 border-b border-border-primary shrink-0",
        className
      )}
    >
      {/* Traffic light dots */}
      <div className="flex items-center gap-2">
        <span className="size-3 rounded-full bg-accent-red" />
        <span className="size-3 rounded-full bg-accent-amber" />
        <span className="size-3 rounded-full bg-accent-green" />
      </div>

      {/* Language selector */}
      <select
        value={selectedLanguage ?? ""}
        onChange={handleSelectChange}
        className="bg-bg-elevated border border-border-primary text-text-secondary font-mono text-xs px-2 py-1 outline-none cursor-pointer hover:border-border-focus transition-colors"
        aria-label="Select language"
      >
        <option value="">{autoLabel}</option>
        {LANGUAGE_OPTIONS.filter((l) => l.value !== null).map((l) => (
          <option key={l.value} value={l.value ?? ""}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CodeEditorBody — gutter + textarea/overlay
// ---------------------------------------------------------------------------

type CodeEditorBodyProps = ComponentProps<"div"> & {
  code: string;
  highlightedHtml: string;
  onCodeChange: (code: string) => void;
};

export function CodeEditorBody({
  code,
  highlightedHtml,
  onCodeChange,
  className,
  ...props
}: CodeEditorBodyProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLPreElement>(null);

  const lineCount = code ? code.split("\n").length : 1;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Sync scroll between textarea, overlay, and gutter
  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    const gutter = gutterRef.current;
    const overlay = overlayRef.current;
    if (!ta) return;
    if (gutter) gutter.scrollTop = ta.scrollTop;
    if (overlay) {
      overlay.scrollTop = ta.scrollTop;
      overlay.scrollLeft = ta.scrollLeft;
    }
  }, []);

  return (
    <div className={twMerge("flex h-96", className)} {...props}>
      {/* Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="flex flex-col w-12 shrink-0 bg-bg-surface border-r border-border-primary px-3 py-4 overflow-hidden"
      >
        {lineNumbers.map((n) => (
          <span
            key={n}
            className="font-secondary text-xs text-text-tertiary leading-relaxed text-right block"
          >
            {n}
          </span>
        ))}
      </div>

      {/* Editor area: textarea on top of highlighted overlay */}
      <div className="relative flex-1 overflow-hidden">
        {/* Highlighted code overlay */}
        <pre
          ref={overlayRef}
          aria-hidden="true"
          data-code-overlay
          // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          className="absolute inset-0 font-secondary text-xs p-4 m-0 overflow-hidden pointer-events-none whitespace-pre [&>pre]:m-0 [&>pre]:p-0 [&>pre]:bg-transparent! [&>pre]:font-secondary [&>pre]:text-xs [&>pre>code]:font-secondary [&>pre>code]:text-xs [&>pre>code]:block"
          style={{ lineHeight: "1.625" }}
        />

        {/* Editable textarea — transparent text, visible caret */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onCodeChange(e.target.value)}
          onScroll={handleScroll}
          className="absolute inset-0 w-full h-full bg-transparent font-secondary text-xs p-4 resize-none outline-none text-transparent caret-text-primary z-10 whitespace-pre"
          style={{
            lineHeight: "1.625",
            caretColor: "var(--color-text-primary)",
          }}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          aria-label="Code input"
          aria-multiline="true"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
