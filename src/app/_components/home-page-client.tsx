"use client";

import { type ReactNode, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { CodeEditorRoot } from "@/components/ui/code-editor";
import { Toggle } from "@/components/ui/toggle";
import { createRoastAction } from "../_actions/create-roast-action";

const MAX_CODE_LENGTH = 20000;

const PLACEHOLDER_CODE = `function calculateTotal(items) {
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
}`;

type HomePageClientProps = {
  stats: ReactNode;
  leaderboard: ReactNode;
};

export function HomePageClient({ stats, leaderboard }: HomePageClientProps) {
  const [code, setCode] = useState(PLACEHOLDER_CODE);
  const [language, setLanguage] = useState("text");
  const [roastMode, setRoastMode] = useState(true);
  const [actionState, formAction] = useActionState(
    async (state: { error?: string } | undefined, formData: FormData) => {
      return createRoastAction(state ?? null, formData);
    },
    undefined
  );
  const isOverLimit = code.length > MAX_CODE_LENGTH;
  const isSubmitDisabled = !code.trim() || isOverLimit;

  return (
    <main className="min-h-screen bg-bg-page">
      <div className="max-w-3xl mx-auto px-10 pt-20 pb-16 flex flex-col gap-8">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3">
            <span className="font-mono text-4xl font-bold text-accent-green leading-none">
              $
            </span>
            <span className="font-secondary text-4xl font-bold text-text-primary leading-none">
              paste your code. get roasted.
            </span>
          </div>
          <p className="font-secondary text-sm text-text-secondary">
            {
              "// drop your code below and we'll rate it — brutally honest or full roast mode"
            }
          </p>
        </div>

        {/* ── Code Editor ──────────────────────────────────── */}
        <CodeEditorRoot
          defaultCode={PLACEHOLDER_CODE}
          onCodeChange={setCode}
          onLanguageChange={setLanguage}
          maxLength={MAX_CODE_LENGTH}
        />

        {/* ── Actions Bar ──────────────────────────────────── */}
        <form action={formAction} className="flex flex-col gap-2 w-full">
          <input type="hidden" name="code" value={code} />
          <input
            type="hidden"
            name="roastMode"
            value={roastMode ? "true" : "false"}
          />
          <input type="hidden" name="language" value={language} />

          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <Toggle
                label="roast mode"
                pressed={roastMode}
                onPressedChange={setRoastMode}
              />
              <span className="font-secondary text-xs text-text-tertiary">
                {"// maximum sarcasm enabled"}
              </span>
            </div>
            <SubmitButton disabled={isSubmitDisabled} />
          </div>

          {actionState?.error ? (
            <p
              className="font-secondary text-xs text-accent-red"
              role="alert"
              aria-live="polite"
            >
              {actionState.error}
            </p>
          ) : null}
        </form>

        {/* ── Footer hint ──────────────────────────────────── */}
        {stats}

        {/* ── Spacer ───────────────────────────────────────── */}
        <div className="h-16" />

        {/* ── Leaderboard Preview ──────────────────────────── */}
        {leaderboard}
      </div>
    </main>
  );
}

type SubmitButtonProps = {
  disabled: boolean;
};

function SubmitButton({ disabled }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button variant="primary" size="md" disabled={disabled || pending}>
      {pending ? "$ roasting..." : "$ roast_my_code"}
    </Button>
  );
}
