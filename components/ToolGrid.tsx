"use client";

import { useState } from "react";
import type { Tool, Semester } from "@/data/tools";
import ToolCard from "./ToolCard";

type Filter = "all" | Semester;

interface ToolGridProps {
  tools: Tool[];
}

export default function ToolGrid({ tools }: ToolGridProps) {
  const [filter, setFilter] = useState<Filter>("all");

  const upperCount = tools.filter((t) => t.semester === "上册").length;
  const lowerCount = tools.filter((t) => t.semester === "下册").length;

  const filtered =
    filter === "all"
      ? [...tools].sort((a, b) => {
          if (a.semester !== b.semester) return a.semester === "上册" ? -1 : 1;
          return a.unitNum - b.unitNum;
        })
      : tools
          .filter((t) => t.semester === filter)
          .sort((a, b) => a.unitNum - b.unitNum);

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "全部", count: tools.length },
    { key: "上册", label: "上册", count: upperCount },
    { key: "下册", label: "下册", count: lowerCount },
  ];

  return (
    <div>
      {/* 筛选标签栏 */}
      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filter === tab.key
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {tab.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                filter === tab.key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
        <div className="ml-auto hidden md:flex items-center gap-1.5 text-xs text-slate-400 bg-white px-3 py-2 rounded-lg border border-slate-100">
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          全屏后按 ESC 返回
        </div>
      </div>

      {/* 教具卡片网格 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} index={i} />
        ))}
      </div>
    </div>
  );
}
