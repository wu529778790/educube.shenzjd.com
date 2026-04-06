"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // 将错误输出到控制台，便于生产环境排查
  console.error("[ErrorBoundary]", error);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: "var(--edu-bg)" }}
    >
      <div className="text-center px-4">
        <div className="text-6xl mb-4" aria-hidden="true">😵</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--edu-text)", fontFamily: "var(--edu-font-serif)" }}
        >
          出错了
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--edu-text-muted)" }}>
          页面加载遇到问题，请稍后重试。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center gap-1.5 text-sm px-5 py-2.5 edu-btn-accent"
          >
            重试
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl border transition-colors"
            style={{
              borderColor: "var(--edu-border)",
              color: "var(--edu-text-secondary)",
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
