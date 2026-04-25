import { describe, expect, it } from "vitest";
import {
  getFilterGradeCounts,
  getJuniorGrades,
  getPrimaryGrades,
} from "@/components/home/filter-panel";
import type { Tool } from "@/data/tools";

const sampleTools: Tool[] = [
  {
    id: "p5-tool",
    name: "分数教具",
    subtitle: "五年级上册",
    chapter: "上册 · 第二单元",
    semester: "上册",
    unitNum: 2,
    gradeId: "p5",
    subjectId: "math",
    description: "认识分数",
    tags: ["分数"],
    gradient: ["#111111", "#222222"],
    icon: "📐",
  },
  {
    id: "p4-tool",
    name: "角度教具",
    subtitle: "四年级上册",
    chapter: "上册 · 第三单元",
    semester: "上册",
    unitNum: 3,
    gradeId: "p4",
    subjectId: "math",
    description: "认识角度",
    tags: ["角"],
    gradient: ["#333333", "#444444"],
    icon: "📎",
  },
  {
    id: "english-tool",
    name: "英语占位",
    subtitle: "五年级上册",
    chapter: "上册 · 第一单元",
    semester: "上册",
    unitNum: 1,
    gradeId: "p5",
    subjectId: "english",
    description: "不应计入数学筛选",
    tags: ["英语"],
    gradient: ["#555555", "#666666"],
    icon: "🔤",
  },
];

describe("home filter panel helpers", () => {
  it("按学科统计各年级数量并计算全部数量", () => {
    const counts = getFilterGradeCounts(sampleTools, "math");

    expect(counts.get("p5")).toBe(1);
    expect(counts.get("p4")).toBe(1);
    expect(counts.get("all")).toBe(2);
    expect(counts.has("english")).toBe(false);
  });

  it("返回小学和初中年级分组", () => {
    expect(getPrimaryGrades().map((grade) => grade.id)).toEqual([
      "p1",
      "p2",
      "p3",
      "p4",
      "p5",
      "p6",
    ]);
    expect(getJuniorGrades().map((grade) => grade.id)).toEqual([
      "j7",
      "j8",
      "j9",
    ]);
  });
});
