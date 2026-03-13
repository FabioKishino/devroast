# Component Authoring Guidelines — `src/components/ui`

These rules apply to every component created in this folder.
All future components must follow these patterns consistently.

---

## 1. Named exports only

Never use `export default`. Every component and type must be a named export.

```tsx
// correct
export function Button() {}
export type ButtonProps = ...

// wrong
export default function Button() {}
```

---

## 2. Extend native HTML props via `ComponentProps`

Always extend the native element's props using `ComponentProps<"element">` from React.
This ensures every native attribute (`onClick`, `disabled`, `aria-*`, `data-*`, etc.)
is available without manual declaration.

```tsx
import type { ComponentProps } from "react";

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof button>;
```

---

## 3. Use `tailwind-variants` (`tv`) for all variants

Define variants with `tv()`. Never use plain string concatenation or conditional
`clsx`/`cx` calls to compose classes.

```tsx
import { tv, type VariantProps } from "tailwind-variants";

const button = tv({
  base: ["...base classes"],
  variants: {
    variant: { primary: "...", secondary: "..." },
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: {
    variant: "primary",
    size: "md",
  },
});
```

- Group related classes in arrays for readability (base states, hover, focus).
- Always define `defaultVariants` so every prop is optional at the call site.

---

## 4. Pass `className` directly into `tv()` — do not use `twMerge`

`tailwind-variants` handles class merging internally. Pass `className` as a
property of the `tv()` call alongside `variant` and `size`. Do not wrap the
result with `twMerge`.

```tsx
// correct
<button className={button({ variant, size, className })} {...props} />

// wrong
<button className={twMerge(button({ variant, size }), className)} {...props} />
```

---

## 5. Destructure variant props explicitly

Destructure `variant`, `size` (and any other `tv` props) explicitly from the
component props so they are not forwarded to the DOM element via `{...props}`.

```tsx
export function Button({
  variant,
  size,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button className={button({ variant, size, className })} {...props}>
      {children}
    </button>
  );
}
```

---

## 6. Import order

Follow the Biome import organizer order (enforced automatically on `npm run check`):

1. `react` type imports
2. Third-party libraries
3. Internal aliases (`@/...`)
4. Relative imports

---

## 7. No string interpolation or `.join()` for class composition

Never compose Tailwind classes via template literals or array `.join(" ")`.
Always use `twMerge` when combining classes outside a `tv()` context (e.g. when
a dynamic class must be merged with static ones inside JSX).

```tsx
// correct
import { twMerge } from "tailwind-merge";
<span className={twMerge("font-mono font-bold", dynamicColorClass)} />

// wrong
<span className={`font-mono font-bold ${dynamicColorClass}`} />
<span className={["font-mono", "font-bold", dynamicColorClass].join(" ")} />
```

Inside `tv()` definitions, always delegate merging to `tailwind-variants` by
passing `className` directly into the `tv()` call — do not use `twMerge` there.

---

## 8. Use design token classes — never hardcode hex values

All colors must come from the Tailwind design tokens defined in `src/app/globals.css`
via the `@theme` directive. Never use arbitrary hex values like `text-[#FAFAFA]`
or Tailwind palette classes like `text-emerald-500`.

### Available tokens

| Class prefix | CSS variable | Value |
|---|---|---|
| `accent-green` | `--color-accent-green` | `#10B981` |
| `accent-red` | `--color-accent-red` | `#EF4444` |
| `accent-amber` | `--color-accent-amber` | `#F59E0B` |
| `bg-page` | `--color-bg-page` | `#0A0A0A` |
| `bg-surface` | `--color-bg-surface` | `#0F0F0F` |
| `bg-input` | `--color-bg-input` | `#111111` |
| `bg-elevated` | `--color-bg-elevated` | `#1A1A1A` |
| `border-primary` | `--color-border-primary` | `#2A2A2A` |
| `border-focus` | `--color-border-focus` | `#10B981` |
| `text-primary` | `--color-text-primary` | `#FAFAFA` |
| `text-secondary` | `--color-text-secondary` | `#6B7280` |
| `text-tertiary` | `--color-text-tertiary` | `#4B5563` |
| `diff-added-bg` | `--color-diff-added-bg` | `#0A1A0F` |
| `diff-removed-bg` | `--color-diff-removed-bg` | `#1A0A0A` |

**Usage examples:**

```tsx
// correct
"bg-accent-green text-bg-page"
"border-border-primary text-text-secondary"

// wrong
"bg-emerald-500 text-[#0A0A0A]"
"border-[#2A2A2A] text-[#6B7280]"
```

---

## 9. Use design token font classes — never hardcode font families

Two fonts are loaded via `next/font/google` and exposed as Tailwind utilities
through CSS variables registered in `src/app/globals.css`:

| Class | CSS variable | Font | Usage |
|---|---|---|---|
| `font-mono` | `--font-mono` | JetBrains Mono | All UI labels, headings, badges, buttons, code, toggles |
| `font-secondary` | `--font-secondary` | IBM Plex Mono | Description / body text (e.g. `AnalysisCard` description) |

Never use `font-sans` inside `ui/` components. Never hardcode a font family with
an arbitrary value like `font-['JetBrains_Mono']`.

```tsx
// correct
<span className="font-mono text-sm">$ deploy</span>
<p className="font-secondary text-xs leading-relaxed">description text</p>

// wrong
<span className="font-sans text-sm">$ deploy</span>
<p className="font-['IBM_Plex_Mono'] text-xs">description text</p>
```

---

## 10. Use `@base-ui/react` for interactive primitives

For components requiring accessible interactive behavior (toggles, checkboxes,
dialogs, etc.), use `@base-ui/react` instead of building from scratch.

- Add `"use client"` at the top of any file using base-ui primitives.
- Style via `data-[state]` attributes that base-ui sets (e.g. `data-[pressed]`).
- Use Tailwind `group` on the primitive + `group-data-[pressed]:` to style children
  based on parent state.

```tsx
"use client";
import { Toggle as BaseToggle } from "@base-ui/react";

// track turns green when pressed:
"data-[pressed]:bg-accent-green data-[pressed]:border-accent-green"

// child thumb shifts right when parent is pressed:
"group-data-[pressed]:translate-x-4 group-data-[pressed]:bg-bg-page"
```

---

## 11. Async Server Components for data-fetching UI

Components that perform async operations (e.g. syntax highlighting) must be
`async` functions and are Server Components by default (no `"use client"`).

```tsx
// correct — CodeBlock is a Server Component
export async function CodeBlock({ code, lang }: CodeBlockProps) {
  const html = await codeToHtml(code, { lang, theme: "vesper" });
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

---

## 12. Composition pattern for compound components

When a component has distinct visual "parts" (header, title, body, row, footer),
break it into named sub-components instead of encoding everything in props.

### Rules

- Each part is a separate named export (e.g. `AnalysisCardRoot`, not dot notation like `AnalysisCard.Root`).
- The root wrapper accepts `children` and `className`; structural variants (border, padding) live here.
- Leaf parts (`Title`, `Description`, `Row`, etc.) accept `className` and `children` like any HTML element.
- Use `twMerge` to merge static base classes with the caller's `className` in leaf parts (no `tv()` needed unless variants exist).
- Data that was previously hardcoded inside the component (e.g. `ROWS`) moves to the call site (page or feature file).

### Example — AnalysisCard

```tsx
// analysis-card.tsx — three named exports
export function AnalysisCardRoot({ className, children, ...props }: ComponentProps<"div">) {
  return <div className={root({ className })} {...props}>{children}</div>;
}
export function AnalysisCardTitle({ className, children, ...props }: ComponentProps<"p">) {
  return <p className={twMerge("text-sm font-normal text-text-primary font-mono", className)} {...props}>{children}</p>;
}
export function AnalysisCardDescription({ className, children, ...props }: ComponentProps<"p">) {
  return <p className={twMerge("font-secondary text-xs leading-relaxed text-text-secondary", className)} {...props}>{children}</p>;
}

// usage
<AnalysisCardRoot className="max-w-[480px]">
  <Badge variant="critical">critical</Badge>
  <AnalysisCardTitle>using var instead of const/let</AnalysisCardTitle>
  <AnalysisCardDescription>the var keyword is function-scoped…</AnalysisCardDescription>
</AnalysisCardRoot>
```

### Example — LeaderboardTable

```tsx
// leaderboard-table.tsx — five named exports
export function LeaderboardTableRoot(...)  // <div className="flex flex-col gap-6">
export function LeaderboardTableHeader(...) // title + view_all link + subtitle
export function LeaderboardTableGrid(...)  // bordered wrapper + column headers + children slot
export function LeaderboardTableRow(...)   // single data row; accepts isLast prop to suppress bottom border
export function LeaderboardTableFooter(...) // "showing top N of …" hint

// usage (data lives in the caller)
const ROWS = [...]
<LeaderboardTableRoot>
  <LeaderboardTableHeader />
  <LeaderboardTableGrid>
    {ROWS.map((row, i) => (
      <LeaderboardTableRow key={row.rank} {...row} isLast={i === ROWS.length - 1} />
    ))}
  </LeaderboardTableGrid>
  <LeaderboardTableFooter />
</LeaderboardTableRoot>
```

### When NOT to compose

Primitive components with no internal parts stay as-is:
`button.tsx`, `badge.tsx`, `toggle.tsx`, `diff-line.tsx`, `score-ring.tsx`, `code-block.tsx`

---

## Reference implementations

| Component | Pattern demonstrated |
|---|---|
| `button.tsx` | `tv()` variants, token colors, `ComponentProps` |
| `badge.tsx` | Simple variants, token colors, `font-mono` |
| `toggle.tsx` | `@base-ui/react`, `"use client"`, `data-[pressed]`, `group` |
| `analysis-card.tsx` | Composition pattern (Rule 12), `font-secondary` for description |
| `leaderboard-table.tsx` | Composition pattern (Rule 12), `isLast` prop, data at call site |
| `score-ring.tsx` | SVG component, inline style for dynamic values, no `tv()` needed |
| `code-block.tsx` | Async Server Component, `shiki` + vesper theme |
| `diff-line.tsx` | Token colors for diff backgrounds (`diff-added-bg`, `diff-removed-bg`) |
