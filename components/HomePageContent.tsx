"use client";

import { useMemo, useState, useDeferredValue, useCallback, useEffect } from "react";
import type { Tool } from "@/data/tools";
import { filterToolsByCatalog } from "@/data/tools";
import { defaultCatalogPath } from "@/data/curriculum";
import Header from "./Header";
import FilterPanel from "./FilterPanel";
import ToolGrid from "./ToolGrid";
import EmptyState from "./EmptyState";
import { useRouter, useSearchParams } from "next/navigation";

function sortToolsForDisplay(list: Tool[]): Tool[] {
  return [...list].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester === "上册" ? -1 : 1;
    return a.unitNum - b.unitNum;
  });
}

export default function HomePageContent({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const gradeId = searchParams.get("grade") ?? defaultCatalogPath.gradeId;
  const subjectId = defaultCatalogPath.subjectId;
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const searchQuery = useDeferredValue(searchInput);

  const updateURL = useCallback(
    (overrides: { grade?: string; q?: string }) => {
      const next = new URLSearchParams(searchParams);
      const grade = overrides.grade ?? gradeId;
      const q = overrides.q ?? searchQuery;

      if (grade && grade !== defaultCatalogPath.gradeId) next.set("grade", grade);
      else next.delete("grade");

      if (q) next.set("q", q);
      else next.delete("q");

      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    },
    [searchParams, gradeId, searchQuery, router],
  );

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";
    if (currentQ !== searchQuery) {
      updateURL({ q: searchQuery });
    }
  }, [searchQuery, searchParams, updateURL]);

  const handleGradeChange = useCallback(
    (id: string) => {
      updateURL({ grade: id });
    },
    [updateURL],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const catalogTools = useMemo(
    () => filterToolsByCatalog(tools, gradeId, subjectId),
    [tools, gradeId, subjectId],
  );

  const displayTools = useMemo(() => {
    let list = catalogTools;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.chapter.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q)),
      );
    }

    return sortToolsForDisplay(list);
  }, [catalogTools, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-bg)" }}>
      <Header />

      {/* ── 筛选 + 搜索 ── */}
      <FilterPanel
        tools={tools}
        gradeId={gradeId}
        subjectId={subjectId}
        displayCount={displayTools.length}
        onGradeChange={handleGradeChange}
      />

      {/* ── 搜索框 ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 flex justify-center">
        <div className="relative w-full max-w-lg">
          <svg
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 pointer-events-none"
            style={{ color: "var(--edu-text-muted)" }}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="搜索教具（如：分数、面积、时钟…）"
            aria-label="搜索教具"
            className="w-full rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm outline-none transition-all focus:border-[var(--edu-accent)] focus:ring-[3px] focus:ring-[rgba(232,137,12,0.15)]"
            style={{
              borderColor: "var(--edu-border)",
              color: "var(--edu-text)",
              boxShadow: "0 2px 12px rgba(45, 58, 140, 0.06)",
            }}
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              aria-label="清除搜索"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors"
              style={{ background: "var(--edu-border)", color: "var(--edu-text-muted)" }}
            >
              &times;
            </button>
          )}
        </div>
      </section>

      {/* ── 教具列表 ── */}
      <section id="tools" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-20">
        {searchQuery.trim() && catalogTools.length > 0 && displayTools.length === 0 ? (
          <EmptyState>
            <p className="font-medium mb-1" style={{ color: "var(--edu-text)" }}>
              没有找到匹配「{searchQuery.trim()}」的教具
            </p>
            <p className="text-sm" style={{ color: "var(--edu-text-muted)" }}>
              试试换个关键词，或清空搜索浏览全部教具。
            </p>
          </EmptyState>
        ) : catalogTools.length === 0 ? (
          <EmptyState>
            <p className="font-medium text-lg mb-2" style={{ color: "var(--edu-text)" }}>
              该目录下暂无教具
            </p>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--edu-text-muted)" }}>
              该分类的交互内容正在制作与审核中。您可以切换筛选条件查看已上线的教具。
            </p>
          </EmptyState>
        ) : displayTools.length === 0 ? (
          <EmptyState>
            <p className="font-medium mb-1" style={{ color: "var(--edu-text)" }}>
              当前年级下暂无教具
            </p>
            <p className="text-sm" style={{ color: "var(--edu-text-muted)" }}>
              请切换到其他年级查看。
            </p>
          </EmptyState>
        ) : (
          <ToolGrid tools={displayTools} />
        )}
      </section>

      {/* ── 页脚 ── */}
      <footer className="border-t" style={{ borderColor: "var(--edu-border)", background: "var(--edu-surface)" }}>
        <div
          className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "var(--edu-text-muted)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: "var(--edu-primary)" }}
            >
              教
            </div>
            <span>教立方 EduCube</span>
          </div>
          <span>多年级 · 多学科 · 交互教具持续扩充</span>
        </div>
      </footer>
    </div>
  );
}
