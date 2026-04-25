import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const deleteAgentSession = vi.fn();
const getAgentSession = vi.fn();
const publishGeneratedTool = vi.fn();

vi.mock("@/lib/agent/session-store", () => ({
  deleteAgentSession,
  getAgentSession,
}));

vi.mock("@/lib/generated-tools/publish-generated-tool", () => ({
  publishGeneratedTool,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/agent/route-actions");
}

beforeEach(() => {
  deleteAgentSession.mockReset();
  getAgentSession.mockReset();
  publishGeneratedTool.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("agent route actions", () => {
  it("restart 动作会清理 session 并返回 done SSE", async () => {
    const { handleAgentRestartAction } = await importModule();

    const response = handleAgentRestartAction("sess-1");

    expect(deleteAgentSession).toHaveBeenCalledWith("sess-1");
    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(await response.text()).toContain("已重置。请描述你想创建的教具。");
  });

  it("save 动作从服务端 session 读取 HTML 并保存", async () => {
    const { handleAgentSaveAction } = await importModule();
    getAgentSession.mockReturnValue({
      currentHtml: "<!DOCTYPE html><html></html>",
      toolName: "测试教具",
      chapter: "第一单元",
    });
    publishGeneratedTool.mockResolvedValue({
      id: "gen-1",
      name: "测试教具",
    });

    const response = await handleAgentSaveAction("sess-2", {
      gradeId: "p5",
      subjectId: "math",
      semester: "上册",
    });

    expect(getAgentSession).toHaveBeenCalledWith("sess-2");
    expect(publishGeneratedTool).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^gen-/),
        html: "<!DOCTYPE html><html></html>",
        meta: expect.objectContaining({
          name: "测试教具",
          grade: "p5",
          subject: "math",
        }),
      }),
    );
    expect(await response.json()).toEqual(
      expect.objectContaining({
        ok: true,
        message: "教具「测试教具」已保存",
      }),
    );
  });

  it("save 动作在 session 不存在时返回 400", async () => {
    const { handleAgentSaveAction } = await importModule();
    getAgentSession.mockReturnValue(null);

    const response = await handleAgentSaveAction("missing", {
      gradeId: "p5",
      subjectId: "math",
      semester: "上册",
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "没有可保存的教具" });
  });
});
