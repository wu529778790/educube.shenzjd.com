import type { AgentAction } from "@/lib/agent/types";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage?: string;
  actions?: AgentAction[];
}
