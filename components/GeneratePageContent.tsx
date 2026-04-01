"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { grades, subjects } from "@/data/curriculum";
import type { Tool } from "@/data/tools";
import Link from "next/link";

const BTN_GRADIENT = "linear-gradient(135deg, #e8890c, #f5a623)";

type Stage = "idle" | "refining" | "generating" | "saving";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  refining: "正在分析需求并整理规格说明…",
  generating: "正在生成交互式教具页面…",
  saving: "正在保存教具…",
};

const STAGE_ORDER: Stage[] = ["refining", "generating", "saving"];

export default function GeneratePageContent() {
  const [gradeId, setGradeId] = useState("p5");
  const [subjectId, setSubjectId] = useState("math");
  const [description, setDescription] = useState("");

  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [previewHtml, setPreviewHtml] = useState("");
  const [savedTool, setSavedTool] = useState<Tool | null>(null);
  const [refinedSpec, setRefinedSpec] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);

  // 拉取剩余次数
  useEffect(() => {
    fetch("/api/generate")
      .then((r) => r.json())
      .then((d) => setRemaining(d.remaining))
      .catch(() => {});
  }, [stage]); // 每次生成完成后刷新

  const handleGenerate = useCallback(async () => {
    if (!description.trim()) {
      setError("请填写需求描述");
      return;
    }
    setError("");
    setPreviewHtml("");
    setSavedTool(null);
    setRefinedSpec("");
    setStage("refining");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: gradeId,
          subject: subjectId,
          description: description.trim(),
        }),
      });

      // 429 等非 SSE 响应
      if (res.status === 429 || res.status === 400) {
        const data = await res.json();
        setError(data.error || "请求失败");
        setStage("idle");
        return;
      }

      if (!res.ok) {
        setError("生成失败，请稍后重试");
        setStage("idle");
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setError("网络错误");
        setStage("idle");
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 解析 SSE 消息
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const lines = part.split("\n");
          let eventType = "";
          let dataStr = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) eventType = line.slice(7).trim();
            else if (line.startsWith("data: ")) dataStr = line.slice(6);
          }

          if (!eventType || !dataStr) continue;

          try {
            const data = JSON.parse(dataStr);

            switch (eventType) {
              case "stage":
                setStage(data.stage as Stage);
                break;
              case "refined":
                setRefinedSpec(data.refinedSpec || "");
                break;
              case "done":
                setPreviewHtml(data.html);
                setSavedTool(data.tool);
                setStage("idle");
                break;
              case "error":
                setError(data.error || "生成失败");
                setStage("idle");
                break;
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    } catch {
      setError("网络错误，请检查连接后重试");
      setStage("idle");
    }
  }, [description, gradeId, subjectId]);

  function handleReset() {
    setPreviewHtml("");
    setSavedTool(null);
    setRefinedSpec("");
    setError("");
  }

  const gradeName =
    grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectName =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  const previewTitle = savedTool?.name ?? "预览";
  const loading = stage !== "idle";
  const currentStepIndex = stage === "idle" ? -1 : STAGE_ORDER.indexOf(stage);

  return (
    <div className="min-h-screen" style={{ background: "var(--edu-bg)" }}>
      <header
        className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm"
        style={{
          background: "rgba(45, 58, 140, 0.97)",
          borderColor: "rgba(45, 58, 140, 0.2)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm"
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
            <div className="w-px h-5" style={{ background: "rgba(255,255,255,0.2)" }} />
            <span className="font-bold text-white" style={{ fontFamily: "'Noto Serif SC', serif" }}>
              AI 生成教具
            </span>
            <span className="text-white/50 text-sm hidden sm:inline">
              描述需求，自动生成交互式教具
            </span>
            {remaining !== null && (
              <span className="ml-auto text-xs text-white/50 shrink-0">
                剩余 {remaining} 次
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div
              className="rounded-xl border shadow-sm p-5 space-y-4"
              style={{ background: "var(--edu-surface)", borderColor: "var(--edu-border)" }}
            >
              <h2 className="text-base font-bold" style={{ color: "var(--edu-text)", fontFamily: "'Noto Serif SC', serif" }}>
                描述你的教具需求
              </h2>
              <p className="text-xs leading-relaxed" style={{ color: "var(--edu-text-muted)" }}>
                用口语写清楚「要教什么、希望怎么操作」。系统会先整理成标准需求说明，再生成页面；无需填写名称、章节或配色。
              </p>

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

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  需求描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="例如：做一个认识长方体和正方体的教具，能拖拽改变长宽高的滑块，立体图形用简单透视画出来，并显示体积公式。"
                  maxLength={800}
                  rows={8}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 resize-y min-h-[160px]"
                />
                <p className="text-xs text-slate-400 mt-1 text-right">
                  {description.length}/800
                </p>
              </div>
            </div>

            {/* 分阶段进度指示 */}
            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <svg
                    className="w-5 h-5 animate-spin text-blue-500 shrink-0"
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
                  <span className="text-sm font-medium text-slate-700">
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
                {/* 步骤条 */}
                <div className="flex items-center gap-1">
                  {STAGE_ORDER.map((s, i) => {
                    const isActive = i === currentStepIndex;
                    const isDone = i < currentStepIndex;
                    return (
                      <div key={s} className="flex-1 flex items-center gap-1">
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-colors duration-500 ${
                            isDone
                              ? "bg-blue-500"
                              : isActive
                                ? "bg-blue-400 animate-pulse"
                                : "bg-slate-200"
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className={currentStepIndex >= 0 ? "text-blue-500 font-medium" : ""}>分析需求</span>
                  <span className={currentStepIndex >= 1 ? "text-blue-500 font-medium" : ""}>生成页面</span>
                  <span className={currentStepIndex >= 2 ? "text-blue-500 font-medium" : ""}>保存</span>
                </div>
              </div>
            )}

            {refinedSpec && (
              <details className="bg-slate-50 rounded-xl border border-slate-200">
                <summary className="px-4 py-3 cursor-pointer text-xs font-bold text-slate-600 list-none [&::-webkit-details-marker]:hidden flex items-center gap-2">
                  <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  AI 整理后的需求说明
                </summary>
                <div className="px-4 pb-3">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto">
                    {refinedSpec}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: loading ? "#94a3b8" : BTN_GRADIENT,
                }}
              >
                {loading ? "生成中…" : "生成教具"}
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
              {savedTool && (
                <button
                  type="button"
                  onClick={() => {
                    setPreviewHtml("");
                    setSavedTool(null);
                    setRefinedSpec("");
                    setError("");
                    // 保留描述，让用户可以微调后重新生成
                  }}
                  className="px-4 py-2.5 rounded-xl font-semibold text-sm border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                >
                  重新生成
                </button>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {savedTool && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <p className="text-sm font-semibold text-green-800 mb-2">
                  教具生成成功！
                </p>
                <div className="flex gap-2 flex-wrap">
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

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  background: previewHtml ? "#22c55e" : "#94a3b8",
                }}
              />
              <span className="text-xs font-medium text-slate-500 truncate">
                {previewHtml
                  ? `${gradeName} · ${subjectName} · ${previewTitle}`
                  : "预览区域（生成后显示）"}
              </span>
            </div>
            <div className="h-[600px]">
              {previewHtml ? (
                <PreviewIframe html={previewHtml} />
              ) : (
                <div className="h-full flex items-center justify-center text-slate-300">
                  <div className="text-center px-4">
                    <div className="text-4xl mb-3">📐</div>
                    <p className="text-sm text-slate-400">
                      选择年级与学科，写清需求后点击「生成教具」
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

function PreviewIframe({ html }: { html: string }) {
  const url = useMemo(() => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
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
