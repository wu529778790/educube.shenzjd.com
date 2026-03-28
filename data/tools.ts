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
  {
    id: "angle-measure",
    name: "量角器与角度测量",
    subtitle: "角的度量",
    chapter: "上册 · 第三单元",
    grade: "人教版四年级",
    description: "模拟量角器测量角度，拖拽射线改变角度大小，认识锐角、直角、钝角、平角。",
    tags: ["量角器", "角度", "锐角/钝角"],
    gradient: ["#F97316", "#F59E0B"],
    icon: "📐",
  },
  {
    id: "triangle-classify",
    name: "三角形分类演示",
    subtitle: "三角形",
    chapter: "下册 · 第五单元",
    grade: "人教版四年级",
    description: "拖拽三角形顶点实时改变形状，自动按角和按边分类，观察角度与边长变化。",
    tags: ["三角形分类", "锐角/直角/钝角", "等边/等腰"],
    gradient: ["#A855F7", "#7C3AED"],
    icon: "🔺",
  },
  {
    id: "ops-order",
    name: "四则运算顺序演示",
    subtitle: "四则运算",
    chapter: "下册 · 第一单元",
    grade: "人教版四年级",
    description: "输入四则运算式，逐步演示运算顺序：先括号、再乘除、后加减，每步高亮当前运算。",
    tags: ["运算顺序", "括号", "混合运算"],
    gradient: ["#22C55E", "#16A34A"],
    icon: "🔢",
  },
  {
    id: "parallel-perp",
    name: "平行与垂直演示",
    subtitle: "平行四边形和梯形",
    chapter: "上册 · 第五单元",
    grade: "人教版四年级",
    description: "拖拽两条直线的端点，观察平行、垂直、斜交等位置关系，实时计算夹角。",
    tags: ["平行", "垂直", "位置关系"],
    gradient: ["#3B82F6", "#6366F1"],
    icon: "📏",
  },
  {
    id: "decimal-place",
    name: "小数的意义与性质",
    subtitle: "小数的意义和性质",
    chapter: "下册 · 第四单元",
    grade: "人教版四年级",
    description: "数位列逐位增减数字，直观理解个位、十分位、百分位、千分位的计数单位和进率。",
    tags: ["小数", "数位", "计数单位"],
    gradient: ["#0EA5E9", "#06B6D4"],
    icon: "📊",
  },
  {
    id: "translate-reflect",
    name: "平移与轴对称演示",
    subtitle: "图形的运动",
    chapter: "下册 · 第七单元",
    grade: "人教版四年级",
    description: "选择图形执行平移或轴对称变换，动画演示方向、距离和对称轴的概念。",
    tags: ["平移", "轴对称", "图形运动"],
    gradient: ["#8B5CF6", "#A855F7"],
    icon: "↔",
  },
  {
    id: "remainder",
    name: "有余数的除法演示",
    subtitle: "有余数的除法",
    chapter: "上册 · 第六单元",
    grade: "人教版四年级",
    description: "输入被除数和除数，自动分组可视化展示商和余数，附竖式计算和验算。",
    tags: ["除法", "余数", "竖式计算"],
    gradient: ["#EAB308", "#F59E0B"],
    icon: "➗",
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}
