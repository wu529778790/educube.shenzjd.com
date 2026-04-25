import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { executeAgentChatAction } from "@/components/agent/action-handlers";

const { restartAgentSession, saveAgentTool } = vi.hoisted(() => ({
  restartAgentSession: vi.fn(),
  saveAgentTool: vi.fn(),
}));

vi.mock("@/lib/agent/client", () => ({
  restartAgentSession,
  saveAgentTool,
}));

beforeEach(() => {
  restartAgentSession.mockReset();
  saveAgentTool.mockReset();
  vi.spyOn(Date, "now").mockReturnValue(1234567890);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeAgentChatAction", () => {
  it("restart 动作会重置聊天状态并清理服务端 session", async () => {
    const appendMessage = vi.fn();
    const resetChatState = vi.fn();

    await executeAgentChatAction({
      action: "restart",
      appendMessage,
      inputRef: { current: null },
      resetChatState,
      sessionState: {
        sessionId: "sess-1",
        stage: "idle",
        toolName: "测试教具",
        chapter: "第一单元",
        grade: "p5",
        subject: "math",
      },
    });

    expect(restartAgentSession).toHaveBeenCalledWith("sess-1");
    expect(resetChatState).toHaveBeenCalled();
    expect(appendMessage).not.toHaveBeenCalled();
  });

  it("iterate 动作会聚焦输入框", async () => {
    const focus = vi.fn();

    await executeAgentChatAction({
      action: "iterate",
      appendMessage: vi.fn(),
      inputRef: { current: { focus } as unknown as HTMLTextAreaElement },
      resetChatState: vi.fn(),
      sessionState: null,
    });

    expect(focus).toHaveBeenCalled();
  });

  it("save 动作成功后追加成功消息", async () => {
    const appendMessage = vi.fn();
    saveAgentTool.mockResolvedValue({ ok: true });

    await executeAgentChatAction({
      action: "save",
      appendMessage,
      inputRef: { current: null },
      resetChatState: vi.fn(),
      sessionState: {
        sessionId: "sess-2",
        stage: "idle",
        toolName: "分数教具",
        chapter: "第一单元",
        grade: "p5",
        subject: "math",
      },
    });

    expect(saveAgentTool).toHaveBeenCalledWith({
      sessionId: "sess-2",
      gradeId: "p5",
      subjectId: "math",
      semester: "上册",
    });
    expect(appendMessage).toHaveBeenCalledWith({
      id: "save-1234567890",
      role: "assistant",
      content: "教具「分数教具」已保存成功！",
    });
  });

  it("save 动作失败后追加错误消息", async () => {
    const appendMessage = vi.fn();
    saveAgentTool.mockResolvedValue({ ok: false, error: "保存失败" });

    await executeAgentChatAction({
      action: "save",
      appendMessage,
      inputRef: { current: null },
      resetChatState: vi.fn(),
      sessionState: {
        sessionId: "sess-3",
        stage: "idle",
        toolName: null,
        chapter: "第一单元",
        grade: null,
        subject: null,
      },
    });

    expect(appendMessage).toHaveBeenCalledWith({
      id: "save-err-1234567890",
      role: "assistant",
      content: "保存失败：保存失败",
      stage: "error",
    });
  });
});
