import type {
  AgentAction,
  AgentEvent,
  SessionState,
} from "@/lib/agent/types";

const CREATE_ACTIONS: AgentAction[] = [
  { label: "保存教具", action: "save" },
  { label: "继续优化", action: "iterate" },
  { label: "重新生成", action: "restart" },
];

const MODIFY_ACTIONS: AgentAction[] = [
  { label: "保存教具", action: "save" },
  { label: "继续优化", action: "iterate" },
];

const REVIEW_ACTIONS: AgentAction[] = [
  { label: "自动修复", action: "autoFix" },
  { label: "保存教具", action: "save" },
];

export function createAgentErrorEvent(
  prefix: string,
  error: unknown,
  suffix?: string,
): AgentEvent {
  return {
    type: "error",
    content: `${prefix}：${error instanceof Error ? error.message : "未知错误"}${suffix ?? ""}`,
  };
}

export function createAgentReviewEvent(
  state: SessionState,
  summary: string,
): AgentEvent {
  return {
    type: "done",
    content: `审查完成：\n\n${summary}\n\n你可以说"修改XXX"来修复问题。`,
    html: state.currentHtml ?? undefined,
    actions: REVIEW_ACTIONS,
  };
}

export function createAgentCreateDoneEvent(input: {
  toolName: string;
  mode: "spec" | "html";
  html: string;
  spec: Record<string, unknown> | null;
}): AgentEvent {
  return {
    type: "done",
    content:
      input.mode === "spec"
        ? `教具「${input.toolName}」已生成！(Spec 模式)\n\n使用了组件框架渲染，交互更稳定。你可以说"修改XXX"来调整。`
        : `教具「${input.toolName}」已生成！(HTML 模式)\n\n你可以说"修改XXX"来调整。`,
    html: input.html,
    spec: input.spec ?? undefined,
    actions: CREATE_ACTIONS,
  };
}

export function createAgentModifyDoneEvent(input: {
  html: string;
  spec: Record<string, unknown> | null;
}): AgentEvent {
  return {
    type: "done",
    content: "已修改完成！右侧预览已更新。",
    html: input.html,
    spec: input.spec ?? undefined,
    actions: MODIFY_ACTIONS,
  };
}
