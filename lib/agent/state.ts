import type { SessionState } from "@/lib/agent/types";

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
