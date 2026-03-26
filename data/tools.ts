export interface Tool {
  id: string;
  name: string;
  subtitle: string;
  chapter: string;
  grade: string;
  description: string;
  tags: string[];
  gradient: [string, string];
  icon: string;
}

export const tools: Tool[] = [
  {
    id: "three-views",
    name: "积木三视图观察器",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    grade: "人教版四年级",
    description: "切换正视图、侧视图、俯视图，直观理解从不同方向观察同一堆积木时看到的形状。",
    tags: ["三视图", "空间想象", "观察物体"],
    gradient: ["#3B82F6", "#0EA5E9"],
    icon: "🧊",
  },
  {
    id: "cube-unfold",
    name: "正方体展开图",
    subtitle: "空间想象辅助",
    chapter: "下册 · 第二单元",
    grade: "人教版四年级",
    description: "动态演示正方体六个面的展开与折叠过程，理解立体图形与平面展开图的对应关系。",
    tags: ["展开图", "折叠", "正方体"],
    gradient: ["#8B5CF6", "#A855F7"],
    icon: "📦",
  },
  {
    id: "3d-rotation",
    name: "立体图形旋转观察",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    grade: "人教版四年级",
    description: "拖拽鼠标自由旋转长方体、正方体、圆柱，全方位观察各面形状及顶点、棱、面的数量。",
    tags: ["拖拽旋转", "立体图形", "顶点/棱/面"],
    gradient: ["#F97316", "#FB923C"],
    icon: "🔄",
  },
  {
    id: "block-build",
    name: "积木拼搭三视图",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    grade: "人教版四年级",
    description: "在网格上自由摆放和移除积木，三个视图实时同步更新，帮助理解三视图与实物的对应。",
    tags: ["积木拼搭", "三视图联动", "交互"],
    gradient: ["#22C55E", "#10B981"],
    icon: "🏗️",
  },
  {
    id: "shape-rotate",
    name: "图形旋转变换",
    subtitle: "图形的运动",
    chapter: "下册 · 第七单元",
    grade: "人教版四年级",
    description: "选择旋转中心和旋转角度，动画演示图形围绕中心点旋转的过程，理解旋转变换规律。",
    tags: ["旋转", "图形运动", "旋转中心"],
    gradient: ["#EF4444", "#F43F5E"],
    icon: "🔁",
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}
