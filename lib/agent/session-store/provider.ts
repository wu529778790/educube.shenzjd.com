import { MemoryAgentSessionStore } from "@/lib/agent/session-store/memory-store";
import type { AgentSessionStore } from "@/lib/agent/session-store/store";

const memoryAgentSessionStore = new MemoryAgentSessionStore();

export function getDefaultAgentSessionStore(): AgentSessionStore {
  const backend = process.env.AGENT_SESSION_STORE ?? "memory";

  if (backend === "memory") {
    return memoryAgentSessionStore;
  }

  throw new Error(`Unsupported AGENT_SESSION_STORE backend: ${backend}`);
}
