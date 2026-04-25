import type { AgentStreamEvent } from "@/lib/agent/types";
import type { ChatMessage } from "@/components/agent/types";

const DEFAULT_WELCOME_MESSAGE =
  "你好！我是教立方的 AI 助手。\n\n你可以用自然语言描述你想创建的教学工具，我会帮你生成交互式教具。例如：\n\n• 「做一个三年级分数初步认识的工具」\n• 「生成一个五年级面积计算的互动教具」\n\n生成后你可以继续说「把颜色改成蓝色」「增加一个练习模式」来修改。";

const RESET_WELCOME_MESSAGE = "已重置。请描述你想创建的教具。";

export function createInitialChatMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "assistant",
      content: DEFAULT_WELCOME_MESSAGE,
    },
  ];
}

export function createResetChatMessages(): ChatMessage[] {
  return [
    {
      id: "welcome",
      role: "assistant",
      content: RESET_WELCOME_MESSAGE,
    },
  ];
}

export function createUserChatMessage(content: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    content,
  };
}

export function createAgentEventMessage(event: AgentStreamEvent): ChatMessage {
  return {
    id: `${event.type}-${Date.now()}`,
    role: "assistant",
    content: event.content,
    stage: event.type,
    actions: event.actions,
  };
}

export function createAgentErrorMessage(content: string): ChatMessage {
  return {
    id: `error-${Date.now()}`,
    role: "assistant",
    content,
    stage: "error",
  };
}

export function createSaveSuccessMessage(toolName?: string | null): ChatMessage {
  return {
    id: `save-${Date.now()}`,
    role: "assistant",
    content: `教具「${toolName || "自定义教具"}」已保存成功！`,
  };
}

export function createSaveErrorMessage(error: unknown): ChatMessage {
  return {
    id: `save-err-${Date.now()}`,
    role: "assistant",
    content: `保存失败：${error instanceof Error ? error.message : "请重试"}`,
    stage: "error",
  };
}

export function createRequestErrorMessage(error: unknown): ChatMessage {
  return createAgentErrorMessage(
    `出错了：${error instanceof Error ? error.message : "请重试"}`,
  );
}
