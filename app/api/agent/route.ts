/**
 * Agent API 端点 — SSE 流式响应
 *
 * POST /api/agent
 * Body: { message: string, sessionId?: string, action?: string }
 */

import { NextRequest } from "next/server";
import { AgentOrchestrator } from "@/lib/agent/orchestrator";
import {
  type AgentSaveMeta,
  handleAgentRestartAction,
  handleAgentSaveAction,
} from "@/lib/agent/route-actions";
import type {
  AgentClientSessionState,
  AgentStreamEvent,
  SessionState,
} from "@/lib/agent/types";
import { createSseHeaders, formatSseData } from "@/lib/http/sse";
import { logger } from "@/lib/logger";
import {
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
  saveMeta?: AgentSaveMeta;
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
    return handleAgentSaveAction(sessionId, saveMeta);
  }

  if (action === "restart") {
    return handleAgentRestartAction(sessionId);
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
          const eventData = formatSseData(event);
          logger.debug("Agent SSE 事件", { event: eventData.trim() });
          controller.enqueue(encoder.encode(eventData));
        }

        const finalState = orchestrator.getState();
        saveAgentSession(session.sessionId, finalState);

        const finalEvent = formatSseData({
          type: "done",
          content: "",
          _state: toClientSessionState(session.sessionId, finalState),
        } satisfies AgentStreamEvent);
        logger.debug("Agent SSE 最终状态", { event: finalEvent.trim() });
        controller.enqueue(encoder.encode(finalEvent));
        controller.close();
      } catch (err) {
        const errorEvent = formatSseData({
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

  return new Response(stream, { headers: createSseHeaders() });
}

function toClientSessionState(
  sessionId: string,
  state: SessionState,
): AgentClientSessionState {
  return {
    sessionId,
    stage: state.stage,
    toolName: state.toolName,
    chapter: state.chapter,
    grade: state.grade,
    subject: state.subject,
  };
}

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}
