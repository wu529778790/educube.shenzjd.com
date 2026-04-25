import {
  createAgentErrorMessage,
  createAgentEventMessage,
} from "@/components/agent/messages";
import type { ChatMessage } from "@/components/agent/types";
import type {
  AgentClientSessionState,
  AgentStreamEvent,
} from "@/lib/agent/types";

export interface AgentStreamStateUpdate {
  message?: ChatMessage;
  previewHtml?: string;
  sessionState?: AgentClientSessionState | null;
}

export function createAgentStreamStateUpdate(
  event: AgentStreamEvent,
): AgentStreamStateUpdate {
  if (event.type === "done") {
    return {
      previewHtml: event.html,
      sessionState: event._state,
    };
  }

  if (event.type === "error") {
    return {
      message: createAgentErrorMessage(event.content),
    };
  }

  return {
    message: createAgentEventMessage(event),
    previewHtml: event.html,
  };
}
