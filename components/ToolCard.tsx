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
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-slate-100"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* 渐变色顶部条 */}
      <div
        className="h-2 w-full"
        style={{
          background: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
        }}
      />

      {/* 卡片内容 */}
      <div className="p-6">
        {/* 图标 + 章节 */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${tool.gradient[0]}18, ${tool.gradient[1]}28)`,
            }}
          >
            {tool.icon}
          </div>
          <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md ml-2 text-right leading-snug">
            {tool.chapter}
          </span>
        </div>

        {/* 标题 */}
        <h3 className="text-base font-bold text-slate-800 mb-1 group-hover:text-blue-700 transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs font-medium mb-3" style={{ color: tool.gradient[0] }}>
          {tool.subtitle} ·{" "}
          {getGrade(tool.gradeId)?.name ?? tool.gradeId} · {tool.semester}
        </p>

        {/* 描述 */}
        <p className="text-sm text-slate-500 leading-relaxed mb-4 line-clamp-2">
          {tool.description}
        </p>

        {/* 标签 */}
        <div className="flex flex-wrap gap-1.5">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                background: `${tool.gradient[0]}15`,
                color: tool.gradient[0],
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* 底部进入提示 */}
      <div
        className="px-6 py-3 border-t border-slate-50 flex items-center justify-between text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: tool.gradient[0] }}
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
