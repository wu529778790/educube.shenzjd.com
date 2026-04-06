import type { Tool } from "./types";

/** 二年级教具（仅 3D） */
export const p2Tools: Tool[] = [
  {
    id: "observe-simple",
    name: "观察物体初步",
    subtitle: "观察物体（一）",
    chapter: "上册 · 第五单元",
    semester: "上册",
    unitNum: 5,
    gradeId: "p2",
    subjectId: "math",
    description:
      "选择水杯、小车、小房子等生活物品，从正面/侧面/上面/背面四个方向观察，相机自动切换视角，绘制简化视图轮廓，含6道观察角度测验题。",
    tags: ["观察物体", "正面", "侧面", "上面", "视图"],
    gradient: ["#3B82F6", "#2563EB"],
    icon: "👀",
  },
];
