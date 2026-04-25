import type { RefObject } from "react";
import {
  createSaveErrorMessage,
  createSaveSuccessMessage,
} from "@/components/agent/messages";
import type { ChatMessage } from "@/components/agent/types";
import {
  restartAgentSession,
  saveAgentTool,
} from "@/lib/agent/client";
import type { AgentClientSessionState } from "@/lib/agent/types";

export interface ExecuteAgentChatActionInput {
  action: string;
  appendMessage: (message: ChatMessage) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  resetChatState: () => void;
  sessionState: AgentClientSessionState | null;
}

export async function executeAgentChatAction(
  input: ExecuteAgentChatActionInput,
): Promise<void> {
  switch (input.action) {
    case "restart":
      await executeRestartAction(input.sessionState, input.resetChatState);
      return;
    case "iterate":
      input.inputRef.current?.focus();
      return;
    case "save":
      await executeSaveAction(input.sessionState, input.appendMessage);
      return;
  }
}

async function executeRestartAction(
  sessionState: AgentClientSessionState | null,
  resetChatState: () => void,
): Promise<void> {
  if (sessionState?.sessionId) {
    await restartAgentSession(sessionState.sessionId);
  }

  resetChatState();
}

async function executeSaveAction(
  sessionState: AgentClientSessionState | null,
  appendMessage: (message: ChatMessage) => void,
): Promise<void> {
  if (!sessionState?.sessionId) {
    return;
  }

  try {
    const data = await saveAgentTool({
      sessionId: sessionState.sessionId,
      gradeId: sessionState.grade || "p5",
      subjectId: sessionState.subject || "math",
      semester: "上册",
    });

    if (data.ok) {
      appendMessage(createSaveSuccessMessage(sessionState.toolName));
      return;
    }

    throw new Error(data.error || "保存失败");
  } catch (error) {
    appendMessage(createSaveErrorMessage(error));
  }
}
