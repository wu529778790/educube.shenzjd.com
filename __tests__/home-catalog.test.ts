import { describe, expect, it } from "vitest";
import {
  buildCatalogSearchParams,
  getCatalogGradeId,
  getCatalogSearchInput,
  getCatalogTools,
  getDisplayTools,
} from "@/components/home/catalog";
import type { Tool } from "@/data/tools";

const sampleTools: Tool[] = [
  {
    id: "p5-upper-2",
    name: "分数教具",
    subtitle: "五年级上册",
    chapter: "上册 · 第二单元",
    semester: "上册",
    unitNum: 2,
    gradeId: "p5",
    subjectId: "math",
    description: "认识分数",
    tags: ["分数", "数感"],
    gradient: ["#111111", "#222222"],
    icon: "📐",
  },
  {
    id: "p5-lower-1",
    name: "面积教具",
    subtitle: "五年级下册",
    chapter: "下册 · 第一单元",
    semester: "下册",
    unitNum: 1,
    gradeId: "p5",
    subjectId: "math",
    description: "面积计算",
    tags: ["面积"],
    gradient: ["#333333", "#444444"],
    icon: "📏",
  },
  {
    id: "p4-upper-3",
    name: "角度教具",
    subtitle: "四年级上册",
    chapter: "上册 · 第三单元",
    semester: "上册",
    unitNum: 3,
    gradeId: "p4",
    subjectId: "math",
    description: "认识角度",
    tags: ["角"],
    gradient: ["#555555", "#666666"],
    icon: "📎",
  },
];

describe("home catalog helpers", () => {
  it("从 URL 参数解析年级与搜索词", () => {
    const params = new URLSearchParams("grade=p5&q=分数");

    expect(getCatalogGradeId(params)).toBe("p5");
    expect(getCatalogSearchInput(params)).toBe("分数");
    expect(getCatalogGradeId(new URLSearchParams())).toBe("all");
    expect(getCatalogSearchInput(new URLSearchParams())).toBe("");
  });

  it("构造目录 URL 参数", () => {
    expect(
      buildCatalogSearchParams({
        current: new URLSearchParams("grade=p5&q=旧词"),
        gradeId: "p4",
        query: "新词",
      }).toString(),
    ).toBe("grade=p4&q=%E6%96%B0%E8%AF%8D");

    expect(
      buildCatalogSearchParams({
        current: new URLSearchParams("grade=p5&q=旧词"),
        gradeId: "all",
        query: "",
      }).toString(),
    ).toBe("");
  });

  it("按目录筛选并按显示规则排序", () => {
    expect(getCatalogTools(sampleTools, "p5").map((tool) => tool.id)).toEqual([
      "p5-upper-2",
      "p5-lower-1",
    ]);

    expect(getDisplayTools(sampleTools, "").map((tool) => tool.id)).toEqual([
      "p5-upper-2",
      "p4-upper-3",
      "p5-lower-1",
    ]);
  });

  it("按搜索词过滤名称、描述、章节和标签", () => {
    expect(getDisplayTools(sampleTools, "面积").map((tool) => tool.id)).toEqual([
      "p5-lower-1",
    ]);
    expect(getDisplayTools(sampleTools, "第三单元").map((tool) => tool.id)).toEqual([
      "p4-upper-3",
    ]);
    expect(getDisplayTools(sampleTools, "数感").map((tool) => tool.id)).toEqual([
      "p5-upper-2",
    ]);
  });
});
