import Link from "next/link";

export default function Header() {
  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm"
      style={{
        background: "rgba(45, 58, 140, 0.97)",
        borderColor: "rgba(45, 58, 140, 0.2)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md"
            style={{ background: "linear-gradient(135deg, var(--edu-accent), var(--edu-accent-light))" }}
          >
            <span className="text-white font-bold text-sm">教</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-white text-base" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                教立方
              </span>
              <span className="text-white/50 text-sm">EduCube</span>
            </div>
            <p className="text-white/60 text-xs mt-0.5 hidden sm:block">
              中小学交互教具平台 · 按教材与年级浏览
            </p>
          </div>
        </div>
        <Link
          href="/generate"
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all shrink-0 shadow-md hover:shadow-lg"
          style={{ background: "linear-gradient(135deg, var(--edu-accent), var(--edu-accent-light))" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          AI 生成
        </Link>
      </div>
    </header>
  );
}
