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

export const dynamic = "force-dynamic";

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
          controller.enqueue(encoder.encode(formatSSE(event)));
        }

        // 发送最终状态
        const finalState = orchestrator.getState();
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "done",
              content: "",
              _state: finalState,
            } as Record<string, unknown> & { type: string; content: string }),
          ),
        );

        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            formatSSE({
              type: "error",
              content: `系统错误：${err instanceof Error ? err.message : "未知错误"}`,
            }),
          ),
        );
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
    const tool = await saveGeneratedTool(
      id,
      sessionState.currentHtml,
      {
        name: sessionState.toolName || "自定义教具",
        grade: meta.gradeId,
        subject: meta.subjectId,
        chapter: sessionState.chapter || "",
        description: `AI 生成的${sessionState.toolName || "教具"}`,
        gradient: ["#7c3aed", "#6366f1"] as [string, string],
        icon: "sparkles",
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

/* ── 辅助函数 ── */

function formatSSE(data: Record<string, unknown> | { type: string; content: string }): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}
