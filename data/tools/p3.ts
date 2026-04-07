import type { Tool } from "./types";

/** 三年级教具 */
export const p3Tools: Tool[] = [
  {
    id: "shape-explore",
    name: "认识立体图形",
    subtitle: "空间启蒙",
    chapter: "三年级 · 拓展",
    semester: "下册",
    unitNum: 0,
    gradeId: "p3",
    subjectId: "math",
    description:
      "通过3D旋转观察正方体、长方体、圆柱体、球体、圆锥体五种基本立体图形，了解各自的面、棱、顶点特征及生活中的实例。",
    tags: ["立体图形", "空间启蒙", "图形认识"],
    gradient: ["#F59E0B", "#F97316"],
    icon: "🎲",
  },
  {
    id: "block-count",
    name: "搭积木数一数",
    subtitle: "空间推理",
    chapter: "三年级 · 拓展",
    semester: "下册",
    unitNum: 0,
    gradeId: "p3",
    subjectId: "math",
    description:
      "观察3D积木堆，数出总共有多少块积木（包含被遮挡的隐藏积木），培养空间推理和分层计数能力。",
    tags: ["积木计数", "空间推理", "三视图"],
    gradient: ["#22C55E", "#16A34A"],
    icon: "🧱",
  },
];
