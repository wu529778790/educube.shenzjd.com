import type { AgentStreamEvent } from "@/lib/agent/types";

export interface StreamAgentMessageInput {
  message: string;
  sessionId?: string;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => void;
}

export interface SaveAgentToolInput {
  sessionId: string;
  gradeId: string;
  subjectId: string;
  semester: "上册" | "下册";
}

export interface SaveAgentToolResult {
  ok: boolean;
  error?: string;
}

export async function streamAgentMessage(
  input: StreamAgentMessageInput,
): Promise<void> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: input.message,
      sessionId: input.sessionId,
    }),
    signal: input.signal,
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: "请求失败" })) as { error?: string };
    throw new Error(error.error || "请求失败");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("无法读取响应流");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    const parsed = parseAgentSseChunk(
      buffer + decoder.decode(value, { stream: true }),
    );
    buffer = parsed.remainder;

    for (const event of parsed.events) {
      input.onEvent(event);
    }
  }
}

export async function saveAgentTool(
  input: SaveAgentToolInput,
): Promise<SaveAgentToolResult> {
  const response = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "",
      action: "save",
      sessionId: input.sessionId,
      saveMeta: {
        gradeId: input.gradeId,
        subjectId: input.subjectId,
        semester: input.semester,
      },
    }),
  });

  return response.json() as Promise<SaveAgentToolResult>;
}

export async function restartAgentSession(sessionId: string): Promise<void> {
  await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "",
      action: "restart",
      sessionId,
    }),
  });
}

export function parseAgentSseChunk(input: string): {
  events: AgentStreamEvent[];
  remainder: string;
} {
  const lines = input.split("\n");
  const remainder = lines.pop() || "";
  const events: AgentStreamEvent[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) {
      continue;
    }

    try {
      events.push(JSON.parse(trimmed.slice(5)) as AgentStreamEvent);
    } catch (error) {
      console.error("[SSE parse error]", error, trimmed);
    }
  }

  return { events, remainder };
}
