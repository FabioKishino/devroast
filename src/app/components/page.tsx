import { cacheLife } from "next/cache";
import {
  AnalysisCardDescription,
  AnalysisCardRoot,
  AnalysisCardTitle,
} from "@/components/ui/analysis-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import {
  LeaderboardTableGrid,
  LeaderboardTableRow,
} from "@/components/ui/leaderboard-table";
import { ScoreRing } from "@/components/ui/score-ring";
import { Toggle } from "@/components/ui/toggle";

function Section({
  title,
  children,
  column = false,
}: {
  title: string;
  children: React.ReactNode;
  column?: boolean;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-xs font-medium uppercase tracking-widest text-text-tertiary">
        {title}
      </h2>
      <div
        className={
          column ? "flex flex-col gap-3" : "flex flex-wrap items-center gap-4"
        }
      >
        {children}
      </div>
    </section>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm font-bold text-accent-green">
        {"//"}
      </span>
      <span className="font-mono text-sm font-bold text-text-primary">
        {children}
      </span>
    </div>
  );
}

function Divider() {
  return <hr className="border-border-primary" />;
}

const sampleCode = `function greet(name: string): string {
  return \`Hello, \${name}!\`;
}

const result = greet("DevRoast");
console.log(result);`;

export default async function ComponentsPage() {
  "use cache";
  cacheLife("hours");

  return (
    <main className="min-h-screen bg-bg-page px-20 py-16">
      <div className="mx-auto flex max-w-4xl flex-col gap-16">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold text-accent-green">
              {"//"}
            </span>
            <h1 className="font-mono text-2xl font-bold text-text-primary">
              component_library
            </h1>
          </div>
          <p className="font-secondary text-sm text-text-secondary">
            Visual preview of all UI components and their variants.
          </p>
        </header>

        <Divider />

        {/* ── Typography ─────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>typography</SectionTitle>
          <div className="flex flex-col gap-4">
            <p className="font-mono text-4xl font-bold text-text-primary">
              paste your code. get roasted.
            </p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-accent-green">
                {"//"}
              </span>
              <span className="font-mono text-sm font-bold text-text-primary">
                detailed_analysis
              </span>
            </div>
            <p className="font-secondary text-sm text-text-secondary">
              description text sample
            </p>
            <p className="font-mono text-xs text-text-tertiary">
              lang: javascript · 7 lines
            </p>
            <p className="font-mono text-sm text-accent-amber">
              function calculateTotal()
            </p>
          </div>
        </div>

        <Divider />

        {/* ── Button ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>buttons</SectionTitle>
          <Section title="variant">
            <Button variant="primary">$ roast_my_code</Button>
            <Button variant="secondary">$ share_roast</Button>
            <Button variant="outline">$ view_all &gt;&gt;</Button>
            <Button variant="ghost">$ cancel</Button>
            <Button variant="danger">$ delete</Button>
          </Section>
          <Section title="size">
            <Button size="sm">$ small</Button>
            <Button size="md">$ medium</Button>
            <Button size="lg">$ large</Button>
          </Section>
          <Section title="disabled">
            <Button variant="primary" disabled>
              $ roast_my_code
            </Button>
            <Button variant="secondary" disabled>
              $ share_roast
            </Button>
            <Button variant="outline" disabled>
              $ view_all
            </Button>
            <Button variant="ghost" disabled>
              $ cancel
            </Button>
            <Button variant="danger" disabled>
              $ delete
            </Button>
          </Section>
        </div>

        <Divider />

        {/* ── Toggle ─────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>toggle</SectionTitle>
          <Section title="states">
            <Toggle label="roast mode" />
            <Toggle label="roast mode" defaultPressed />
          </Section>
        </div>

        <Divider />

        {/* ── Badge ──────────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>badge_status</SectionTitle>
          <Section title="variant">
            <Badge variant="critical">critical</Badge>
            <Badge variant="warning">warning</Badge>
            <Badge variant="good">good</Badge>
            <Badge variant="critical">needs_serious_help</Badge>
          </Section>
        </div>

        <Divider />

        {/* ── AnalysisCard ───────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>cards</SectionTitle>
          <AnalysisCardRoot className="max-w-[480px]">
            <Badge variant="critical">critical</Badge>
            <AnalysisCardTitle>
              using var instead of const/let
            </AnalysisCardTitle>
            <AnalysisCardDescription>
              the var keyword is function-scoped rather than block-scoped, which
              can lead to unexpected behavior and bugs. modern javascript uses
              const for immutable bindings and let for mutable ones.
            </AnalysisCardDescription>
          </AnalysisCardRoot>
        </div>

        <Divider />

        {/* ── CodeBlock ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>code_block</SectionTitle>
          <CodeBlock
            code={sampleCode}
            lang="typescript"
            className="w-[560px]"
          />
        </div>

        <Divider />

        {/* ── DiffLine ───────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>diff_line</SectionTitle>
          <div className="w-[560px]">
            <DiffLine variant="removed">var total = 0;</DiffLine>
            <DiffLine variant="added">const total = 0;</DiffLine>
            <DiffLine variant="context">
              {"for (let i = 0; i < items.length; i++) {"}
            </DiffLine>
          </div>
        </div>

        <Divider />

        {/* ── LeaderboardTableRow ─────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>leaderboard_row</SectionTitle>
          <LeaderboardTableGrid className="max-w-2xl">
            <LeaderboardTableRow
              rank={1}
              score={2.1}
              codeLines={[
                "function calculateTotal(items) {",
                "  var total = 0;",
                "  // TODO: fix this later",
              ]}
              language="javascript"
            />
            <LeaderboardTableRow
              rank={2}
              score={5.4}
              codeLines={[
                "const fetchUser = async (id) => {",
                "  const res = await fetch(`/api/users/{id}`);",
              ]}
              language="typescript"
            />
            <LeaderboardTableRow
              rank={3}
              score={8.7}
              codeLines={[
                "def calculate_average(numbers):",
                "  return sum(numbers) / len(numbers)",
              ]}
              language="python"
              isLast
            />
          </LeaderboardTableGrid>
        </div>

        <Divider />

        {/* ── ScoreRing ──────────────────────────────── */}
        <div className="flex flex-col gap-6">
          <SectionTitle>score_ring</SectionTitle>
          <Section title="scores — critical / warning / good">
            <ScoreRing score={2.1} />
            <ScoreRing score={5.4} />
            <ScoreRing score={8.7} />
          </Section>
        </div>
      </div>
    </main>
  );
}
