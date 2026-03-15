export function StatsSkeleton() {
  return (
    <div className="flex items-center justify-center gap-6">
      <span className="font-secondary text-xs text-text-tertiary opacity-40">
        — codes roasted
      </span>
      <span className="font-mono text-xs text-text-tertiary opacity-40">·</span>
      <span className="font-secondary text-xs text-text-tertiary opacity-40">
        avg score: —/10
      </span>
    </div>
  );
}
