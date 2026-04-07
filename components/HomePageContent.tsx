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
      <Header searchInput={searchInput} onSearchChange={handleSearchChange} />

      {/* ── 筛选 ── */}
      <FilterPanel
        tools={tools}
        gradeId={gradeId}
        subjectId={subjectId}
        displayCount={displayTools.length}
        onGradeChange={handleGradeChange}
      />

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
