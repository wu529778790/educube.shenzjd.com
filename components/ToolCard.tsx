"use client";

import Link from "next/link";
import type { Tool } from "@/data/tools";
import { getGrade } from "@/data/curriculum";
import { memo } from "react";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

const ToolCard = memo(function ToolCard({ tool, index }: ToolCardProps) {
  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group flex h-full min-h-0 flex-col edu-card-elevated overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{ animationDelay: `${Math.min(index * 80, 800)}ms` }}
      role="listitem"
    >
      {/* 顶部渐变条 — 更宽更圆润 */}
      <div
        className="h-2.5 w-full shrink-0"
        style={{
          background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
        }}
      />

      {/* 卡片内容 — flex-1 撑满高度，便于底栏与同行卡片对齐 */}
      <div className="flex min-h-0 flex-1 flex-col p-5">
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
            fontFamily: "var(--edu-font-serif)",
          }}
        >
          <span className="group-hover:hidden">
            {tool.name}
          </span>
          <span
            className="hidden group-hover:inline"
            style={{ color: tool.gradient[0] }}
            aria-hidden="true"
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

        {/* 底部进入提示 — 贴底对齐，同一行网格内「点击进入」在同一水平线；触屏始终可见，桌面端 hover 显示 */}
        <div
          className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5 text-sm font-medium leading-none opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          style={{ borderColor: "var(--edu-border)", color: tool.gradient[0] }}
        >
          <span className="shrink-0">点击进入教具</span>
          <svg
            className="h-4 w-4 shrink-0 translate-x-0 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
});

export default ToolCard;
