import { describe, expect, it } from "vitest";
import {
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
});
