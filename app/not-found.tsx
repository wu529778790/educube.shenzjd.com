import Link from "next/link";
import BackArrow from "@/components/BackArrow";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--edu-bg)" }}>
      <div className="text-center px-4">
        <div className="text-6xl mb-4" aria-hidden="true">📐</div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "var(--edu-text)", fontFamily: "var(--edu-font-serif)" }}
        >
          页面不存在
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--edu-text-muted)" }}>
          您访问的页面不存在或已被移除。
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm px-5 py-2.5 edu-btn-accent"
        >
          <BackArrow />
          返回首页
        </Link>
      </div>
    </div>
  );
}
