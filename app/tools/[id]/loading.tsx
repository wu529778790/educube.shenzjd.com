export default function ToolLoading() {
  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--edu-primary)" }}>
      {/* 顶部工具条骨架 */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b gap-3"
        style={{
          background: "var(--edu-primary)",
          borderColor: "rgba(255,255,255,0.1)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-white/20 animate-pulse" />
          <div className="w-8 h-3 rounded bg-white/20 animate-pulse hidden sm:block" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded bg-white/20 animate-pulse" />
          <div className="w-24 h-3 rounded bg-white/20 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-6 rounded bg-white/10 animate-pulse" />
          <div className="w-14 h-6 rounded bg-white/10 animate-pulse hidden sm:block" />
        </div>
      </header>

      {/* iframe 区域骨架 */}
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl mx-auto mb-3 animate-pulse flex items-center justify-center"
            style={{ background: "var(--edu-accent-gradient)" }}
          >
            <span className="text-white font-bold text-sm">教</span>
          </div>
          <div className="h-3 w-32 rounded bg-slate-200 animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
