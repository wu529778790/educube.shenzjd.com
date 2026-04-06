import type { Tool } from "./types";

/** 五年级教具（仅 3D） */
export const p5Tools: Tool[] = [
  {
    id: "observe-obj3",
    name: "观察物体（三）",
    subtitle: "观察物体（三）",
    chapter: "下册 · 第一单元",
    semester: "下册",
    unitNum: 1,
    gradeId: "p5",
    subjectId: "math",
    description:
      "3D网格中放置和移除积木，同时显示正视图、侧视图、俯视图，支持预设形状和叠高操作。",
    tags: ["观察物体", "三视图", "积木", "空间想象"],
    gradient: ["#3B82F6", "#0EA5E9"],
    icon: "👀",
  },
  {
    id: "cuboid-explore",
    name: "长方体的认识",
    subtitle: "长方体和正方体",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    gradeId: "p5",
    subjectId: "math",
    description:
      "3D长方体标注顶点、棱、面，滑块调整长宽高，高亮显示顶点/棱/面，列出棱长和面积。",
    tags: ["长方体", "顶点", "棱", "面", "3D"],
    gradient: ["#3B82F6", "#2563EB"],
    icon: "📦",
  },
  {
    id: "cuboid-volume",
    name: "长方体表面积与体积",
    subtitle: "长方体和正方体",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    gradeId: "p5",
    subjectId: "math",
    description:
      "3D长方体可调尺寸，展开动画显示6个面，计算表面积和体积，单位立方体填充可视化。",
    tags: ["长方体", "表面积", "体积", "展开图"],
    gradient: ["#8B5CF6", "#6D28D9"],
    icon: "🧊",
  },
];
