/**
 * Agent API 端点 — SSE 流式响应
 *
 * POST /api/agent
 * Body: { message: string, sessionState?: Partial<SessionState>, action?: string }
 */

import { NextRequest } from "next/server";
import { AgentOrchestrator } from "@/lib/agent/orchestrator";
import { saveGeneratedTool } from "@/data/generated-tools";
import type { SessionState } from "@/lib/agent/orchestrator";
import {
  extractClientIp,
  checkRateLimit,
  checkCsrfOrigin,
  acquireConnection,
  releaseConnection,
} from "@/lib/api-security";

export const dynamic = "force-dynamic";

const AGENT_RATE_LIMIT = 30;
const AGENT_RATE_WINDOW = 60 * 60 * 1000;
const MAX_CONCURRENT = 10;

interface AgentRequestBody {
  message: string;
  sessionState?: Partial<SessionState>;
  /** 快捷操作：save | restart */
  action?: string;
  /** 保存时需要的元数据 */
  saveMeta?: {
    gradeId: string;
    subjectId: string;
    semester: "上册" | "下册";
  };
}

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // CSRF 校验
  const csrfErr = checkCsrfOrigin(req);
  if (csrfErr) return csrfErr;

  // IP 限流
  if (!checkRateLimit(ip, AGENT_RATE_LIMIT, AGENT_RATE_WINDOW)) {
    return jsonError("请求过于频繁，请稍后再试", 429);
  }

  // 并发限制
  if (!acquireConnection(MAX_CONCURRENT)) {
    return jsonError("服务器繁忙，请稍后重试", 503);
  }

  try {
    return await handlePost(req);
  } finally {
    releaseConnection();
  }
}

async function handlePost(req: NextRequest) {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("无效的请求体", 400);
  }

  const { message, sessionState, action, saveMeta } = body;

  // ── 快捷操作：保存 ──
  if (action === "save" && sessionState?.currentHtml && saveMeta) {
    return handleSave(sessionState, saveMeta);
  }

  // ── 快捷操作：重新开始 ──
  if (action === "restart") {
    return new Response(
      formatSSE({
        type: "done",
        content: "已重置。请描述你想创建的教具。",
      }) + "\n",
      { headers: sseHeaders() },
    );
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return jsonError("消息不能为空", 400);
  }

  if (message.length > 2000) {
    return jsonError("消息太长（最多 2000 字）", 400);
  }

  // ── SSE 流式响应 ──
  const encoder = new TextEncoder();
  const orchestrator = new AgentOrchestrator(sessionState);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrator.handleMessage(message)) {
          const eventData = formatSSE(event);
          console.log("[Agent SSE]", eventData.trim()); // 调试日志
          controller.enqueue(encoder.encode(eventData));
        }

        // 发送最终状态
        const finalState = orchestrator.getState();
        const finalEvent = formatSSE({
          type: "done",
          content: "",
          _state: finalState,
        } as Record<string, unknown> & { type: string; content: string });
        console.log("[Agent SSE Final]", finalEvent.trim());
        controller.enqueue(encoder.encode(finalEvent));

        controller.close();
      } catch (err) {
        const errorEvent = formatSSE({
          type: "error",
          content: `系统错误：${err instanceof Error ? err.message : "未知错误"}`,
        });
        console.error("[Agent SSE Error]", errorEvent.trim());
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

/* ── 保存教具 ── */

async function handleSave(
  sessionState: Partial<SessionState>,
  meta: NonNullable<AgentRequestBody["saveMeta"]>,
) {
  if (!sessionState.currentHtml) {
    return jsonError("没有可保存的教具", 400);
  }

  try {
    const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const spec = sessionState.currentSpec as Record<string, unknown> | null;
    const gradient = extractGradient(spec);
    const icon = extractIcon(spec);

    const tool = await saveGeneratedTool(
      id,
      sessionState.currentHtml,
      {
        name: sessionState.toolName || "自定义教具",
        grade: meta.gradeId,
        subject: meta.subjectId,
        chapter: sessionState.chapter || "",
        description: `AI 生成的${sessionState.toolName || "教具"}`,
        gradient,
        icon,
      },
    );

    return Response.json({
      ok: true,
      tool,
      message: `教具「${sessionState.toolName}」已保存`,
    });
  } catch (err) {
    return jsonError(
      `保存失败：${err instanceof Error ? err.message : "未知错误"}`,
      500,
    );
  }
}

function extractGradient(spec: Record<string, unknown> | null): [string, string] {
  if (!spec) return ["#7c3aed", "#6366f1"];
  const bg = spec.bgGradient;
  if (typeof bg === "string" && bg.includes(",")) {
    const parts = bg.split(",").map((s) => s.trim());
    if (parts.length >= 2 && parts[0].startsWith("#") && parts[1].startsWith("#")) {
      return [parts[0], parts[1]] as [string, string];
    }
  }
  const theme = spec.themeColor;
  if (typeof theme === "string" && theme.startsWith("#")) {
    return [lightenColor(theme, 0.85), lightenColor(theme, 0.7)] as [string, string];
  }
  return ["#7c3aed", "#6366f1"];
}

function extractIcon(spec: Record<string, unknown> | null): string {
  if (!spec) return "sparkles";
  const icon = spec.icon;
  if (typeof icon === "string" && icon.trim().length > 0) return icon.trim();
  return "sparkles";
}

function lightenColor(hex: string, factor: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lr = Math.round(r + (255 - r) * factor);
  const lg = Math.round(g + (255 - g) * factor);
  const lb = Math.round(b + (255 - b) * factor);
  return `#${lr.toString(16).padStart(2, "0")}${lg.toString(16).padStart(2, "0")}${lb.toString(16).padStart(2, "0")}`;
}

/* ── 辅助函数 ── */

function formatSSE(data: Record<string, unknown> | { type: string; content: string }): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // 禁用 Nginx 缓冲
  };
}

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}
