import type { ChatMessage } from "@/components/agent/types";

const STAGE_LABELS: Record<string, string> = {
  thinking: "思考中...",
  planning: "规划教具",
  generating: "生成代码",
  reviewing: "质量检查",
  editing: "修改中",
  done: "完成",
  error: "出错了",
};

export interface AgentMessageDisplayInfo {
  contentLines: string[];
  showStageBadge: boolean;
  stageClassName: string | null;
  stageLabel: string | null;
}

export function getAgentMessageDisplayInfo(
  message: Pick<ChatMessage, "content" | "stage">,
): AgentMessageDisplayInfo {
  const showStageBadge = Boolean(
    message.stage &&
      message.stage !== "done" &&
      message.stage !== "error",
  );

  return {
    contentLines: message.content.split("\n"),
    showStageBadge,
    stageClassName: showStageBadge ? `stage-${message.stage}` : null,
    stageLabel: showStageBadge && message.stage
      ? STAGE_LABELS[message.stage] || message.stage
      : null,
  };
}
