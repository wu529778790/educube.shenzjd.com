import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionState } from "@/lib/agent/types";

const saveAgentSession = vi.fn();
const logger = {
  debug: vi.fn(),
  error: vi.fn(),
};

let orchestratorEvents: Array<Record<string, unknown>> = [];
let orchestratorFinalState: SessionState;
let orchestratorError: Error | null = null;

const baseState: SessionState = {
  messages: [],
  currentHtml: "<!DOCTYPE html><html></html>",
  currentSpec: null,
  stage: "idle",
  toolName: "测试教具",
  chapter: "第一单元",
  grade: "p5",
  subject: "math",
};

vi.mock("@/lib/agent/session-store", () => ({
  saveAgentSession,
}));

vi.mock("@/lib/logger", () => ({
  logger,
}));

vi.mock("@/lib/agent/orchestrator", () => ({
  AgentOrchestrator: vi.fn().mockImplementation(() => ({
    async *handleMessage() {
      if (orchestratorError) {
        throw orchestratorError;
      }
      for (const event of orchestratorEvents) {
        yield event;
      }
    },
    getState() {
      return orchestratorFinalState;
    },
  })),
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/agent/route-stream");
}

beforeEach(() => {
  orchestratorEvents = [];
  orchestratorFinalState = { ...baseState };
  orchestratorError = null;
  saveAgentSession.mockReset();
  logger.debug.mockReset();
  logger.error.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createAgentConversationResponse", () => {
  it("输出 SSE 事件并在结束时回写 session", async () => {
    const { createAgentConversationResponse } = await importModule();
    orchestratorEvents = [{ type: "thinking", content: "正在分析" }];
    orchestratorFinalState = {
      ...baseState,
      stage: "editing",
      toolName: "更新后的教具",
    };

    const response = createAgentConversationResponse({
      message: "做一个分数教具",
      sessionId: "sess-1",
      state: baseState,
    });

    const text = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(text).toContain('"type":"thinking"');
    expect(text).toContain('"sessionId":"sess-1"');
    expect(text).toContain('"toolName":"更新后的教具"');
    expect(saveAgentSession).toHaveBeenCalledWith("sess-1", orchestratorFinalState);
  });

  it("在 orchestrator 抛错时返回 error SSE", async () => {
    const { createAgentConversationResponse } = await importModule();
    orchestratorError = new Error("boom");

    const response = createAgentConversationResponse({
      message: "做一个分数教具",
      sessionId: "sess-1",
      state: baseState,
    });

    const text = await response.text();

    expect(text).toContain('"type":"error"');
    expect(text).toContain("系统错误：boom");
    expect(logger.error).toHaveBeenCalled();
  });
});
