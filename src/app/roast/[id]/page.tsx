import { cacheLife } from "next/cache";
import { notFound } from "next/navigation";
import {
  AnalysisCardDescription,
  AnalysisCardRoot,
  AnalysisCardTitle,
} from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { CodeBlock, CodeBlockHeader } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { ScoreRing } from "@/components/ui/score-ring";
import { caller } from "@/trpc/server";

// ── Page ───────────────────────────────────────────────────────────────────────

type RoastResultPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function toVerdict(score: number): string {
  if (score <= 3) return "needs_serious_help";
  if (score <= 6) return "room_for_improvement";
  if (score <= 8) return "solid_work";
  return "clean_code_machine";
}

export default async function RoastResultPage({
  params,
}: RoastResultPageProps) {
  "use cache";
  cacheLife("hours");

  const { id } = await params;
  const roast = await caller.roast.byId({ id });

  if (!roast) {
    notFound();
  }

  const verdict = toVerdict(roast.score);

  return (
    <main className="flex flex-col gap-10 px-20 py-10">
      {/* 1. Score Hero */}
      <section className="flex items-center gap-12">
        <ScoreRing score={roast.score} />

        <div className="flex flex-col gap-4">
          <Badge variant="critical">verdict: {verdict}</Badge>

          <p className="font-secondary text-xl leading-relaxed text-text-primary">
            {roast.roastQuote ?? "no roast quote available."}
          </p>

          <div className="flex items-center gap-4">
            <span className="font-mono text-xs text-text-tertiary">
              lang: {roast.language}
            </span>
            <span className="font-mono text-xs text-text-tertiary">
              {roast.linesCount} lines
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
          <CodeBlockHeader filename={`submitted_code.${roast.language}`} />
          <div className="flex-1 overflow-auto">
            <CodeBlock code={roast.code} lang={roast.language} />
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
          {roast.analysisItems.map((item) => (
            <AnalysisCardRoot key={item.id}>
              <Badge variant={item.severity}>{item.severity}</Badge>
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

          {roast.diffSuggestions.map((line) => (
            <DiffLine key={line.id} variant={line.lineType}>
              {line.content}
            </DiffLine>
          ))}
        </div>
      </section>
    </main>
  );
}
