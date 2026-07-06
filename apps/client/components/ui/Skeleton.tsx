export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-5 px-5 py-[14px]">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-3 bg-surface-3 rounded animate-pulse"
          style={{ flex: i === 0 ? 2 : 1, opacity: Math.max(0.3, 1 - i * 0.15) }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="font-sans text-[13px] text-red mb-1">Failed to load data</p>
      <p className="font-mono text-[11px] text-label-3 mb-4 max-w-sm leading-relaxed">{message}</p>
      <button
        onClick={onRetry}
        className="font-mono text-[11px] text-yellow hover:opacity-80 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}
