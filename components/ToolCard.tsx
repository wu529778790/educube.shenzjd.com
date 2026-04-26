"use client";

import Link from "next/link";
import type { Tool } from "@/data/tools";
import { memo } from "react";
import { getToolCardViewModel } from "@/components/home/tool-card";

interface ToolCardProps {
  tool: Tool;
  index: number;
}

const ToolCard = memo(function ToolCard({ tool, index }: ToolCardProps) {
  const viewModel = getToolCardViewModel(tool, index);

  return (
    <Link
      href={`/tools/${tool.id}`}
      className="group flex h-full min-h-0 flex-col edu-card-elevated overflow-hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      style={{ animationDelay: viewModel.animationDelay }}
      role="listitem"
    >
      <div
        className="h-2.5 w-full shrink-0"
        style={{ background: viewModel.gradientTopBar }}
      />

      <div className="flex min-h-0 flex-1 flex-col p-5">
        <div className="flex items-start justify-between mb-3.5">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm"
            style={{
              background: viewModel.iconBackground,
              border: viewModel.iconBorder,
            }}
          >
            {viewModel.icon}
          </div>
          <span
            className="text-[11px] px-2 py-0.5 rounded-md ml-2 text-right leading-snug font-medium"
            style={{ color: "var(--edu-text-muted)", background: "var(--edu-bg)" }}
          >
            {viewModel.chapter}
          </span>
        </div>

        <h3
          className="text-[15px] font-bold mb-1 transition-colors leading-snug"
          style={{
            color: "var(--edu-text)",
            fontFamily: "var(--edu-font-serif)",
          }}
        >
          <span className="group-hover:hidden">
            {viewModel.name}
          </span>
          <span
            className="hidden group-hover:inline"
            style={{ color: viewModel.hoverTitleColor }}
            aria-hidden="true"
          >
            {viewModel.name}
          </span>
        </h3>

        <p className="text-xs font-medium mb-3" style={{ color: "var(--edu-text-secondary)" }}>
          {viewModel.subtitleMeta}
        </p>

        <p
          className="text-sm leading-relaxed mb-3.5 line-clamp-2"
          style={{ color: "var(--edu-text-muted)" }}
        >
          {viewModel.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {viewModel.tags.map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-0.5 rounded-full font-medium"
              style={{
                background: viewModel.tagBackground,
                color: viewModel.tagColor,
                border: viewModel.tagBorder,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <div
          className="mt-auto flex items-center justify-between gap-2 border-t pt-2.5 text-sm font-medium leading-none opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          style={{ borderColor: "var(--edu-border)", color: viewModel.tagColor }}
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
