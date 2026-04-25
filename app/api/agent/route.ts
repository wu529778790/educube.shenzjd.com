/**
 * Agent API 端点 — SSE 流式响应
 *
 * POST /api/agent
 * Body: { message: string, sessionId?: string, action?: string }
 */

import { NextRequest } from "next/server";
import { handleAgentRestartAction, handleAgentSaveAction } from "@/lib/agent/route-actions";
import {
  readAgentRequestBody,
  validateAgentConversationMessage,
} from "@/lib/agent/route-request";
import { createAgentConversationResponse } from "@/lib/agent/route-stream";
import {
  getOrCreateAgentSession,
} from "@/lib/agent/session-store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await readAgentRequestBody(req);
  if (body instanceof Response) {
    return body;
  }

  const { message, sessionId, action, saveMeta } = body;

  if (action === "save" && sessionId && saveMeta) {
    return handleAgentSaveAction(sessionId, saveMeta);
  }

  if (action === "restart") {
    return handleAgentRestartAction(sessionId);
  }

  const validationError = validateAgentConversationMessage(message);
  if (validationError) {
    return validationError;
  }

  const session = getOrCreateAgentSession(sessionId);
  return createAgentConversationResponse({
    message,
    sessionId: session.sessionId,
    state: session.state,
  });
}
