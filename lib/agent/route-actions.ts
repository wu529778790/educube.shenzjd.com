import { publishGeneratedTool } from "@/lib/generated-tools/publish-generated-tool";
import {
  deleteAgentSession,
  getAgentSession,
} from "@/lib/agent/session-store";
import type { AgentStreamEvent } from "@/lib/agent/types";
import { createSseHeaders, formatSseData } from "@/lib/http/sse";

export interface AgentSaveMeta {
  gradeId: string;
  subjectId: string;
  semester: "上册" | "下册";
}

export async function handleAgentSaveAction(
  sessionId: string,
  meta: AgentSaveMeta,
): Promise<Response> {
  const sessionState = getAgentSession(sessionId);
  if (!sessionState?.currentHtml) {
    return jsonError("没有可保存的教具", 400);
  }

  try {
    const tool = await publishGeneratedTool({
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      html: sessionState.currentHtml,
      meta: {
        name: sessionState.toolName || "自定义教具",
        grade: meta.gradeId,
        subject: meta.subjectId,
        chapter: sessionState.chapter || "",
        description: `AI 生成的${sessionState.toolName || "教具"}`,
        gradient: ["#7c3aed", "#6366f1"] as [string, string],
        icon: "sparkles",
      },
    });

    return Response.json({
      ok: true,
      tool,
      message: `教具「${sessionState.toolName}」已保存`,
    });
  } catch (error) {
    return jsonError(
      `保存失败：${error instanceof Error ? error.message : "未知错误"}`,
      500,
    );
  }
}

export function handleAgentRestartAction(sessionId?: string): Response {
  if (sessionId) {
    deleteAgentSession(sessionId);
  }

  return new Response(
    formatSseData({
      type: "done",
      content: "已重置。请描述你想创建的教具。",
      _state: null,
    } satisfies AgentStreamEvent) + "\n",
    { headers: createSseHeaders() },
  );
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
