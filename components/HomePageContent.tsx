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

  const catalogTools = useMemo(
    () => filterToolsByCatalog(tools, gradeId, subjectId),
    [tools, gradeId, subjectId],
  );

  const displayTools = useMemo(() => {
    const list =
      semesterFilter === "all"
        ? catalogTools
        : catalogTools.filter((t) => t.semester === semesterFilter);
    return sortToolsForDisplay(list);
  }, [catalogTools, semesterFilter]);

  const pathLabel = getPathLabel(gradeId, subjectId);

  const semesterSummary =
    semesterFilter === "all" ? "" : ` · ${semesterFilter}`;

  const countSemesterAll = catalogTools.length;
  const countSemesterUpper = catalogTools.filter((t) => t.semester === "上册").length;
  const countSemesterLower = catalogTools.filter((t) => t.semester === "下册").length;

  // 预计算各维度的计数，避免在 JSX 中多次 filter
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
    // "all" grade count
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

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-cream)" }}>
      {/* 顶栏：品牌 + 当前路径 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ background: "var(--edu-navy)" }}
            >
              教
            </div>
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="font-bold text-slate-800 text-base">教立方</span>
                <span className="text-slate-400 text-sm">EduCube</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                中小学交互教具平台 · 按教材与年级浏览
              </p>
            </div>
          </div>
          <Link
            href="/generate"
            className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg text-white transition-colors shrink-0"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #6D28D9)" }}
          >
            AI 生成
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: "var(--edu-sky)" }}
          />
          <div
            className="absolute -bottom-10 -left-10 w-64 h-64 rounded-full opacity-8"
            style={{ background: "var(--edu-orange)" }}
          />
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.04]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="hero-grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="#1a3a5c"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-5 sm:py-6 relative">
          <div className="max-w-2xl">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-snug mb-2">
              课堂上的数学，
              <br />
              <span className="relative" style={{ color: "var(--edu-navy)" }}>
                看得见、可操作
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  height="4"
                  viewBox="0 0 200 4"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 3 Q50 0 100 3 Q150 6 200 3"
                    stroke="#f97316"
                    strokeWidth="2.5"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-slate-500 text-sm leading-snug mb-0">
              浏览器即用；需要换教材或年级时，在下方点「筛选条件」展开即可。
            </p>
          </div>
        </div>
      </section>

      {/* 课程体系：默认收起，仅占一行；展开后为紧凑筛选 */}
      <section
        id="catalog"
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 scroll-mt-20"
      >
        <details className="group rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 sm:px-4 [&::-webkit-details-marker]:hidden">
            <div className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                筛选条件
              </span>
              <p className="text-sm font-medium text-slate-800 truncate">
                {pathLabel}
                <span className="text-slate-500 font-normal">{semesterSummary}</span>
                <span className="text-slate-400 font-normal">
                  {" "}
                  · 共 {displayTools.length} 个
                </span>
              </p>
            </div>
            <span className="shrink-0 text-xs text-blue-600 group-open:hidden">展开</span>
            <span className="hidden shrink-0 text-xs text-slate-500 group-open:inline">收起</span>
          </summary>

          <div className="border-t border-slate-100 px-3 pb-3 pt-2 sm:px-4 space-y-3">
            <p className="text-[11px] text-slate-400 leading-snug">
              未上线的教材 / 年级 / 学科会显示「陆续补充」。可先选册别再浏览列表。
            </p>

            {/* ① 年级：小学与初中同一视觉块 */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-500">年级</span>
              <div className="flex flex-wrap items-center gap-1.5">
                {(() => {
                  const n = countForGrade("all");
                  const active = gradeId === "all";
                  return (
                    <button
                      key="all"
                      type="button"
                      onClick={() => setGradeId("all")}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      全部
                      <span className={active ? "text-white/80" : "text-slate-400"}>{n}</span>
                    </button>
                  );
                })()}
                {primaryGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeId(g.id)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g.name.replace("年级", "")}
                      <span className={active ? "text-white/80" : "text-slate-400"}>{n}</span>
                    </button>
                  );
                })}
                <span className="text-slate-300 px-0.5" aria-hidden>
                  |
                </span>
                {juniorGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeId(g.id)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g.name.replace("年级", "")}
                      <span className={active ? "text-white/80" : "text-slate-400"}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ② 册别（上册 / 下册） */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-500">册别</span>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    { key: "all" as const, label: "全部", count: countSemesterAll },
                    { key: "上册" as const, label: "上册", count: countSemesterUpper },
                    { key: "下册" as const, label: "下册", count: countSemesterLower },
                  ] satisfies { key: SemesterFilter; label: string; count: number }[]
                ).map((tab) => {
                  const active = semesterFilter === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setSemesterFilter(tab.key)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-amber-600 bg-amber-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {tab.label}
                      <span className={active ? "text-white/80" : "text-slate-400"}>
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ③ 学科 */}
            <div>
              <span className="mb-1.5 block text-[11px] font-bold text-slate-500">学科</span>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((s) => {
                  const n = countForSubject(s.id);
                  const active = subjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSubjectId(s.id)}
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {s.name}
                      <span className={active ? "text-white/80" : "text-slate-400"}>{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </details>
      </section>

      {/* 教具列表 */}
      <section id="tools" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-20">
        {catalogTools.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/80 px-8 py-16 text-center">
            <p className="text-slate-600 font-medium text-lg mb-2">该目录下暂无教具</p>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              「{pathLabel}」的交互内容正在制作与审核中。您可先切换至
              <strong className="text-slate-600">
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
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
            <p className="text-slate-600 font-medium mb-1">
              当前册别下暂无教具
            </p>
            <p className="text-slate-400 text-sm">
              请展开「筛选条件」，将册别改为「全部」或切换另一册。
            </p>
          </div>
        ) : (
          <ToolGrid tools={displayTools} />
        )}
      </section>

      {/* 页脚 */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "var(--edu-navy)" }}
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
