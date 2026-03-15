import hljs from "highlight.js";
import { LANGUAGE_MAP } from "./languages";

// highlight.js → Shiki lang value normalization map
// hljs uses different identifiers for some languages
const HLJS_TO_SHIKI: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  cs: "csharp",
  "c++": "cpp",
  md: "markdown",
  xml: "html",
};

// Only detect among languages that exist in our supported list
const DETECTION_LANGUAGES = Array.from(LANGUAGE_MAP.keys()).flatMap((v) => {
  // Map Shiki values back to hljs names (inverse of HLJS_TO_SHIKI where needed)
  if (v === "javascript") return ["javascript", "js"];
  if (v === "typescript") return ["typescript", "ts"];
  if (v === "python") return ["python", "py"];
  if (v === "bash") return ["bash", "sh"];
  if (v === "yaml") return ["yaml", "yml"];
  if (v === "csharp") return ["cs", "csharp"];
  if (v === "cpp") return ["cpp", "c++"];
  if (v === "markdown") return ["markdown", "md"];
  return [v];
});

/**
 * Detects the most likely language for `code` using highlight.js heuristics.
 * Returns a Shiki-compatible language value string.
 * Falls back to "text" (plain text sentinel) when confidence is low.
 */
export function detectLanguage(code: string): string {
  if (!code.trim()) return "text";

  const result = hljs.highlightAuto(code, DETECTION_LANGUAGES);
  const detected = result.language;

  if (!detected) return "text";

  // Normalize hljs name → Shiki value
  const normalized = HLJS_TO_SHIKI[detected] ?? detected;

  // Only return if it's actually in our supported map
  return LANGUAGE_MAP.has(normalized) ? normalized : "text";
}
