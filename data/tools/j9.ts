import type { Tool } from "./types";

/** 九年级教具 */
export const j9Tools: Tool[] = [
  {
    id: "projection-types",
    name: "投影类型探究",
    subtitle: "投影与视图",
    chapter: "下册 · 第二十九章",
    semester: "下册",
    unitNum: 29,
    gradeId: "j9",
    subjectId: "math",
    description:
      "对比平行投影（太阳光）、中心投影（灯光）、正投影三种投影类型，5种几何体可切换，调节光源高度和角度实时查看投影变化。",
    tags: ["投影", "平行投影", "中心投影", "正投影", "影子"],
    gradient: ["#8B5CF6", "#7C3AED"],
    icon: "🔦",
  },
  {
    id: "three-view-draw",
    name: "三视图绘制与识别",
    subtitle: "投影与视图",
    chapter: "下册 · 第二十九章",
    semester: "下册",
    unitNum: 29,
    gradeId: "j9",
    subjectId: "math",
    description:
      "8种几何体的三视图标准排列展示（主/俯/左视图），含三视图画法口诀、自动测验功能，直观理解长对正、高平齐、宽相等。",
    tags: ["三视图", "正投影", "主视图", "俯视图", "左视图"],
    gradient: ["#F97316", "#EA580C"],
    icon: "📐",
  },
];
