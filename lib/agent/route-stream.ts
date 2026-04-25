import { AgentOrchestrator } from "@/lib/agent/orchestrator";
import { saveAgentSession } from "@/lib/agent/session-store";
import type {
  AgentClientSessionState,
  AgentStreamEvent,
  SessionState,
} from "@/lib/agent/types";
import { createSseHeaders, formatSseData } from "@/lib/http/sse";
import { logger } from "@/lib/logger";

export function createAgentConversationResponse(input: {
  message: string;
  sessionId: string;
  state: SessionState;
}): Response {
  const encoder = new TextEncoder();
  const orchestrator = new AgentOrchestrator(input.state);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of orchestrator.handleMessage(input.message)) {
          const eventData = formatSseData(event);
          logger.debug("Agent SSE 事件", { event: eventData.trim() });
          controller.enqueue(encoder.encode(eventData));
        }

        const finalState = orchestrator.getState();
        saveAgentSession(input.sessionId, finalState);

        const finalEvent = formatSseData({
          type: "done",
          content: "",
          _state: toClientSessionState(input.sessionId, finalState),
        } satisfies AgentStreamEvent);
        logger.debug("Agent SSE 最终状态", { event: finalEvent.trim() });
        controller.enqueue(encoder.encode(finalEvent));
        controller.close();
      } catch (error) {
        const errorEvent = formatSseData({
          type: "error",
          content: `系统错误：${error instanceof Error ? error.message : "未知错误"}`,
        });
        logger.error("Agent SSE 失败", {
          event: errorEvent.trim(),
          message: error instanceof Error ? error.message : "未知错误",
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
