import type { SessionState } from "@/lib/agent/orchestrator";

export interface AgentSessionSnapshot {
  sessionId: string;
  state: SessionState;
}

export interface AgentSessionStore {
  getOrCreate(sessionId?: string): AgentSessionSnapshot;
  save(sessionId: string, state: SessionState): void;
  get(sessionId: string): SessionState | null;
  delete(sessionId: string): void;
}
