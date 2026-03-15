import {
  AnalysisCardDescription,
  AnalysisCardRoot,
  AnalysisCardTitle,
} from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock, CodeBlockHeader } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";

// ── Static mock data ───────────────────────────────────────────────────────────

const ROAST = {
  score: 3.5,
  verdict: "needs_serious_help",
  quote:
    "this code looks like it was written during a power outage... in 2005.",
  lang: "javascript",
  lines: 7,
  code: `function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  if (total > 100) {
    console.log("discount applied");
    total = total * 0.9;
  }
  // TODO: handle tax calculation
  // TODO: handle currency conversion
  return total;
}`,
  analysis: [
    {
      badge: "critical" as const,
      title: "using var instead of const/let",
      description:
        "var is function-scoped and leads to hoisting bugs. use const by default, let when reassignment is needed.",
    },
    {
      badge: "warning" as const,
      title: "imperative loop pattern",
      description:
        "for loops are verbose and error-prone. use .reduce() or .map() for cleaner, functional transformations.",
    },
    {
      badge: "good" as const,
      title: "clear naming conventions",
      description:
        "calculateTotal and items are descriptive, self-documenting names that communicate intent without comments.",
    },
    {
      badge: "good" as const,
      title: "single responsibility",
      description:
        "the function does one thing well — calculates a total. no side effects, no mixed concerns, no hidden complexity.",
    },
  ],
  diff: [
    { variant: "context" as const, code: "function calculateTotal(items) {" },
    { variant: "removed" as const, code: "  var total = 0;" },
    {
      variant: "removed" as const,
      code: "  for (var i = 0; i < items.length; i++) {",
    },
    {
      variant: "removed" as const,
      code: "    total = total + items[i].price;",
    },
    { variant: "removed" as const, code: "  }" },
    { variant: "removed" as const, code: "  return total;" },
    {
      variant: "added" as const,
      code: "  return items.reduce((sum, item) => sum + item.price, 0);",
    },
    { variant: "context" as const, code: "}" },
  ],
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default async function RoastResultPage() {
  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* 1. Score Hero */}
      <section className="flex items-center gap-12">
        <ScoreRing score={ROAST.score} />

        <div className="flex flex-col gap-4">
          <Badge variant="critical">verdict: {ROAST.verdict}</Badge>

          <p className="font-secondary text-xl leading-relaxed text-text-primary">
            {ROAST.quote}
          </p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-tertiary">
              lang: {ROAST.lang}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {ROAST.lines} lines
            </span>
          </div>

          <button
            type="button"
            className="self-start border border-border-primary px-4 py-2 font-mono text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            $ share_roast
          </button>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none bg-border-primary h-px" />

      {/* 2. Submitted Code */}
      <section className="flex flex-col gap-4">
        <p className="font-mono text-sm font-bold">
          <span className="text-accent-green">{"// "}</span>
          <span className="text-text-primary">your_submission</span>
        </p>

        <div className="flex flex-col border border-border-primary bg-bg-input h-[424px] overflow-hidden">
          <CodeBlockHeader filename="submitted_code.js" />
          <div className="flex-1 overflow-auto">
            <CodeBlock code={ROAST.code} lang="javascript" />
          </div>
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none bg-border-primary h-px" />

      {/* 3. Analysis */}
      <section className="flex flex-col gap-6">
        <p className="font-mono text-sm font-bold">
          <span className="text-accent-green">{"// "}</span>
          <span className="text-text-primary">detailed_analysis</span>
        </p>

        <div className="grid grid-cols-2 gap-5">
          {ROAST.analysis.map((item) => (
            <AnalysisCardRoot key={item.title}>
              <Badge variant={item.badge}>{item.badge}</Badge>
              <AnalysisCardTitle>{item.title}</AnalysisCardTitle>
              <AnalysisCardDescription>
                {item.description}
              </AnalysisCardDescription>
            </AnalysisCardRoot>
          ))}
        </div>
      </section>

      {/* Divider */}
      <hr className="border-none bg-border-primary h-px" />

      {/* 4. Suggested Fix (Diff) */}
      <section className="flex flex-col gap-6">
        <p className="font-mono text-sm font-bold">
          <span className="text-accent-green">{"// "}</span>
          <span className="text-text-primary">suggested_fix</span>
        </p>

        <div className="flex flex-col border border-border-primary bg-bg-input">
          <div className="flex items-center h-10 px-4 border-b border-border-primary">
            <span className="font-mono text-xs text-text-secondary">
              your_code.ts → improved_code.ts
            </span>
          </div>

          {ROAST.diff.map((line, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static ordered diff lines
            <DiffLine key={i} variant={line.variant}>
              {line.code}
            </DiffLine>
          ))}
        </div>
      </section>
    </main>
  );
}
