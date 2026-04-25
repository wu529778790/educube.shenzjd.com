import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAgentErrorMessage,
  createAgentEventMessage,
  createInitialChatMessages,
  createRequestErrorMessage,
  createResetChatMessages,
  createSaveErrorMessage,
  createSaveSuccessMessage,
  createUserChatMessage,
} from "@/components/agent/messages";

beforeEach(() => {
  vi.spyOn(Date, "now").mockReturnValue(1234567890);
});

describe("agent message helpers", () => {
  it("创建初始欢迎消息和重置欢迎消息", () => {
    expect(createInitialChatMessages()).toEqual([
      expect.objectContaining({
        id: "welcome",
        role: "assistant",
      }),
    ]);
    expect(createResetChatMessages()).toEqual([
      {
        id: "welcome",
        role: "assistant",
        content: "已重置。请描述你想创建的教具。",
      },
    ]);
  });

  it("创建用户消息和事件消息", () => {
    expect(createUserChatMessage("你好")).toEqual({
      id: "user-1234567890",
      role: "user",
      content: "你好",
    });

    expect(
      createAgentEventMessage({
        type: "planning",
        content: "正在规划",
        actions: [{ label: "继续", action: "iterate" }],
      }),
    ).toEqual({
      id: "planning-1234567890",
      role: "assistant",
      content: "正在规划",
      stage: "planning",
      actions: [{ label: "继续", action: "iterate" }],
    });
  });

  it("创建错误和保存反馈消息", () => {
    expect(createAgentErrorMessage("出错了")).toEqual({
      id: "error-1234567890",
      role: "assistant",
      content: "出错了",
      stage: "error",
    });

    expect(createRequestErrorMessage(new Error("boom"))).toEqual({
      id: "error-1234567890",
      role: "assistant",
      content: "出错了：boom",
      stage: "error",
    });

    expect(createSaveSuccessMessage("分数教具")).toEqual({
      id: "save-1234567890",
      role: "assistant",
      content: "教具「分数教具」已保存成功！",
    });

    expect(createSaveErrorMessage(new Error("保存失败"))).toEqual({
      id: "save-err-1234567890",
      role: "assistant",
      content: "保存失败：保存失败",
      stage: "error",
    });
  });
});
