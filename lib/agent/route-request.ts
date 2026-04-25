import type { NextRequest } from "next/server";
import type { AgentSaveMeta } from "@/lib/agent/route-actions";

export interface AgentRequestBody {
  message: string;
  sessionId?: string;
  action?: string;
  saveMeta?: AgentSaveMeta;
}

export async function readAgentRequestBody(
  request: NextRequest,
): Promise<AgentRequestBody | Response> {
  try {
    return (await request.json()) as AgentRequestBody;
  } catch {
    return jsonError("无效的请求体", 400);
  }
}

export function validateAgentConversationMessage(
  message: unknown,
): Response | null {
  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return jsonError("消息不能为空", 400);
  }

  if (message.length > 2000) {
    return jsonError("消息太长（最多 2000 字）", 400);
  }

  return null;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
