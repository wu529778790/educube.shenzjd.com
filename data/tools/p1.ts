import type { Tool } from "./types";

/** 一年级教具（仅 3D） */
export const p1Tools: Tool[] = [
  {
    id: "shape-match",
    name: "立体图形认识与分类",
    subtitle: "认识图形（一）",
    chapter: "上册 · 第四单元",
    semester: "上册",
    unitNum: 4,
    gradeId: "p1",
    subjectId: "math",
    description:
      "3D展示正方体、长方体、圆柱、球四种基本立体图形，可旋转观察，每种图形配有属性介绍、生活实例和趣味知识，附带物品分类配对游戏。",
    tags: ["立体图形", "分类", "正方体", "长方体", "圆柱", "球"],
    gradient: ["#F59E0B", "#D97706"],
    icon: "🧊",
  },
];
