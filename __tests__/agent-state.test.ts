import { describe, expect, it } from "vitest";
import {
  applyCreateResultToSession,
  applyModifyResultToSession,
  cloneSessionState,
  createEmptySessionState,
} from "@/lib/agent/state";

describe("agent state helpers", () => {
  it("创建空 session state", () => {
    expect(createEmptySessionState()).toEqual({
      messages: [],
      currentHtml: null,
      currentSpec: null,
      stage: "idle",
      toolName: null,
      chapter: null,
      grade: null,
      subject: null,
    });
  });

  it("深拷贝消息数组和 spec", () => {
    const source = {
      messages: [{ role: "user" as const, content: "hello" }],
      currentHtml: "<html></html>",
      currentSpec: { title: "教具" },
      stage: "editing" as const,
      toolName: "测试教具",
      chapter: "第一单元",
      grade: "p5",
      subject: "math",
    };

    const cloned = cloneSessionState(source);
    cloned.messages[0].content = "changed";
    if (cloned.currentSpec) {
      cloned.currentSpec.title = "修改后";
    }

    expect(source.messages[0].content).toBe("hello");
    expect(source.currentSpec?.title).toBe("教具");
  });

  it("将创建结果写回 session state", () => {
    const state = createEmptySessionState();

    applyCreateResultToSession(state, {
      toolName: "分数教具",
      html: "<html>created</html>",
      spec: { title: "分数教具" },
      mode: "spec",
    });

    expect(state.toolName).toBe("分数教具");
    expect(state.currentHtml).toBe("<html>created</html>");
    expect(state.currentSpec).toEqual({ title: "分数教具" });
    expect(state.stage).toBe("idle");
    expect(state.messages.at(-1)).toEqual({
      role: "assistant",
      content: "已生成教具「分数教具」",
    });
  });

  it("将修改结果写回 session state", () => {
    const state = createEmptySessionState();
    state.stage = "editing";

    applyModifyResultToSession(state, "改成蓝色", {
      html: "<html>modified</html>",
      spec: null,
      mode: "html",
    });

    expect(state.currentHtml).toBe("<html>modified</html>");
    expect(state.currentSpec).toBeNull();
    expect(state.stage).toBe("idle");
    expect(state.messages.at(-1)).toEqual({
      role: "assistant",
      content: '已按"改成蓝色"修改了教具',
    });
  });
});
