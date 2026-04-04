import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--edu-bg)" }}>
      <div className="text-center px-4">
        <div className="text-6xl mb-4">📐</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--edu-text)", fontFamily: "'Noto Serif SC', serif" }}
        >
          页面不存在
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--edu-text-muted)" }}>
          您访问的页面不存在或已被移除。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all"
          style={{ background: "linear-gradient(135deg, var(--edu-accent), var(--edu-accent-light))" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>
      </div>
    </div>
  );
}
