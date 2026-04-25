import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionState } from "@/lib/agent/types";

const deleteAgentSession = vi.fn();
const getAgentSession = vi.fn();
const getOrCreateAgentSession = vi.fn();
const saveAgentSession = vi.fn();
const publishGeneratedTool = vi.fn();

let orchestratorEvents: Array<Record<string, unknown>> = [];
let orchestratorFinalState: SessionState;

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
  deleteAgentSession,
  getAgentSession,
  getOrCreateAgentSession,
  saveAgentSession,
}));

vi.mock("@/lib/generated-tools/publish-generated-tool", () => ({
  publishGeneratedTool,
}));

vi.mock("@/lib/agent/orchestrator", () => ({
  AgentOrchestrator: vi.fn().mockImplementation(() => ({
    async *handleMessage() {
      for (const event of orchestratorEvents) {
        yield event;
      }
    },
    getState() {
      return orchestratorFinalState;
    },
  })),
}));

async function importRouteModule() {
  vi.resetModules();
  return import("@/app/api/agent/route");
}

function createJsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  orchestratorEvents = [];
  orchestratorFinalState = { ...baseState };
  deleteAgentSession.mockReset();
  getAgentSession.mockReset();
  getOrCreateAgentSession.mockReset();
  saveAgentSession.mockReset();
  publishGeneratedTool.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("/api/agent", () => {
  it("restart 动作会清理 session 并返回 done SSE", async () => {
    const { POST } = await importRouteModule();

    const response = await POST(
      createJsonRequest({
        message: "",
        action: "restart",
        sessionId: "sess-1",
      }) as never,
    );

    expect(deleteAgentSession).toHaveBeenCalledWith("sess-1");
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await response.text();
    expect(text).toContain("已重置。请描述你想创建的教具。");
    expect(text).toContain('"type":"done"');
    expect(text).toContain('"_state":null');
  });

  it("save 动作从服务端 session 读取 HTML 并触发首页刷新", async () => {
    const { POST } = await importRouteModule();
    getAgentSession.mockReturnValue(baseState);
    publishGeneratedTool.mockResolvedValue({
      id: "gen-1",
      name: "测试教具",
    });

    const response = await POST(
      createJsonRequest({
        message: "",
        action: "save",
        sessionId: "sess-2",
        saveMeta: {
          gradeId: "p5",
          subjectId: "math",
          semester: "上册",
        },
      }) as never,
    );

    expect(getAgentSession).toHaveBeenCalledWith("sess-2");
    expect(publishGeneratedTool).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^gen-/),
        html: baseState.currentHtml,
        meta: expect.objectContaining({
          name: "测试教具",
          grade: "p5",
          subject: "math",
        }),
      }),
    );

    const data = await response.json();
    expect(data.ok).toBe(true);
  });

  it("save 动作在 session 不存在时返回 400", async () => {
    const { POST } = await importRouteModule();
    getAgentSession.mockReturnValue(null);

    const response = await POST(
      createJsonRequest({
        message: "",
        action: "save",
        sessionId: "missing",
        saveMeta: {
          gradeId: "p5",
          subjectId: "math",
          semester: "上册",
        },
      }) as never,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "没有可保存的教具" });
  });

  it("普通消息会输出 SSE 并在结束时回写服务端 session", async () => {
    const { POST } = await importRouteModule();

    orchestratorEvents = [{ type: "thinking", content: "正在分析" }];
    orchestratorFinalState = {
      ...baseState,
      stage: "editing",
      toolName: "更新后的教具",
    };
    getOrCreateAgentSession.mockReturnValue({
      sessionId: "sess-3",
      state: baseState,
    });

    const response = await POST(
      createJsonRequest({
        message: "做一个分数教具",
        sessionId: "sess-3",
      }) as never,
    );

    const text = await response.text();
    expect(text).toContain('"type":"thinking"');
    expect(text).toContain('"content":"正在分析"');
    expect(text).toContain('"sessionId":"sess-3"');
    expect(text).toContain('"toolName":"更新后的教具"');
    expect(saveAgentSession).toHaveBeenCalledWith("sess-3", orchestratorFinalState);
  });
});
