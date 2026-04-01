"use client";

import { useMemo, useState } from "react";
import type { Semester, Tool } from "@/data/tools";
import { filterToolsByCatalog } from "@/data/tools";
import {
  defaultCatalogPath,
  getPathLabel,
  grades,
  subjects,
} from "@/data/curriculum";
import ToolGrid from "./ToolGrid";
import Link from "next/link";

type SemesterFilter = "all" | Semester;

interface HomePageContentProps {
  tools: Tool[];
}

function sortToolsForDisplay(list: Tool[]): Tool[] {
  return [...list].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester === "上册" ? -1 : 1;
    return a.unitNum - b.unitNum;
  });
}

export default function HomePageContent({ tools }: HomePageContentProps) {
  const [gradeId, setGradeId] = useState<string>(defaultCatalogPath.gradeId);
  const [subjectId, setSubjectId] = useState<string>(defaultCatalogPath.subjectId);
  const [semesterFilter, setSemesterFilter] = useState<SemesterFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const pathLabel = getPathLabel(gradeId, subjectId);

  const semesterSummary =
    semesterFilter === "all" ? "" : ` · ${semesterFilter}`;

  const countSemesterAll = catalogTools.length;
  const countSemesterUpper = catalogTools.filter((t) => t.semester === "上册").length;
  const countSemesterLower = catalogTools.filter((t) => t.semester === "下册").length;

  const counts = useMemo(() => {
    const grade = new Map<string, number>();
    const sub = new Map<string, number>();

    for (const t of tools) {
      if (t.subjectId === subjectId) {
        grade.set(t.gradeId, (grade.get(t.gradeId) ?? 0) + 1);
      }
      if (t.gradeId === gradeId) {
        sub.set(t.subjectId, (sub.get(t.subjectId) ?? 0) + 1);
      }
    }
    const allGrade = tools.filter(
      (t) => t.subjectId === subjectId,
    ).length;
    grade.set("all", allGrade);

    return { grade, sub };
  }, [tools, gradeId, subjectId]);

  const countForGrade = (gid: string) => counts.grade.get(gid) ?? 0;
  const countForSubject = (sid: string) => counts.sub.get(sid) ?? 0;

  const primaryGrades = grades.filter((g) => g.stage === "primary");
  const juniorGrades = grades.filter((g) => g.stage === "junior");

  const availableSubjects = useMemo(
    () => subjects.filter((s) => tools.some((t) => t.subjectId === s.id)),
    [tools],
  );

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-bg)" }}>
      {/* ── 顶栏 ── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm"
        style={{
          background: "rgba(45, 58, 140, 0.97)",
          borderColor: "rgba(45, 58, 140, 0.2)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md"
              style={{ background: "linear-gradient(135deg, var(--edu-accent), var(--edu-accent-light))" }}
            >
              <span className="text-white font-bold text-sm">教</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-white text-base" style={{ fontFamily: "'Noto Serif SC', serif" }}>
                  教立方
                </span>
                <span className="text-white/50 text-sm">EduCube</span>
              </div>
              <p className="text-white/60 text-xs mt-0.5 hidden sm:block">
                中小学交互教具平台 · 按教材与年级浏览
              </p>
            </div>
          </div>
          <Link
            href="/generate"
            className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all shrink-0 shadow-md hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--edu-accent), var(--edu-accent-light))" }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            AI 生成
          </Link>
        </div>
      </header>

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
              style={{ color: "var(--edu-text)", fontFamily: "'Noto Serif SC', serif", fontWeight: 700 }}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索教具（如：分数、面积、时钟…）"
                className="w-full rounded-xl border bg-white pl-10 pr-3 py-2.5 text-sm outline-none transition-all"
                style={{
                  borderColor: "var(--edu-border)",
                  color: "var(--edu-text)",
                  boxShadow: "0 2px 12px rgba(45, 58, 140, 0.06)",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "var(--edu-accent)";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(232, 137, 12, 0.15), 0 2px 12px rgba(45, 58, 140, 0.06)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "var(--edu-border)";
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(45, 58, 140, 0.06)";
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
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
      <section
        id="catalog"
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 scroll-mt-20"
      >
        <details className="group rounded-xl border bg-white" style={{ borderColor: "var(--edu-border)" }}>
          <summary
            className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden transition-colors hover:bg-white/50"
          >
            <div className="min-w-0 flex-1">
              <span
                className="text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: "var(--edu-text-muted)" }}
              >
                筛选条件
              </span>
              <p className="text-sm font-medium truncate" style={{ color: "var(--edu-text)" }}>
                {pathLabel}
                <span style={{ color: "var(--edu-text-secondary)" }}>{semesterSummary}</span>
                <span style={{ color: "var(--edu-text-muted)" }}>
                  {" "}· 共 {displayTools.length} 个
                </span>
              </p>
            </div>
            <span
              className="shrink-0 text-xs font-medium group-open:hidden"
              style={{ color: "var(--edu-accent)" }}
            >
              展开
            </span>
            <span
              className="hidden shrink-0 text-xs group-open:inline"
              style={{ color: "var(--edu-text-muted)" }}
            >
              收起
            </span>
          </summary>

          <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "var(--edu-border)" }}>
            <p className="text-[11px] leading-snug" style={{ color: "var(--edu-text-muted)" }}>
              选择年级与册别可快速定位对应教具。
            </p>

            {/* 年级 */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
                年级
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(() => {
                  const n = countForGrade("all");
                  const active = gradeId === "all";
                  return (
                    <FilterButton active={active} onClick={() => setGradeId("all")} count={n}>
                      全部
                    </FilterButton>
                  );
                })()}
                {primaryGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <FilterButton key={g.id} active={active} onClick={() => setGradeId(g.id)} count={n}>
                      {g.name.replace("年级", "")}
                    </FilterButton>
                  );
                })}
                <span className="px-1" style={{ color: "var(--edu-border)" }} aria-hidden>|</span>
                {juniorGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <FilterButton key={g.id} active={active} onClick={() => setGradeId(g.id)} count={n}>
                      {g.name.replace("年级", "")}
                    </FilterButton>
                  );
                })}
              </div>
            </div>

            {/* 册别 */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
                册别
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all" as const, label: "全部", count: countSemesterAll },
                    { key: "上册" as const, label: "上册", count: countSemesterUpper },
                    { key: "下册" as const, label: "下册", count: countSemesterLower },
                  ] satisfies { key: SemesterFilter; label: string; count: number }[]
                ).map((tab) => (
                  <FilterButton
                    key={tab.key}
                    active={semesterFilter === tab.key}
                    onClick={() => setSemesterFilter(tab.key)}
                    count={tab.count}
                  >
                    {tab.label}
                  </FilterButton>
                ))}
              </div>
            </div>

            {/* 学科 */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
                学科
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableSubjects.map((s) => {
                  const n = countForSubject(s.id);
                  const active = subjectId === s.id;
                  return (
                    <FilterButton key={s.id} active={active} onClick={() => setSubjectId(s.id)} count={n}>
                      {s.name}
                    </FilterButton>
                  );
                })}
              </div>
            </div>
          </div>
        </details>
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
          <div className="rounded-2xl border-2 border-dashed bg-white/80 px-8 py-16 text-center"
            style={{ borderColor: "var(--edu-border)" }}
          >
            <p className="font-medium text-lg mb-2" style={{ color: "var(--edu-text)" }}>
              该目录下暂无教具
            </p>
            <p className="text-sm max-w-md mx-auto leading-relaxed" style={{ color: "var(--edu-text-muted)" }}>
              「{pathLabel}」的交互内容正在制作与审核中。您可先切换至
              <strong style={{ color: "var(--edu-text)" }}>
                {" "}
                {getPathLabel(
                  defaultCatalogPath.gradeId,
                  defaultCatalogPath.subjectId,
                )}{" "}
              </strong>
              查看已上线示例，或收藏本站关注更新。
            </p>
          </div>
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

/* ── 共享子组件 ── */

function FilterButton({
  active,
  onClick,
  count,
  children,
}: {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
      style={{
        borderColor: active ? "var(--edu-primary)" : "var(--edu-border)",
        background: active ? "var(--edu-primary)" : "var(--edu-surface)",
        color: active ? "white" : "var(--edu-text-secondary)",
      }}
    >
      {children}
      <span style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--edu-text-muted)" }}>
        {count}
      </span>
    </button>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border border-dashed px-6 py-10 text-center"
      style={{ borderColor: "var(--edu-border)", background: "var(--edu-surface)" }}
    >
      {children}
    </div>
  );
}
