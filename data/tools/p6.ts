import type { Tool } from "./types";

/** 六年级教具（仅 3D） */
export const p6Tools: Tool[] = [
  {
    id: "cylinder-explore",
    name: "圆柱的认识",
    subtitle: "圆柱与圆锥",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    gradeId: "p6",
    subjectId: "math",
    description:
      "交互式圆柱3D展示，拖拽调高/底面半径，切换展开图，实时显示所有属性值。",
    tags: ["圆柱", "展开图", "侧面积", "3D"],
    gradient: ["#8B5CF6", "#7C3AED"],
    icon: "🥫",
  },
  {
    id: "cylinder-volume",
    name: "圆柱的表面积与体积",
    subtitle: "圆柱与圆锥",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    gradeId: "p6",
    subjectId: "math",
    description:
      "圆柱切割展开动画，滑块调参数实时算表面积和体积，面积组成占比可视化。",
    tags: ["圆柱", "表面积", "体积", "公式"],
    gradient: ["#8B5CF6", "#6D28D9"],
    icon: "📐",
  },
  {
    id: "cone-explore",
    name: "圆锥的认识与体积",
    subtitle: "圆柱与圆锥",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    gradeId: "p6",
    subjectId: "math",
    description:
      "圆锥3D展示+等底等高圆柱对比，倒沙实验动画推导 V=⅓Sh，直观理解体积关系。",
    tags: ["圆锥", "体积", "倒沙实验", "等底等高"],
    gradient: ["#F97316", "#FB923C"],
    icon: "🍦",
  },
];
