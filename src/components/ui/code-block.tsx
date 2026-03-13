import { codeToHtml } from "shiki";

type CodeBlockProps = {
  code: string;
  lang?: string;
  className?: string;
};

export async function CodeBlock({
  code,
  lang = "typescript",
  className,
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang,
    theme: "vesper",
  });

  return (
    <div
      className={[
        "overflow-x-auto rounded-lg font-mono text-sm",
        "[&>pre]:p-4",
        className ?? "",
      ]
        .join(" ")
        .trim()}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
