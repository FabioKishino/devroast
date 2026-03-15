export type Language = {
  label: string;
  value: string;
  load: () => Promise<unknown>;
};

export type LanguageOption = { label: "Auto-detect"; value: null } | Language;

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "Auto-detect", value: null },
  {
    label: "TypeScript",
    value: "typescript",
    load: () => import("shiki/langs/typescript.mjs"),
  },
  {
    label: "JavaScript",
    value: "javascript",
    load: () => import("shiki/langs/javascript.mjs"),
  },
  {
    label: "TSX",
    value: "tsx",
    load: () => import("shiki/langs/tsx.mjs"),
  },
  {
    label: "JSX",
    value: "jsx",
    load: () => import("shiki/langs/jsx.mjs"),
  },
  {
    label: "Python",
    value: "python",
    load: () => import("shiki/langs/python.mjs"),
  },
  {
    label: "Go",
    value: "go",
    load: () => import("shiki/langs/go.mjs"),
  },
  {
    label: "Rust",
    value: "rust",
    load: () => import("shiki/langs/rust.mjs"),
  },
  {
    label: "Java",
    value: "java",
    load: () => import("shiki/langs/java.mjs"),
  },
  {
    label: "C",
    value: "c",
    load: () => import("shiki/langs/c.mjs"),
  },
  {
    label: "C++",
    value: "cpp",
    load: () => import("shiki/langs/cpp.mjs"),
  },
  {
    label: "C#",
    value: "csharp",
    load: () => import("shiki/langs/csharp.mjs"),
  },
  {
    label: "PHP",
    value: "php",
    load: () => import("shiki/langs/php.mjs"),
  },
  {
    label: "Ruby",
    value: "ruby",
    load: () => import("shiki/langs/ruby.mjs"),
  },
  {
    label: "Swift",
    value: "swift",
    load: () => import("shiki/langs/swift.mjs"),
  },
  {
    label: "Kotlin",
    value: "kotlin",
    load: () => import("shiki/langs/kotlin.mjs"),
  },
  {
    label: "Bash",
    value: "bash",
    load: () => import("shiki/langs/bash.mjs"),
  },
  {
    label: "SQL",
    value: "sql",
    load: () => import("shiki/langs/sql.mjs"),
  },
  {
    label: "JSON",
    value: "json",
    load: () => import("shiki/langs/json.mjs"),
  },
  {
    label: "YAML",
    value: "yaml",
    load: () => import("shiki/langs/yaml.mjs"),
  },
  {
    label: "HTML",
    value: "html",
    load: () => import("shiki/langs/html.mjs"),
  },
  {
    label: "CSS",
    value: "css",
    load: () => import("shiki/langs/css.mjs"),
  },
  {
    label: "Markdown",
    value: "markdown",
    load: () => import("shiki/langs/markdown.mjs"),
  },
  // "text" is a sentinel value — no grammar loaded, raw code displayed as-is
  { label: "Plain text", value: "text", load: async () => {} },
];

// Fast lookup: shiki lang value → Language entry
export const LANGUAGE_MAP = new Map(
  LANGUAGE_OPTIONS.filter((l): l is Language => l.value !== null).map((l) => [
    l.value,
    l,
  ])
);

// Preloaded at highlighter init — most common languages
const PRELOAD_KEYS = ["typescript", "javascript", "python", "bash"] as const;
export const PRELOADED_LANGUAGES: Language[] = PRELOAD_KEYS.flatMap((key) => {
  const lang = LANGUAGE_MAP.get(key);
  return lang ? [lang] : [];
});
