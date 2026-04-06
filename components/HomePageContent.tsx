"use client";

import { useMemo, useState, useDeferredValue, useCallback, useEffect } from "react";
import type { SemesterFilter, Tool } from "@/data/tools";
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

  // 从 URL 初始化筛选状态
  const [gradeId, setGradeId] = useState<string>(
    searchParams.get("grade") ?? defaultCatalogPath.gradeId,
  );
  const [subjectId, setSubjectId] = useState<string>(
    searchParams.get("subject") ?? defaultCatalogPath.subjectId,
  );
  const semesterParam = searchParams.get("semester");
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>(
    semesterParam === "上册" || semesterParam === "下册" ? semesterParam : "all",
  );
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");
  const searchQuery = useDeferredValue(searchInput);

  // 同步筛选条件到 URL（仅年级/学科/册别，搜索词由单独的 useEffect 管理）
  const syncFilterParams = useCallback(
    (overrides: { grade?: string; subject?: string; semester?: string }) => {
      const next = new URLSearchParams(searchParams);
      const grade = overrides.grade ?? gradeId;
      const subject = overrides.subject ?? subjectId;
      const semester = overrides.semester ?? (semesterFilter === "all" ? "" : semesterFilter);

      if (grade && grade !== defaultCatalogPath.gradeId) next.set("grade", grade);
      else next.delete("grade");

      if (subject && subject !== defaultCatalogPath.subjectId) next.set("subject", subject);
      else next.delete("subject");

      if (semester) next.set("semester", semester);
      else next.delete("semester");

      // 保留当前搜索词（从 URL params 读取，避免闭包过时）
      const currentQ = searchParams.get("q") ?? "";
      if (currentQ) next.set("q", currentQ);
      else next.delete("q");

      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    },
    [searchParams, gradeId, subjectId, semesterFilter, router],
  );

  // 搜索词延迟同步到 URL（避免每次按键都触发 router.replace）
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (searchQuery) next.set("q", searchQuery);
    else next.delete("q");

    // 只更新 q 参数，保留其余参数不变
    const currentQ = searchParams.get("q") ?? "";
    if (currentQ !== searchQuery) {
      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    }
  }, [searchQuery, searchParams, router]);

  const handleGradeChange = useCallback((id: string) => {
    setGradeId(id);
    syncFilterParams({ grade: id });
  }, [syncFilterParams]);

  const handleSubjectChange = useCallback((id: string) => {
    setSubjectId(id);
    syncFilterParams({ subject: id });
  }, [syncFilterParams]);

  const handleSemesterChange = useCallback((s: SemesterFilter) => {
    setSemesterFilter(s);
    syncFilterParams({ semester: s === "all" ? "" : s });
  }, [syncFilterParams]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const catalogTools = useMemo(
    () => filterToolsByCatalog(tools, gradeId, subjectId),
    [tools, gradeId, subjectId],
  );

  const displayTools = useMemo(() => {
    let list =
      semesterFilter === "all"
        ? catalogTools
        : catalogTools.filter((t) => t.semester === semesterFilter);

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
  }, [catalogTools, semesterFilter, searchQuery]);

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-bg)" }}>
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden edu-paper-texture">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-[0.07]"
            style={{ background: "var(--edu-primary)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-[0.08]"
            style={{ background: "var(--edu-accent)" }}
          />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 relative z-10">
          <div className="max-w-2xl">
            <h1
              className="text-2xl sm:text-3xl leading-snug mb-2"
              style={{ color: "var(--edu-text)", fontFamily: "var(--edu-font-serif)", fontWeight: 700 }}
            >
              课堂上的数学，
              <br />
              <span className="relative inline-block" style={{ color: "var(--edu-primary)" }}>
                看得见、可操作
                <svg
                  className="absolute -bottom-1.5 left-0 w-full"
                  height="5"
                  viewBox="0 0 200 5"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 3 Q50 0 100 3 Q150 6 200 3"
                    style={{ stroke: "var(--edu-accent)" }}
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--edu-text-secondary)" }}>
              为数学老师提供即用型交互式教具，拿来就能上课。浏览器打开即用，无需安装。
            </p>

            {/* 搜索框 */}
            <div className="relative max-w-lg">
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
          </div>
        </div>
      </section>

      {/* ── 筛选面板 ── */}
      <FilterPanel
        tools={tools}
        gradeId={gradeId}
        subjectId={subjectId}
        semesterFilter={semesterFilter}
        catalogTools={catalogTools}
        displayCount={displayTools.length}
        onGradeChange={handleGradeChange}
        onSubjectChange={handleSubjectChange}
        onSemesterChange={handleSemesterChange}
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
              当前册别下暂无教具
            </p>
            <p className="text-sm" style={{ color: "var(--edu-text-muted)" }}>
              请展开「筛选条件」，将册别改为「全部」或切换另一册。
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
