import type { Tool } from "./types";

/** 七年级教具 */
export const j7Tools: Tool[] = [
  {
    id: "cross-section",
    name: "几何体截面探究",
    subtitle: "几何图形初步",
    chapter: "上册 · 第四章",
    semester: "上册",
    unitNum: 4,
    gradeId: "j7",
    subjectId: "math",
    description:
      "6种几何体（正方体、圆柱、圆锥、球、三棱柱、四棱锥）的截面探究，调节高度和角度查看不同截面形状，覆盖三角形到六边形。",
    tags: ["截面", "几何体", "立体图形", "切面"],
    gradient: ["#EC4899", "#DB2777"],
    icon: "✂️",
  },
  {
    id: "surface-revolve",
    name: "旋转体生成",
    subtitle: "几何图形初步",
    chapter: "上册 · 第四章",
    semester: "上册",
    unitNum: 4,
    gradeId: "j7",
    subjectId: "math",
    description:
      "平面图形（长方形、直角三角形、半圆、梯形、圆）绕轴旋转生成圆柱、圆锥、球、圆台等旋转体，配有旋转动画演示。",
    tags: ["旋转体", "面动成体", "圆柱", "圆锥", "球"],
    gradient: ["#10B981", "#059669"],
    icon: "🔄",
  },
  {
    id: "prism-explore",
    name: "棱柱认识与展开图",
    subtitle: "几何图形初步",
    chapter: "上册 · 第四章",
    semester: "上册",
    unitNum: 4,
    gradeId: "j7",
    subjectId: "math",
    description:
      "三至六棱柱的3D展示，切换展开图，滑块调高度和半径，实时显示棱数、顶点数、面数、体积等属性，验证欧拉公式。",
    tags: ["棱柱", "展开图", "欧拉公式", "顶点棱面"],
    gradient: ["#3B82F6", "#2563EB"],
    icon: "🔷",
  },
];
