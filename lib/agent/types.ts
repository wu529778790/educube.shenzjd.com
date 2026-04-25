export type AgentStage =
  | "idle"
  | "planning"
  | "generating"
  | "reviewing"
  | "editing";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentAction {
  label: string;
  action: string;
}

export interface AgentEvent {
  type:
    | "thinking"
    | "planning"
    | "generating"
    | "reviewing"
    | "editing"
    | "done"
    | "error";
  content: string;
  html?: string;
  spec?: Record<string, unknown>;
  actions?: AgentAction[];
}

export interface SessionState {
  messages: AgentMessage[];
  currentHtml: string | null;
  currentSpec: Record<string, unknown> | null;
  stage: AgentStage;
  toolName: string | null;
  chapter: string | null;
  grade: string | null;
  subject: string | null;
}

export interface AgentClientSessionState {
  sessionId: string;
  stage: SessionState["stage"];
  toolName: string | null;
  chapter: string | null;
  grade: string | null;
  subject: string | null;
}

export interface AgentStreamEvent extends AgentEvent {
  _state?: AgentClientSessionState | null;
}
