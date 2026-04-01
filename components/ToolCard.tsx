import Link from "next/link";
import type { Tool } from "@/data/tools";
import { getGrade } from "@/data/curriculum";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

export default function ToolCard({ tool, index }: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group block rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{
        background: "var(--edu-surface)",
        border: "1px solid var(--edu-border)",
        boxShadow: "0 1px 3px rgba(44,44,44,0.04), 0 4px 16px rgba(44,44,44,0.03)",
        animationDelay: `${index * 80}ms`,
      }}
    >
      {/* 顶部渐变条 — 更宽更圆润 */}
      <div
        className="h-2.5 w-full"
        style={{
          background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
        }}
      />

      {/* 卡片内容 */}
      <div className="p-5">
        {/* 图标 + 章节 */}
        <div className="flex items-start justify-between mb-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
            style={{
              background: `linear-gradient(135deg, ${tool.gradient[0]}14, ${tool.gradient[1]}22)`,
              border: `1px solid ${tool.gradient[0]}18`,
            }}
          >
            {tool.icon}
          </div>
          <span
            className="text-[11px] px-2 py-0.5 rounded-md ml-2 text-right leading-snug font-medium"
            style={{ color: "var(--edu-text-muted)", background: "var(--edu-bg)" }}
          >
            {tool.chapter}
          </span>
        </div>

        {/* 标题 — 衬线字体 */}
        <h3
          className="text-[15px] font-bold mb-1 transition-colors leading-snug"
          style={{
            color: "var(--edu-text)",
            fontFamily: "'Noto Serif SC', serif",
          }}
        >
          <span
            className="group-hover:hidden"
          >
            {tool.name}
          </span>
          <span
            className="hidden group-hover:inline"
            style={{ color: tool.gradient[0] }}
          >
            {tool.name}
          </span>
        </h3>

        <p className="text-xs font-medium mb-3" style={{ color: "var(--edu-text-secondary)" }}>
          {tool.subtitle} ·{" "}
          {getGrade(tool.gradeId)?.name ?? tool.gradeId} · {tool.semester}
        </p>

        {/* 描述 */}
        <p
          className="text-sm leading-relaxed mb-3.5 line-clamp-2"
          style={{ color: "var(--edu-text-muted)" }}
        >
          {tool.description}
        </p>

        {/* 标签 — 药丸形 */}
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: `${tool.gradient[0]}10`,
                color: tool.gradient[0],
                border: `1px solid ${tool.gradient[0]}18`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 底部进入提示 — 触屏始终可见，桌面端 hover 显示 */}
      <div
        className="px-5 py-2.5 flex items-center justify-between text-sm font-medium opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
        style={{ borderTop: "1px solid var(--edu-border)", color: tool.gradient[0] }}
      >
        <span>点击进入教具</span>
        <svg
          className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
