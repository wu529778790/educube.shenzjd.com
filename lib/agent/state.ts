import type { SessionState } from "@/lib/agent/types";
import type {
  AgentCreateResult,
  AgentModifyResult,
} from "@/lib/agent/workflow";

export function createEmptySessionState(): SessionState {
  return {
    messages: [],
    currentHtml: null,
    currentSpec: null,
    stage: "idle",
    toolName: null,
    chapter: null,
    grade: null,
    subject: null,
  };
}

export function cloneSessionState(state: SessionState): SessionState {
  return {
    ...state,
    messages: state.messages.map((message) => ({ ...message })),
    currentSpec: state.currentSpec ? { ...state.currentSpec } : null,
  };
}

export function applyCreateResultToSession(
  state: SessionState,
  result: AgentCreateResult,
): void {
  state.toolName = result.toolName;
  state.currentSpec = result.spec;
  state.currentHtml = result.html;
  state.stage = "idle";
  state.messages.push({
    role: "assistant",
    content: `已生成教具「${result.toolName}」`,
  });
}

export function applyModifyResultToSession(
  state: SessionState,
  userInput: string,
  result: AgentModifyResult,
): void {
  state.currentHtml = result.html;
  state.currentSpec = result.spec;
  state.stage = "idle";
  state.messages.push({
    role: "assistant",
    content: `已按"${userInput}"修改了教具`,
  });
}
