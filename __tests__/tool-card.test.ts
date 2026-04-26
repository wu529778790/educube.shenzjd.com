import { describe, expect, it } from "vitest";
import { getToolCardViewModel } from "@/components/home/tool-card";
import type { Tool } from "@/data/tools";

const sampleTool: Tool = {
  id: "p5-upper-2",
  name: "分数教具",
  subtitle: "五年级上册",
  chapter: "上册 · 第二单元",
  semester: "上册",
  unitNum: 2,
  gradeId: "p5",
  subjectId: "math",
  description: "用于分数入门",
  tags: ["分数", "数感"],
  gradient: ["#111111", "#222222"],
  icon: "📐",
};

describe("tool card view model", () => {
  it("生成卡片展示所需文案和样式值", () => {
    expect(getToolCardViewModel(sampleTool, 2)).toEqual({
      animationDelay: "160ms",
      chapter: "上册 · 第二单元",
      description: "用于分数入门",
      gradientBorder: "1px solid #11111118",
      gradientTopBar: "linear-gradient(135deg, #111111, #222222)",
      gradeLabel: "五年级",
      hoverTitleColor: "#111111",
      icon: "📐",
      iconBackground: "linear-gradient(135deg, #11111114, #22222222)",
      iconBorder: "1px solid #11111118",
      name: "分数教具",
      semester: "上册",
      subtitle: "五年级上册",
      subtitleMeta: "五年级上册 · 五年级 · 上册",
      tagBackground: "#11111110",
      tagBorder: "1px solid #11111118",
      tagColor: "#111111",
      tags: ["分数", "数感"],
    });
  });

  it("在索引很大时限制动画延迟上限，并保留未知年级 id", () => {
    const viewModel = getToolCardViewModel(
      {
        ...sampleTool,
        gradeId: "custom-grade",
      },
      20,
    );

    expect(viewModel.animationDelay).toBe("800ms");
    expect(viewModel.gradeLabel).toBe("custom-grade");
    expect(viewModel.subtitleMeta).toBe("五年级上册 · custom-grade · 上册");
  });
});
