import { describe, expect, it } from "vitest";
import {
  createAgentCreateDoneEvent,
  createAgentErrorEvent,
  createAgentModifyDoneEvent,
  createAgentReviewEvent,
} from "@/lib/agent/events";
import { createEmptySessionState } from "@/lib/agent/state";

describe("agent event helpers", () => {
  it("构造创建完成事件", () => {
    expect(
      createAgentCreateDoneEvent({
        toolName: "分数教具",
        mode: "spec",
        html: "<html>created</html>",
        spec: { title: "分数教具" },
      }),
    ).toEqual({
      type: "done",
      content:
        '教具「分数教具」已生成！(Spec 模式)\n\n使用了组件框架渲染，交互更稳定。你可以说"修改XXX"来调整。',
      html: "<html>created</html>",
      spec: { title: "分数教具" },
      actions: [
        { label: "保存教具", action: "save" },
        { label: "继续优化", action: "iterate" },
        { label: "重新生成", action: "restart" },
      ],
    });
  });

  it("构造修改完成事件", () => {
    expect(
      createAgentModifyDoneEvent({
        html: "<html>modified</html>",
        spec: null,
      }),
    ).toEqual({
      type: "done",
      content: "已修改完成！右侧预览已更新。",
      html: "<html>modified</html>",
      spec: undefined,
      actions: [
        { label: "保存教具", action: "save" },
        { label: "继续优化", action: "iterate" },
      ],
    });
  });

  it("构造审查完成事件", () => {
    const state = createEmptySessionState();
    state.currentHtml = "<html>review</html>";

    expect(createAgentReviewEvent(state, "质量评分：95/100")).toEqual({
      type: "done",
      content: '审查完成：\n\n质量评分：95/100\n\n你可以说"修改XXX"来修复问题。',
      html: "<html>review</html>",
      actions: [
        { label: "自动修复", action: "autoFix" },
        { label: "保存教具", action: "save" },
      ],
    });
  });

  it("构造错误事件并支持附加尾句", () => {
    expect(
      createAgentErrorEvent("生成失败", new Error("boom"), "，请重试。"),
    ).toEqual({
      type: "error",
      content: "生成失败：boom，请重试。",
    });
  });
});
