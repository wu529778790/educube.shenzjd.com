interface SkeletonProps {
  /** 是否展示卡片骨架网格 */
  showCards?: boolean;
}

export default function Skeleton({ showCards = false }: SkeletonProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--edu-bg)" }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-xl mx-auto mb-4 flex items-center justify-center animate-pulse"
          style={{ background: "var(--edu-accent-gradient)" }}
        >
          <span className="text-white font-bold text-sm">教</span>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-48 rounded bg-slate-200 animate-pulse mx-auto" />
          <div className="h-3 w-32 rounded bg-slate-100 animate-pulse mx-auto" />
        </div>
        {showCards && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto px-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl border bg-white p-4 space-y-3 animate-pulse"
                style={{ borderColor: "var(--edu-border)" }}
              >
                <div className="h-2 w-12 rounded bg-slate-200" />
                <div className="h-4 w-3/4 rounded bg-slate-200" />
                <div className="h-3 w-full rounded bg-slate-100" />
                <div className="h-3 w-2/3 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
