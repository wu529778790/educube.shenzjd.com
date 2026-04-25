/**
 * Agent API 端点 — SSE 流式响应
 *
 * POST /api/agent
 * Body: { message: string, sessionId?: string, action?: string }
 */

import { NextRequest } from "next/server";
import {
  type AgentSaveMeta,
  handleAgentRestartAction,
  handleAgentSaveAction,
} from "@/lib/agent/route-actions";
import { createAgentConversationResponse } from "@/lib/agent/route-stream";
import {
  getOrCreateAgentSession,
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

  const session = getOrCreateAgentSession(sessionId);
  return createAgentConversationResponse({
    message,
    sessionId: session.sessionId,
    state: session.state,
  });
}

function jsonError(msg: string, status: number) {
  return Response.json({ error: msg }, { status });
}
