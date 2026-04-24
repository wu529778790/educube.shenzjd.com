/**
 * Agent API 端点 — SSE 流式响应
 *
 * POST /api/agent
 * Body: { message: string, sessionId?: string, action?: string }
 */

import { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { AgentOrchestrator } from "@/lib/agent/orchestrator";
import { saveGeneratedTool } from "@/data/generated-tools";
import type { SessionState } from "@/lib/agent/orchestrator";
import { logger } from "@/lib/logger";
import {
  deleteAgentSession,
  getAgentSession,
  getOrCreateAgentSession,
  saveAgentSession,
} from "@/lib/agent/session-store";

export const dynamic = "force-dynamic";

interface AgentRequestBody {
  message: string;
  sessionId?: string;
  /** 快捷操作：save | restart */
  action?: string;
  /** 保存时需要的元数据 */
  saveMeta?: {
    gradeId: string;
    subjectId: string;
    semester: "上册" | "下册";
  };
}

interface ClientSessionState {
  sessionId: string;
  stage: SessionState["stage"];
  toolName: string | null;
  chapter: string | null;
  grade: string | null;
  subject: string | null;
}

export async function POST(req: NextRequest) {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonError("无效的请求体", 400);
  }

  const { message, sessionId, action, saveMeta } = body;

  if (action === "save" && sessionId && saveMeta) {
    return handleSave(sessionId, saveMeta);
  }

  if (action === "restart") {
    if (sessionId) {
      deleteAgentSession(sessionId);
    }
    return new Response(
      formatSSE({
        type: "done",
        content: "已重置。请描述你想创建的教具。",
        _state: null,
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

  const encoder = new TextEncoder();
  const session = getOrCreateAgentSession(sessionId);
  const orchestrator = new AgentOrchestrator(session.state);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrator.handleMessage(message)) {
          const eventData = formatSSE(event);
          logger.debug("Agent SSE 事件", { event: eventData.trim() });
          controller.enqueue(encoder.encode(eventData));
        }

        const finalState = orchestrator.getState();
        saveAgentSession(session.sessionId, finalState);

        const finalEvent = formatSSE({
          type: "done",
          content: "",
          _state: toClientSessionState(session.sessionId, finalState),
        } as Record<string, unknown> & { type: string; content: string });
        logger.debug("Agent SSE 最终状态", { event: finalEvent.trim() });
        controller.enqueue(encoder.encode(finalEvent));
        controller.close();
      } catch (err) {
        const errorEvent = formatSSE({
          type: "error",
          content: `系统错误：${err instanceof Error ? err.message : "未知错误"}`,
        });
        logger.error("Agent SSE 失败", {
          event: errorEvent.trim(),
          message: err instanceof Error ? err.message : "未知错误",
        });
        controller.enqueue(encoder.encode(errorEvent));
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: sseHeaders() });
}

async function handleSave(
  sessionId: string,
  meta: NonNullable<AgentRequestBody["saveMeta"]>,
) {
  const sessionState = getAgentSession(sessionId);
  if (!sessionState?.currentHtml) {
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
    revalidatePath("/");

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

function toClientSessionState(
  sessionId: string,
  state: SessionState,
): ClientSessionState {
  return {
    sessionId,
    stage: state.stage,
    toolName: state.toolName,
    chapter: state.chapter,
    grade: state.grade,
    subject: state.subject,
  };
}

function formatSSE(
  data: Record<string, unknown> | { type: string; content: string },
): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function sseHeaders(): HeadersInit {
  return {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  };
}

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}
