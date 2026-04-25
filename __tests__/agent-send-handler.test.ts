import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AgentStreamStateUpdate } from "@/components/agent/stream-updates";
import { executeAgentSendMessage } from "@/components/agent/send-handler";

const { streamAgentMessage } = vi.hoisted(() => ({
  streamAgentMessage: vi.fn(),
}));

vi.mock("@/lib/agent/client", () => ({
  streamAgentMessage,
}));

beforeEach(() => {
  streamAgentMessage.mockReset();
  vi.spyOn(Date, "now").mockReturnValue(1234567890);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("executeAgentSendMessage", () => {
  it("在空输入或 loading 中时直接返回", async () => {
    const appendMessage = vi.fn();
    const applyStreamUpdate = vi.fn();
    const setInput = vi.fn();
    const setLoading = vi.fn();

    await executeAgentSendMessage({
      appendMessage,
      applyStreamUpdate,
      isLoading: false,
      message: "   ",
      sessionId: "sess-1",
      setInput,
      setLoading,
    });

    await executeAgentSendMessage({
      appendMessage,
      applyStreamUpdate,
      isLoading: true,
      message: "做一个教具",
      sessionId: "sess-1",
      setInput,
      setLoading,
    });

    expect(streamAgentMessage).not.toHaveBeenCalled();
    expect(appendMessage).not.toHaveBeenCalled();
    expect(setLoading).not.toHaveBeenCalled();
  });

  it("发送消息并把流事件翻译成状态更新", async () => {
    const appendMessage = vi.fn();
    const applyStreamUpdate = vi.fn();
    const setInput = vi.fn();
    const setLoading = vi.fn();

    streamAgentMessage.mockImplementation(async ({ onEvent }) => {
      onEvent({
        type: "planning",
        content: "正在规划",
      });
    });

    await executeAgentSendMessage({
      appendMessage,
      applyStreamUpdate,
      isLoading: false,
      message: "做一个分数教具",
      sessionId: "sess-1",
      setInput,
      setLoading,
    });

    expect(setInput).toHaveBeenCalledWith("");
    expect(setLoading).toHaveBeenNthCalledWith(1, true);
    expect(appendMessage).toHaveBeenCalledWith({
      id: "user-1234567890",
      role: "user",
      content: "做一个分数教具",
    });
    expect(streamAgentMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "做一个分数教具",
        sessionId: "sess-1",
      }),
    );
    expect(applyStreamUpdate).toHaveBeenCalledWith({
      message: {
        id: "planning-1234567890",
        role: "assistant",
        content: "正在规划",
        stage: "planning",
        actions: undefined,
      },
      previewHtml: undefined,
    } satisfies AgentStreamStateUpdate);
    expect(setLoading).toHaveBeenLastCalledWith(false);
  });

  it("在请求失败时追加错误消息", async () => {
    const appendMessage = vi.fn();
    const applyStreamUpdate = vi.fn();
    const setInput = vi.fn();
    const setLoading = vi.fn();

    streamAgentMessage.mockRejectedValue(new Error("boom"));

    await executeAgentSendMessage({
      appendMessage,
      applyStreamUpdate,
      isLoading: false,
      message: "做一个分数教具",
      sessionId: "sess-1",
      setInput,
      setLoading,
    });

    expect(appendMessage).toHaveBeenLastCalledWith({
      id: "error-1234567890",
      role: "assistant",
      content: "出错了：boom",
      stage: "error",
    });
    expect(setLoading).toHaveBeenLastCalledWith(false);
    expect(applyStreamUpdate).not.toHaveBeenCalled();
  });
});
