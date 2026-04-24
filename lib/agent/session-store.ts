import { randomUUID } from "crypto";
import type { SessionState } from "@/lib/agent/orchestrator";

interface StoredSession {
  state: SessionState;
  updatedAt: number;
}

const SESSION_TTL = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 500;

const sessionStore = new Map<string, StoredSession>();

function pruneSessions(now: number): void {
  for (const [sessionId, record] of sessionStore) {
    if (now - record.updatedAt > SESSION_TTL) {
      sessionStore.delete(sessionId);
    }
  }

  if (sessionStore.size <= MAX_SESSIONS) return;

  const entries = [...sessionStore.entries()].sort(
    (a, b) => a[1].updatedAt - b[1].updatedAt,
  );
  const overflow = sessionStore.size - MAX_SESSIONS;
  for (let i = 0; i < overflow; i++) {
    sessionStore.delete(entries[i][0]);
  }
}

function emptyState(): SessionState {
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

export interface AgentSessionSnapshot {
  sessionId: string;
  state: SessionState;
}

export function getOrCreateAgentSession(
  sessionId?: string,
): AgentSessionSnapshot {
  const now = Date.now();
  pruneSessions(now);

  if (sessionId) {
    const existing = sessionStore.get(sessionId);
    if (existing) {
      existing.updatedAt = now;
      return {
        sessionId,
        state: { ...existing.state },
      };
    }
  }

  const nextSessionId = randomUUID();
  const state = emptyState();
  sessionStore.set(nextSessionId, { state, updatedAt: now });
  return {
    sessionId: nextSessionId,
    state,
  };
}

export function saveAgentSession(
  sessionId: string,
  state: SessionState,
): void {
  const now = Date.now();
  pruneSessions(now);
  sessionStore.set(sessionId, {
    state: {
      ...state,
      messages: [...state.messages],
      currentSpec: state.currentSpec ? { ...state.currentSpec } : null,
    },
    updatedAt: now,
  });
}

export function getAgentSession(
  sessionId: string,
): SessionState | null {
  const now = Date.now();
  pruneSessions(now);
  const existing = sessionStore.get(sessionId);
  if (!existing) return null;
  existing.updatedAt = now;
  return {
    ...existing.state,
    messages: [...existing.state.messages],
    currentSpec: existing.state.currentSpec
      ? { ...existing.state.currentSpec }
      : null,
  };
}

export function deleteAgentSession(sessionId: string): void {
  sessionStore.delete(sessionId);
}
