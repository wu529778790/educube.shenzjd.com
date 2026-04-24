import { MemoryAgentSessionStore } from "@/lib/agent/session-store/memory-store";
import type { AgentSessionStore } from "@/lib/agent/session-store/store";
import { AGENT_SESSION_STORE } from "@/lib/runtime-config";

const memoryAgentSessionStore = new MemoryAgentSessionStore();

export function getDefaultAgentSessionStore(): AgentSessionStore {
  if (AGENT_SESSION_STORE === "memory") {
    return memoryAgentSessionStore;
  }

  throw new Error(
    `Unsupported AGENT_SESSION_STORE backend: ${AGENT_SESSION_STORE}`,
  );
}
