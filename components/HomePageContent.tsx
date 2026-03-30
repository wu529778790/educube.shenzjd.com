"use client";

import { useMemo, useState } from "react";
import type { Tool } from "@/data/tools";
import { filterToolsByCatalog } from "@/data/tools";
import {
  defaultCatalogPath,
  getPathLabel,
  grades,
  publishers,
  subjects,
} from "@/data/curriculum";
import ToolGrid from "./ToolGrid";

interface HomePageContentProps {
  tools: Tool[];
}

export default function HomePageContent({ tools }: HomePageContentProps) {
  const [publisherId, setPublisherId] = useState<string>(
    defaultCatalogPath.publisherId,
  );
  const [gradeId, setGradeId] = useState<string>(defaultCatalogPath.gradeId);
  const [subjectId, setSubjectId] = useState<string>(defaultCatalogPath.subjectId);

  const filteredTools = useMemo(
    () => filterToolsByCatalog(tools, publisherId, gradeId, subjectId),
    [tools, publisherId, gradeId, subjectId],
  );

  const pathLabel = getPathLabel(publisherId, gradeId, subjectId);

  const countForPublisher = (pid: string) =>
    tools.filter(
      (t) => t.publisherId === pid && t.gradeId === gradeId && t.subjectId === subjectId,
    ).length;

  const countForGrade = (gid: string) =>
    tools.filter(
      (t) =>
        t.publisherId === publisherId && t.gradeId === gid && t.subjectId === subjectId,
    ).length;

  const countForSubject = (sid: string) =>
    tools.filter(
      (t) =>
        t.publisherId === publisherId && t.gradeId === gradeId && t.subjectId === sid,
    ).length;

  const primaryGrades = grades.filter((g) => g.stage === "primary");
  const juniorGrades = grades.filter((g) => g.stage === "junior");

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-cream)" }}>
      {/* 顶栏：品牌 + 当前路径 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex items-center gap-2 min-w-0 sm:max-w-[55%] sm:justify-end">
              <span className="text-[11px] uppercase tracking-wide text-slate-400 shrink-0 hidden md:inline">
                当前目录
              </span>
              <span
                className="text-sm font-semibold text-slate-700 truncate px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200"
                title={pathLabel}
              >
                {pathLabel}
              </span>
            </div>
          </div>
          <nav className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <a href="#catalog" className="hover:text-slate-800 transition-colors">
              切换教材 / 年级 / 学科
            </a>
            <span className="text-slate-300">|</span>
            <a href="#tools" className="hover:text-slate-800 transition-colors">
              教具列表
            </a>
          </nav>
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

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {pathLabel}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800 leading-tight mb-4">
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

            <p className="text-slate-500 text-base sm:text-lg leading-relaxed mb-6">
              先选教材版本、年级与学科，再浏览对应交互教具。多版本、多年级框架已就绪，内容将持续补充。
            </p>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <span className="flex items-center gap-1.5">
                <span>全站已收录</span>
                <strong className="text-slate-600">{tools.length}</strong>
                <span>个教具（数学）</span>
              </span>
              <span className="hidden sm:inline text-slate-300">·</span>
              <span>浏览器即用，无需安装</span>
            </div>
          </div>
        </div>
      </section>

      {/* 课程体系导航 */}
      <section
        id="catalog"
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-4 scroll-mt-20"
      >
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div
            className="px-5 py-4 border-b border-slate-100"
            style={{ background: "linear-gradient(90deg, #f8fafc 0%, #fff 100%)" }}
          >
            <h2 className="text-lg font-bold text-slate-800">课程体系导航</h2>
            <p className="text-sm text-slate-500 mt-1">
              三步选择：教材版本 → 年级 → 学科。未上线的组合将显示「陆续补充」。
            </p>
          </div>

          <div className="p-5 space-y-6">
            {/* ① 教材版本 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  1
                </span>
                <span className="text-sm font-bold text-slate-800">教材版本</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {publishers.map((p) => {
                  const n = countForPublisher(p.id);
                  const active = publisherId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPublisherId(p.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-slate-800 bg-slate-800 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {p.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ② 年级 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  2
                </span>
                <span className="text-sm font-bold text-slate-800">年级</span>
              </div>
              <p className="text-xs text-slate-400 mb-2">小学</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {primaryGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeId(g.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-400 mb-2">初中</p>
              <div className="flex flex-wrap gap-2">
                {juniorGrades.map((g) => {
                  const n = countForGrade(g.id);
                  const active = gradeId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGradeId(g.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-blue-600 bg-blue-600 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {g.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ③ 学科 */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                  3
                </span>
                <span className="text-sm font-bold text-slate-800">学科</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {subjects.map((s) => {
                  const n = countForSubject(s.id);
                  const active = subjectId === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSubjectId(s.id)}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        active
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {s.name}
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                          active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {n}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 教具列表 */}
      <section id="tools" className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 scroll-mt-20">
        <div className="mb-6 mt-8">
          <h2 className="text-xl font-bold text-slate-800">本目录下的教具</h2>
          <p className="text-sm text-slate-400 mt-1">
            {pathLabel} · 共 {filteredTools.length} 个 · 点击进入全屏演示
          </p>
        </div>

        {filteredTools.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white/80 px-8 py-16 text-center">
            <p className="text-slate-600 font-medium text-lg mb-2">该目录下暂无教具</p>
            <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
              「{pathLabel}」的交互内容正在制作与审核中。您可先切换至
              <strong className="text-slate-600">
                {" "}
                {getPathLabel(
                  defaultCatalogPath.publisherId,
                  defaultCatalogPath.gradeId,
                  defaultCatalogPath.subjectId,
                )}{" "}
              </strong>
              查看已上线示例，或收藏本站关注更新。
            </p>
          </div>
        ) : (
          <ToolGrid tools={filteredTools} />
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
          <span>多版本教材 · 多年级 · 多学科 · 交互教具持续扩充</span>
        </div>
      </footer>
    </div>
  );
}
