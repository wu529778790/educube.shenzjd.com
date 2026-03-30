export type Semester = "上册" | "下册";

export interface Tool {
  id: string;
  name: string;
  subtitle: string;
  /** 显示用章节字符串，如 "上册 · 第三单元" */
  chapter: string;
  /** 学期，用于首页筛选 */
  semester: Semester;
  /** 单元序号，用于组内排序；数学广角统一用 99 */
  unitNum: number;
  grade: string;
  description: string;
  tags: string[];
  gradient: [string, string];
  icon: string;
}

const GRADE = "人教版四年级";

export const tools: Tool[] = [
  // ================================================================
  // 上册
  // ================================================================
  {
    id: "angle-measure",
    name: "量角器与角度测量",
    subtitle: "角的度量",
    chapter: "上册 · 第三单元",
    semester: "上册",
    unitNum: 3,
    grade: GRADE,
    description:
      "模拟量角器测量角度，拖拽射线改变角度大小，认识锐角、直角、钝角、平角。",
    tags: ["量角器", "角度", "锐角/钝角"],
    gradient: ["#F97316", "#F59E0B"],
    icon: "📐",
  },
  {
    id: "parallelogram-explore",
    name: "平行四边形与梯形",
    subtitle: "平行四边形和梯形",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    grade: GRADE,
    description:
      "拖拽顶点改变平行四边形和梯形的形状，实时显示边长、高和面积的变化关系。",
    tags: ["平行四边形", "梯形", "面积"],
    gradient: ["#3B82F6", "#6366F1"],
    icon: "◱",
  },
  {
    id: "parallel-perp",
    name: "平行与垂直演示",
    subtitle: "平行四边形和梯形",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    grade: GRADE,
    description:
      "拖拽两条直线的端点，观察平行、垂直、斜交等位置关系，实时计算夹角。",
    tags: ["平行", "垂直", "位置关系"],
    gradient: ["#3B82F6", "#6366F1"],
    icon: "📏",
  },
  {
    id: "remainder",
    name: "除数是两位数的除法",
    subtitle: "除数是两位数的除法",
    chapter: "上册 · 第六单元",
    semester: "上册",
    unitNum: 6,
    grade: GRADE,
    description:
      "输入被除数和除数，自动分组可视化展示商和余数，附竖式计算步骤和验算。",
    tags: ["两位数除法", "余数", "竖式计算"],
    gradient: ["#EAB308", "#F59E0B"],
    icon: "➗",
  },
  {
    id: "bar-chart",
    name: "条形统计图",
    subtitle: "条形统计图",
    chapter: "上册 · 第七单元",
    semester: "上册",
    unitNum: 7,
    grade: GRADE,
    description:
      "输入数据生成条形统计图，可切换单式/复式，直观对比不同数量的大小关系。",
    tags: ["统计图", "条形图", "数据分析"],
    gradient: ["#06B6D4", "#0EA5E9"],
    icon: "📊",
  },

  // ================================================================
  // 下册
  // ================================================================
  {
    id: "ops-order",
    name: "四则运算顺序演示",
    subtitle: "四则运算",
    chapter: "下册 · 第一单元",
    semester: "下册",
    unitNum: 1,
    grade: GRADE,
    description:
      "输入四则运算式，逐步演示运算顺序：先括号、再乘除、后加减，每步高亮当前运算。",
    tags: ["运算顺序", "括号", "混合运算"],
    gradient: ["#22C55E", "#16A34A"],
    icon: "🔢",
  },
  {
    id: "three-views",
    name: "积木三视图观察器",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    semester: "下册",
    unitNum: 2,
    grade: GRADE,
    description:
      "切换正视图、侧视图、俯视图，直观理解从不同方向观察同一堆积木时看到的形状。",
    tags: ["三视图", "空间想象", "观察物体"],
    gradient: ["#3B82F6", "#0EA5E9"],
    icon: "🧊",
  },
  {
    id: "cube-unfold",
    name: "正方体展开图",
    subtitle: "空间想象辅助",
    chapter: "下册 · 第二单元",
    semester: "下册",
    unitNum: 2,
    grade: GRADE,
    description:
      "动态演示正方体六个面的展开与折叠过程，理解立体图形与平面展开图的对应关系。",
    tags: ["展开图", "折叠", "正方体"],
    gradient: ["#8B5CF6", "#A855F7"],
    icon: "📦",
  },
  {
    id: "3d-rotation",
    name: "立体图形旋转观察",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    semester: "下册",
    unitNum: 2,
    grade: GRADE,
    description:
      "拖拽鼠标自由旋转长方体、正方体、圆柱，全方位观察各面形状及顶点、棱、面的数量。",
    tags: ["拖拽旋转", "立体图形", "顶点/棱/面"],
    gradient: ["#F97316", "#FB923C"],
    icon: "🔄",
  },
  {
    id: "block-build",
    name: "积木拼搭三视图",
    subtitle: "观察物体",
    chapter: "下册 · 第二单元",
    semester: "下册",
    unitNum: 2,
    grade: GRADE,
    description:
      "在网格上自由摆放和移除积木，三个视图实时同步更新，帮助理解三视图与实物的对应。",
    tags: ["积木拼搭", "三视图联动", "交互"],
    gradient: ["#22C55E", "#10B981"],
    icon: "🏗️",
  },
  {
    id: "distributive-law",
    name: "乘法分配律演示",
    subtitle: "运算定律",
    chapter: "下册 · 第三单元",
    semester: "下册",
    unitNum: 3,
    grade: GRADE,
    description:
      "动画演示乘法分配律 a×(b+c)=a×b+a×c，通过面积模型直观展示等式两边的关系。",
    tags: ["分配律", "运算定律", "面积模型"],
    gradient: ["#F97316", "#EAB308"],
    icon: "✕",
  },
  {
    id: "decimal-place",
    name: "小数的意义与数位",
    subtitle: "小数的意义和性质",
    chapter: "下册 · 第四单元",
    semester: "下册",
    unitNum: 4,
    grade: GRADE,
    description:
      "数位列逐位增减数字，直观理解个位、十分位、百分位、千分位的计数单位和进率。",
    tags: ["小数", "数位", "计数单位"],
    gradient: ["#0EA5E9", "#06B6D4"],
    icon: "0.1",
  },
  {
    id: "decimal-explore",
    name: "小数大小比较",
    subtitle: "小数的意义和性质",
    chapter: "下册 · 第四单元",
    semester: "下册",
    unitNum: 4,
    grade: GRADE,
    description:
      "在数轴上标注和比较两个小数，直观理解小数的顺序，掌握小数大小比较方法。",
    tags: ["小数比较", "数轴", "大小关系"],
    gradient: ["#14B8A6", "#06B6D4"],
    icon: "↔",
  },
  {
    id: "triangle-classify",
    name: "三角形分类演示",
    subtitle: "三角形",
    chapter: "下册 · 第五单元",
    semester: "下册",
    unitNum: 5,
    grade: GRADE,
    description:
      "拖拽三角形顶点实时改变形状，自动按角和按边分类，观察角度与边长变化。",
    tags: ["三角形分类", "锐角/直角/钝角", "等边/等腰"],
    gradient: ["#A855F7", "#7C3AED"],
    icon: "🔺",
  },
  {
    id: "triangle-angle-sum",
    name: "三角形内角和",
    subtitle: "三角形",
    chapter: "下册 · 第五单元",
    semester: "下册",
    unitNum: 5,
    grade: GRADE,
    description:
      "动画演示三角形三个内角拼合成平角，直观证明三角形内角和等于 180°。",
    tags: ["内角和", "180°", "三角形"],
    gradient: ["#6366F1", "#8B5CF6"],
    icon: "△",
  },
  {
    id: "shape-rotate",
    name: "图形旋转变换",
    subtitle: "图形的运动",
    chapter: "下册 · 第七单元",
    semester: "下册",
    unitNum: 7,
    grade: GRADE,
    description:
      "选择旋转中心和旋转角度，动画演示图形围绕中心点旋转的过程，理解旋转变换规律。",
    tags: ["旋转", "图形运动", "旋转中心"],
    gradient: ["#EF4444", "#F43F5E"],
    icon: "🔁",
  },
  {
    id: "translate-reflect",
    name: "平移与轴对称演示",
    subtitle: "图形的运动",
    chapter: "下册 · 第七单元",
    semester: "下册",
    unitNum: 7,
    grade: GRADE,
    description:
      "选择图形执行平移或轴对称变换，动画演示方向、距离和对称轴的概念。",
    tags: ["平移", "轴对称", "图形运动"],
    gradient: ["#8B5CF6", "#A855F7"],
    icon: "↔",
  },
  {
    id: "axis-symmetry",
    name: "轴对称图形",
    subtitle: "图形的运动",
    chapter: "下册 · 第七单元",
    semester: "下册",
    unitNum: 7,
    grade: GRADE,
    description:
      "拖拽图形观察轴对称变换，可移动对称轴位置和角度，实时显示对称图形的生成过程。",
    tags: ["轴对称", "对称轴", "图形变换"],
    gradient: ["#F43F5E", "#E11D48"],
    icon: "⟺",
  },
  {
    id: "average-explore",
    name: "平均数可视化",
    subtitle: "平均数与统计",
    chapter: "下册 · 第八单元",
    semester: "下册",
    unitNum: 8,
    grade: GRADE,
    description:
      "输入一组数据，通过移多补少动画直观求平均数，理解平均数的统计意义。",
    tags: ["平均数", "移多补少", "统计"],
    gradient: ["#F59E0B", "#D97706"],
    icon: "〜",
  },
  {
    id: "optimization",
    name: "统筹优化演示",
    subtitle: "数学广角",
    chapter: "下册 · 数学广角",
    semester: "下册",
    unitNum: 99,
    grade: GRADE,
    description:
      "通过时间轴可视化展示多任务统筹安排，比较不同方案的总时长，理解优化思想。",
    tags: ["统筹", "优化", "时间安排"],
    gradient: ["#0D9488", "#0F766E"],
    icon: "⏱",
  },
  {
    id: "chicken-rabbit",
    name: "鸡兔同笼问题",
    subtitle: "数学广角",
    chapter: "下册 · 数学广角",
    semester: "下册",
    unitNum: 99,
    grade: GRADE,
    description:
      "通过假设法和列表法可视化演示鸡兔同笼，动态展示逐步调整的求解过程。",
    tags: ["鸡兔同笼", "假设法", "逻辑推理"],
    gradient: ["#84CC16", "#65A30D"],
    icon: "🐔",
  },
];

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}
