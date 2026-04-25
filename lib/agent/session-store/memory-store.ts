import { randomUUID } from "crypto";
import {
  cloneSessionState,
  createEmptySessionState,
} from "@/lib/agent/state";
import type { SessionState } from "@/lib/agent/types";
import type {
  AgentSessionSnapshot,
  AgentSessionStore,
} from "@/lib/agent/session-store/store";

interface StoredSession {
  state: SessionState;
  updatedAt: number;
}

const SESSION_TTL = 2 * 60 * 60 * 1000;
const MAX_SESSIONS = 500;

export class MemoryAgentSessionStore implements AgentSessionStore {
  private sessionStore = new Map<string, StoredSession>();

  getOrCreate(sessionId?: string): AgentSessionSnapshot {
    const now = Date.now();
    this.prune(now);

    if (sessionId) {
      const existing = this.sessionStore.get(sessionId);
      if (existing) {
        existing.updatedAt = now;
        return {
          sessionId,
          state: cloneSessionState(existing.state),
        };
      }
    }

    const nextSessionId = randomUUID();
    const state = createEmptySessionState();
    this.sessionStore.set(nextSessionId, { state, updatedAt: now });
    return {
      sessionId: nextSessionId,
      state: cloneSessionState(state),
    };
  }

  save(sessionId: string, state: SessionState): void {
    const now = Date.now();
    this.prune(now);
    this.sessionStore.set(sessionId, {
      state: cloneSessionState(state),
      updatedAt: now,
    });
  }

  get(sessionId: string): SessionState | null {
    const now = Date.now();
    this.prune(now);
    const existing = this.sessionStore.get(sessionId);
    if (!existing) return null;
    existing.updatedAt = now;
    return cloneSessionState(existing.state);
  }

  delete(sessionId: string): void {
    this.sessionStore.delete(sessionId);
  }

  private prune(now: number): void {
    for (const [sessionId, record] of this.sessionStore) {
      if (now - record.updatedAt > SESSION_TTL) {
        this.sessionStore.delete(sessionId);
      }
    }

    if (this.sessionStore.size <= MAX_SESSIONS) return;

    const entries = [...this.sessionStore.entries()].sort(
      (a, b) => a[1].updatedAt - b[1].updatedAt,
    );
    const overflow = this.sessionStore.size - MAX_SESSIONS;
    for (let i = 0; i < overflow; i++) {
      this.sessionStore.delete(entries[i][0]);
    }
  }
}
