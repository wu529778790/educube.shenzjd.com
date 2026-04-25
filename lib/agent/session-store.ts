import type { SessionState } from "@/lib/agent/types";
import { getDefaultAgentSessionStore } from "@/lib/agent/session-store/provider";
import type { AgentSessionSnapshot } from "@/lib/agent/session-store/store";

const store = getDefaultAgentSessionStore();

export type { AgentSessionSnapshot } from "@/lib/agent/session-store/store";

export function getOrCreateAgentSession(
  sessionId?: string,
): AgentSessionSnapshot {
  return store.getOrCreate(sessionId);
}

export function saveAgentSession(
  sessionId: string,
  state: SessionState,
): void {
  store.save(sessionId, state);
}

export function getAgentSession(
  sessionId: string,
): SessionState | null {
  return store.get(sessionId);
}

export function deleteAgentSession(sessionId: string): void {
  store.delete(sessionId);
}
