"use client";

import { useMemo, useState, useDeferredValue, useCallback, useEffect } from "react";
import type { Tool } from "@/data/tools";
import {
  buildCatalogSearchParams,
  getCatalogGradeId,
  getCatalogSearchInput,
  getCatalogTools,
  getDisplayTools,
} from "@/components/home/catalog";
import { defaultCatalogPath } from "@/data/curriculum";
import Header from "./Header";
import FilterPanel from "./FilterPanel";
import ToolGrid from "./ToolGrid";
import EmptyState from "./EmptyState";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomePageContent({ tools }: { tools: Tool[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const gradeId = getCatalogGradeId(searchParams);
  const [searchInput, setSearchInput] = useState(getCatalogSearchInput(searchParams));
  const searchQuery = useDeferredValue(searchInput);

  const updateURL = useCallback(
    (overrides: { grade?: string; q?: string }) => {
      const next = buildCatalogSearchParams({
        current: searchParams,
        gradeId: overrides.grade ?? gradeId,
        query: overrides.q ?? searchQuery,
      });
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
    () => getCatalogTools(tools, gradeId),
    [tools, gradeId],
  );

  const displayTools = useMemo(() => {
    return getDisplayTools(catalogTools, searchQuery);
  }, [catalogTools, searchQuery]);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--edu-bg)" }}
    >
      <Header searchInput={searchInput} onSearchChange={handleSearchChange} />

      {/* ── 筛选 ── */}
      <FilterPanel
        tools={tools}
        gradeId={gradeId}
        subjectId={defaultCatalogPath.subjectId}
        displayCount={displayTools.length}
        onGradeChange={handleGradeChange}
      />

      <main className="flex w-full min-h-0 flex-1 flex-col">
        <h2 id="main-content" className="sr-only">
          教具列表
        </h2>
        <section
          id="tools"
          className="mx-auto w-full max-w-[95.5rem] scroll-mt-20 px-4 pb-20 sm:px-6"
        >
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
      </main>

      {/* ── 页脚 ── */}
      <footer
        className="shrink-0 border-t"
        style={{ borderColor: "var(--edu-border)", background: "var(--edu-surface)" }}
      >
        <div
          className="max-w-[95.5rem] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
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
          <span>多年级 · 数学 · 交互教具持续扩充</span>
        </div>
      </footer>
    </div>
  );
}
