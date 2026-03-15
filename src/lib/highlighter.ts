import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import type { HighlighterCore, LanguageInput } from "shiki/types";
import { LANGUAGE_MAP, PRELOADED_LANGUAGES } from "./languages";

// Singleton — created once, reused across all editor instances
let highlighterPromise: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighterCore({
      themes: [import("shiki/themes/vesper.mjs")],
      langs: PRELOADED_LANGUAGES.map((l) => l.load as LanguageInput),
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }
  return highlighterPromise;
}

/**
 * Ensures the grammar for `langValue` is loaded in the highlighter.
 * No-ops if already loaded or if langValue is "text" (plain text sentinel).
 */
export async function ensureLanguage(
  highlighter: HighlighterCore,
  langValue: string
): Promise<void> {
  if (langValue === "text") return;

  const loaded = highlighter.getLoadedLanguages();
  if (loaded.includes(langValue)) return;

  const lang = LANGUAGE_MAP.get(langValue);
  if (!lang) return;

  await highlighter.loadLanguage(lang.load as LanguageInput);
}
