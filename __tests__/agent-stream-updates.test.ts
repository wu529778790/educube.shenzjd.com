import { beforeEach, describe, expect, it, vi } from "vitest";
import { createAgentStreamStateUpdate } from "@/components/agent/stream-updates";

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(1234567890);
});

describe("agent stream state updates", () => {
  it("done 事件返回 session 和预览更新", () => {
    expect(
      createAgentStreamStateUpdate({
        type: "done",
        content: "",
        html: "<html></html>",
        _state: {
          sessionId: "sess-1",
          stage: "idle",
          toolName: "测试教具",
          chapter: "第一单元",
          grade: "p5",
          subject: "math",
        },
      }),
    ).toEqual({
      previewHtml: "<html></html>",
      sessionState: {
        sessionId: "sess-1",
        stage: "idle",
        toolName: "测试教具",
        chapter: "第一单元",
        grade: "p5",
        subject: "math",
      },
    });
  });

  it("error 事件返回错误消息", () => {
    expect(
      createAgentStreamStateUpdate({
        type: "error",
        content: "保存失败",
      }),
    ).toEqual({
      message: {
        id: "error-1234567890",
        role: "assistant",
        content: "保存失败",
        stage: "error",
      },
    });
  });

  it("普通事件返回消息和可选预览", () => {
    expect(
      createAgentStreamStateUpdate({
        type: "planning",
        content: "正在规划",
        html: "<html>preview</html>",
        actions: [{ label: "继续", action: "iterate" }],
      }),
    ).toEqual({
      message: {
        id: "planning-1234567890",
        role: "assistant",
        content: "正在规划",
        stage: "planning",
        actions: [{ label: "继续", action: "iterate" }],
      },
      previewHtml: "<html>preview</html>",
    });
  });
});
