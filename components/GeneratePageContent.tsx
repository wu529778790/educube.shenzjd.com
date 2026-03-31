"use client";

import { useState, useMemo, useEffect } from "react";
import { grades, subjects } from "@/data/curriculum";
import type { Tool } from "@/data/tools";
import Link from "next/link";

/* 可选的渐变色方案 */
const GRADIENT_OPTIONS: { label: string; value: [string, string] }[] = [
  { label: "蓝", value: ["#3B82F6", "#2563EB"] },
  { label: "橙", value: ["#F97316", "#EA580C"] },
  { label: "绿", value: ["#22C55E", "#16A34A"] },
  { label: "紫", value: ["#8B5CF6", "#7C3AED"] },
  { label: "粉", value: ["#EC4899", "#F43F5E"] },
  { label: "青", value: ["#06B6D4", "#0EA5E9"] },
  { label: "黄", value: ["#EAB308", "#D97706"] },
];

const ICON_OPTIONS = [
  "📐",
  "📏",
  "🔢",
  "📊",
  "✖",
  "➗",
  "➕",
  "📐",
  "🔬",
  "📖",
  "✏️",
  "🧮",
];

export default function GeneratePageContent() {
  const [name, setName] = useState("");
  const [gradeId, setGradeId] = useState("p5");
  const [subjectId, setSubjectId] = useState("math");
  const [chapter, setChapter] = useState("");
  const [description, setDescription] = useState("");
  const [gradient, setGradient] = useState<[string, string]>([
    "#3B82F6",
    "#2563EB",
  ]);
  const [icon, setIcon] = useState("📐");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedTool, setSavedTool] = useState<Tool | null>(null);

  async function handleGenerate() {
    if (!name.trim() || !description.trim()) {
      setError("请填写教具名称和功能描述");
      return;
    }
    setError("");
    setLoading(true);
    setPreviewHtml("");
    setSavedTool(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          grade: gradeId,
          subject: subjectId,
          chapter: chapter.trim() || "自定义",
          description: description.trim(),
          gradient,
          icon,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "生成失败");
        return;
      }

      setPreviewHtml(data.html);
      setSavedTool(data.tool);
    } catch {
      setError("网络错误，请检查连接后重试");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setPreviewHtml("");
    setSavedTool(null);
    setError("");
  }

  const gradeName =
    grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectName =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-cream)" }}>
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              返回首页
            </Link>
            <div className="w-px h-5 bg-slate-200" />
            <span className="font-bold text-slate-800">
              AI 生成教具
            </span>
            <span className="text-slate-400 text-sm">
              描述需求，自动生成交互式教具
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：表单 */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h2 className="text-base font-bold text-slate-800">
                填写教具信息
              </h2>

              {/* 教具名称 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  教具名称
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="如：质数与合数"
                  maxLength={50}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* 年级 + 学科 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    年级
                  </label>
                  <select
                    value={gradeId}
                    onChange={(e) => setGradeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  >
                    {grades.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">
                    学科
                  </label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 章节 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  章节（可选）
                </label>
                <input
                  type="text"
                  value={chapter}
                  onChange={(e) => setChapter(e.target.value)}
                  placeholder="如：上册 · 第三单元"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                />
              </div>

              {/* 功能描述 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  功能描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="描述教具应展示的知识点和交互方式，如：展示三角形按角分类的过程，拖拽顶点改变三角形形状，自动判断锐角/直角/钝角三角形"
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {description.length}/500
                </p>
              </div>

              {/* 配色 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  配色
                </label>
                <div className="flex gap-2">
                  {GRADIENT_OPTIONS.map((g) => (
                    <button
                      key={g.label}
                      type="button"
                      onClick={() => setGradient(g.value)}
                      className="w-8 h-8 rounded-full border-2 transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${g.value[0]}, ${g.value[1]})`,
                        borderColor:
                          gradient[0] === g.value[0]
                            ? "#334155"
                            : "transparent",
                        transform:
                          gradient[0] === g.value[0]
                            ? "scale(1.15)"
                            : "scale(1)",
                      }}
                      title={g.label}
                    />
                  ))}
                </div>
              </div>

              {/* 图标 */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  图标
                </label>
                <div className="flex gap-2 flex-wrap">
                  {ICON_OPTIONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-lg border text-lg flex items-center justify-center transition-all ${
                        icon === ic
                          ? "border-slate-800 bg-slate-100 scale-110"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading
                    ? "#94a3b8"
                    : `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})`,
                }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray="31.4 31.4"
                        strokeLinecap="round"
                      />
                    </svg>
                    正在生成...
                  </span>
                ) : (
                  "生成教具"
                )}
              </button>
              {previewHtml && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  重新填写
                </button>
              )}
            </div>

            {/* 错误信息 */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* 生成成功后的操作 */}
            {savedTool && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  教具生成成功！
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/tools/${savedTool.id}`}
                    target="_blank"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    打开教具
                  </Link>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    返回首页查看
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* 右侧：预览 */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: previewHtml
                    ? "#22c55e"
                    : "#94a3b8",
                }}
              />
              <span className="text-xs font-medium text-slate-500">
                {previewHtml
                  ? `${gradeName} · ${subjectName} · ${name || "预览"}`
                  : "预览区域（生成后显示）"}
              </span>
            </div>
            <div className="h-[600px]">
              {previewHtml ? (
                <PreviewIframe html={previewHtml} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300">
                  <div className="text-center">
                    <div className="text-4xl mb-3">📐</div>
                    <p className="text-sm">
                      填写左侧表单后点击「生成教具」
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/** 用 blob URL 渲染 HTML 预览（自动释放） */
function PreviewIframe({ html }: { html: string }) {
  const url = useMemo(() => {
    const blob = new Blob([html], { type: "text/html" });
    return URL.createObjectURL(blob);
  }, [html]);

  useEffect(() => {
    return () => URL.revokeObjectURL(url);
  }, [url]);

  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      title="预览"
      sandbox="allow-scripts"
    />
  );
}
