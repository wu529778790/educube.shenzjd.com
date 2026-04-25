import {
  createRequestErrorMessage,
  createUserChatMessage,
} from "@/components/agent/messages";
import type { ChatMessage } from "@/components/agent/types";
import {
  createAgentStreamStateUpdate,
  type AgentStreamStateUpdate,
} from "@/components/agent/stream-updates";
import { streamAgentMessage } from "@/lib/agent/client";

const REQUEST_TIMEOUT_MS = 600000;

export interface ExecuteAgentSendMessageInput {
  appendMessage: (message: ChatMessage) => void;
  applyStreamUpdate: (update: AgentStreamStateUpdate) => void;
  isLoading: boolean;
  message: string;
  sessionId?: string;
  setInput: (value: string) => void;
  setLoading: (value: boolean) => void;
}

export async function executeAgentSendMessage(
  input: ExecuteAgentSendMessageInput,
): Promise<void> {
  const message = input.message.trim();
  if (!message || input.isLoading) {
    return;
  }

  input.setInput("");
  input.setLoading(true);
  input.appendMessage(createUserChatMessage(message));

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    await streamAgentMessage({
      message,
      sessionId: input.sessionId,
      signal: controller.signal,
      onEvent: (event) => {
        input.applyStreamUpdate(createAgentStreamStateUpdate(event));
      },
    });
  } catch (error) {
    input.appendMessage(createRequestErrorMessage(error));
  } finally {
    clearTimeout(timeoutId);
    input.setLoading(false);
  }
}
