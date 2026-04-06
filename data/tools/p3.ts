import type { Tool } from "./types";

/** 三年级教具 */
export const p3Tools: Tool[] = [
  // ================================================================
  // 三年级上册
  // ================================================================
  {
    id: "time-clock",
    name: "时、分、秒",
    subtitle: "时、分、秒",
    chapter: "上册 · 第一单元",
    semester: "上册",
    unitNum: 1,
    gradeId: "p3",
    subjectId: "math",
    description:
      "交互式模拟钟表，滑块调整时分秒，数字时钟同步显示，支持时间加减计算。",
    tags: ["钟表", "时", "分", "秒", "时间计算"],
    gradient: ["#F97316", "#EA580C"],
    icon: "🕐",
  },

  {
    id: "length-units",
    name: "测量·长度单位",
    subtitle: "测量",
    chapter: "上册 · 第三单元",
    semester: "上册",
    unitNum: 3,
    gradeId: "p3",
    subjectId: "math",
    description:
      "毫米、厘米、分米、米、千米的可视化和换算，条形对比相对大小。",
    tags: ["长度单位", "毫米", "厘米", "千米", "换算"],
    gradient: ["#22C55E", "#16A34A"],
    icon: "📏",
  },
  {
    id: "multiple-know",
    name: "倍的认识",
    subtitle: "倍的认识",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    gradeId: "p3",
    subjectId: "math",
    description:
      "可视化点阵和条形模型展示倍数关系，支持求倍数、求几倍、随机练习。",
    tags: ["倍", "倍数", "乘法", "条形模型"],
    gradient: ["#EAB308", "#D97706"],
    icon: "×",
  },

  {
    id: "rect-perimeter",
    name: "长方形和正方形周长",
    subtitle: "长方形和正方形",
    chapter: "上册 · 第七单元",
    semester: "上册",
    unitNum: 7,
    gradeId: "p3",
    subjectId: "math",
    description:
      "Canvas绘制长方形/正方形，滑块调长和宽，实时显示周长公式推导和计算。",
    tags: ["周长", "长方形", "正方形", "公式"],
    gradient: ["#3B82F6", "#0EA5E9"],
    icon: "▭",
  },
  {
    id: "frac-intro",
    name: "分数的初步认识",
    subtitle: "分数的初步认识",
    chapter: "上册 · 第八单元",
    semester: "上册",
    unitNum: 8,
    gradeId: "p3",
    subjectId: "math",
    description:
      "圆形/长方形分份涂色展示分数，同分母比较大小，简单分数加法可视化。",
    tags: ["分数", "初步认识", "几分之一", "比较"],
    gradient: ["#EC4899", "#F43F5E"],
    icon: "½",
  },
  {
    id: "venn-set",
    name: "集合·韦恩图",
    subtitle: "数学广角",
    chapter: "上册 · 数学广角",
    semester: "上册",
    unitNum: 99,
    gradeId: "p3",
    subjectId: "math",
    description:
      "两个集合的韦恩图可视化，输入集合元素自动求交集，展示容斥原理公式。",
    tags: ["集合", "韦恩图", "交集", "容斥原理"],
    gradient: ["#06B6D4", "#0EA5E9"],
    icon: "⭕",
  },

  // ================================================================
  // 三年级下册
  // ================================================================
  {
    id: "direction-compass",
    name: "位置与方向（一）",
    subtitle: "位置与方向（一）",
    chapter: "下册 · 第一单元",
    semester: "下册",
    unitNum: 1,
    gradeId: "p3",
    subjectId: "math",
    description:
      "交互式指南针罗盘，8个方位认知，网格上按方向移动，路径可视化。",
    tags: ["方向", "东南西北", "指南针", "方位"],
    gradient: ["#F97316", "#EA580C"],
    icon: "🧭",
  },

  {
    id: "area-explore",
    name: "面积的认识",
    subtitle: "面积",
    chapter: "下册 · 第五单元",
    semester: "下册",
    unitNum: 5,
    gradeId: "p3",
    subjectId: "math",
    description:
      "网格上放置1cm²方块感受面积，长方形/正方形面积公式推导，面积与周长对比。",
    tags: ["面积", "平方厘米", "长方形", "正方形"],
    gradient: ["#22C55E", "#16A34A"],
    icon: "🔲",
  },
  {
    id: "decimal-intro",
    name: "小数的初步认识",
    subtitle: "小数的初步认识",
    chapter: "下册 · 第七单元",
    semester: "下册",
    unitNum: 7,
    gradeId: "p3",
    subjectId: "math",
    description:
      "数轴上的小数，小数与十分之几分数的对应，价格场景，小数大小比较。",
    tags: ["小数", "初步认识", "数轴", "价格"],
    gradient: ["#3B82F6", "#1D4ED8"],
    icon: "0.1",
  },
];
