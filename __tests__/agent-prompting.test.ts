import { describe, expect, it, vi } from "vitest";

vi.mock("@/data/prompt-template", () => ({
  buildSystemPrompt: vi.fn(() => "SYSTEM_PROMPT"),
}));

import {
  buildCreateFallbackHtmlPrompt,
  buildEditPrompt,
  buildEditSpecPrompt,
  buildFallbackSystemPrompt,
} from "@/lib/agent/prompting";

describe("agent prompting helpers", () => {
  it("构造 fallback HTML 生成 prompt", () => {
    const prompt = buildCreateFallbackHtmlPrompt({
      name: "分数教具",
      gradeLabel: "五年级",
      subjectLabel: "数学",
      refinedSpec: "展示分数圆并支持拖动分子分母",
    });

    expect(prompt).toContain("教具名称：分数教具");
    expect(prompt).toContain("适用年级：五年级");
    expect(prompt).toContain("<requirement>");
    expect(prompt).toContain("展示分数圆并支持拖动分子分母");
  });

  it("在修改 spec prompt 中包含最近对话上下文", () => {
    const prompt = buildEditSpecPrompt(
      '{"title":"分数"}',
      "把颜色改成蓝色",
      [
        { role: "user", content: "做一个分数教具" },
        { role: "assistant", content: "已经生成了一个版本" },
      ],
    );

    expect(prompt).toContain("当前教具的 JSON Spec");
    expect(prompt).toContain("用户: 做一个分数教具");
    expect(prompt).toContain("助手: 已经生成了一个版本");
    expect(prompt).toContain("把颜色改成蓝色");
  });

  it("在修改 html prompt 中省略空上下文块", () => {
    const prompt = buildEditPrompt(
      "<html></html>",
      "增加一个练习模式",
      [],
    );

    expect(prompt).toContain("当前教具代码如下");
    expect(prompt).not.toContain("## 对话上下文");
    expect(prompt).toContain("增加一个练习模式");
  });

  it("复用原始 HTML 生成 system prompt", () => {
    expect(buildFallbackSystemPrompt()).toBe("SYSTEM_PROMPT");
  });
});
