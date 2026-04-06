import type { Tool } from "./types";

/** 六年级教具 */
export const p6Tools: Tool[] = [
  // ================================================================
  // 六年级上册
  // ================================================================
  {
    id: "frac-multiply",
    name: "分数乘法",
    subtitle: "分数乘法",
    chapter: "上册 · 第一单元",
    semester: "上册",
    unitNum: 1,
    gradeId: "p6",
    subjectId: "math",
    description:
      "可视化分数×整数、分数×分数的面积模型，动态展示约分过程，支持分数×整数和分数×分数两种模式。",
    tags: ["分数", "乘法", "面积模型", "约分"],
    gradient: ["#F97316", "#EAB308"],
    icon: "✖",
  },
  {
    id: "position-direction",
    name: "位置与方向",
    subtitle: "位置与方向（二）",
    chapter: "上册 · 第二单元",
    semester: "上册",
    unitNum: 2,
    gradeId: "p6",
    subjectId: "math",
    description:
      "在坐标网格上用方向+距离确定位置，支持角度标注和多点标记，理解北偏东/西等方位描述。",
    tags: ["方向", "距离", "角度", "坐标"],
    gradient: ["#0EA5E9", "#06B6D4"],
    icon: "🧭",
  },

  {
    id: "circle-props",
    name: "圆的认识",
    subtitle: "圆",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    gradeId: "p6",
    subjectId: "math",
    description:
      "拖拽圆心和半径，实时显示直径、周长、面积的关系，可切换显示半径和直径线。",
    tags: ["圆", "半径", "直径", "周长", "面积"],
    gradient: ["#8B5CF6", "#A855F7"],
    icon: "⭕",
  },
  {
    id: "circle-draw",
    name: "圆的周长与面积",
    subtitle: "圆",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    gradeId: "p6",
    subjectId: "math",
    description:
      "动画演示周长公式推导（滚动法）和面积公式推导（切割法），滑块调半径实时计算。",
    tags: ["周长", "面积", "公式推导", "π"],
    gradient: ["#8B5CF6", "#7C3AED"],
    icon: "🔵",
  },
  {
    id: "annulus-area",
    name: "圆环面积",
    subtitle: "圆",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    gradeId: "p6",
    subjectId: "math",
    description:
      "拖拽内外圆半径，Canvas绘制圆环，展示两种计算方法：相减法和提取公因数法。",
    tags: ["圆环", "面积", "π", "公式"],
    gradient: ["#8B5CF6", "#6D28D9"],
    icon: "⭕",
  },

  {
    id: "fan-chart",
    name: "扇形统计图",
    subtitle: "扇形统计图",
    chapter: "上册 · 第七单元",
    semester: "上册",
    unitNum: 7,
    gradeId: "p6",
    subjectId: "math",
    description:
      "输入数据生成扇形统计图，显示各部分百分比和圆心角，支持自定义数据和多组预设。",
    tags: ["扇形统计图", "百分比", "圆心角", "数据"],
    gradient: ["#06B6D4", "#0EA5E9"],
    icon: "🍕",
  },

  // ================================================================
  // 六年级下册
  // ================================================================

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

  {
    id: "scale-drawing",
    name: "比例尺应用",
    subtitle: "比例",
    chapter: "下册 · 第四单元",
    semester: "下册",
    unitNum: 4,
    gradeId: "p6",
    subjectId: "math",
    description:
      "输入比例尺和图上距离/实际距离，地图缩放可视化，支持正向和反向计算。",
    tags: ["比例尺", "地图", "图上距离", "实际距离"],
    gradient: ["#22C55E", "#059669"],
    icon: "🗺️",
  },
  {
    id: "shape-scale",
    name: "图形放大与缩小",
    subtitle: "比例",
    chapter: "下册 · 第四单元",
    semester: "下册",
    unitNum: 4,
    gradeId: "p6",
    subjectId: "math",
    description:
      "滑块调缩放比例，左右对比原图与缩放图形，实时计算面积比和周长比，支持多种图形。",
    tags: ["放大", "缩小", "比例", "面积比"],
    gradient: ["#3B82F6", "#1D4ED8"],
    icon: "🔍",
  },
  {
    id: "direct-inverse",
    name: "正比例与反比例",
    subtitle: "比例",
    chapter: "下册 · 第四单元",
    semester: "下册",
    unitNum: 4,
    gradeId: "p6",
    subjectId: "math",
    description:
      "输入数据对，自动判断正/反比例关系，绘制关系图，支持多种预设场景。",
    tags: ["正比例", "反比例", "关系图", "判断"],
    gradient: ["#3B82F6", "#2563EB"],
    icon: "📊",
  },
  {
    id: "pigeonhole",
    name: "鸽巢原理",
    subtitle: "数学广角",
    chapter: "下册 · 数学广角",
    semester: "下册",
    unitNum: 99,
    gradeId: "p6",
    subjectId: "math",
    description:
      "抽屉原理动画演示，小球放入盒子，探索'至少'问题，支持自定义球数和盒子数。",
    tags: ["鸽巢原理", "抽屉原理", "至少", "逻辑"],
    gradient: ["#F97316", "#EA580C"],
    icon: "🐦",
  },
];
