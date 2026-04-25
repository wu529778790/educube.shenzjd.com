export type AgentIntent = "create" | "modify" | "review";

export interface QuickReviewResult {
  score: number;
  summary: string;
}

const MODIFY_KEYWORDS = [
  "改",
  "修改",
  "调整",
  "换成",
  "增加",
  "加上",
  "添加",
  "去掉",
  "删除",
  "移除",
  "放大",
  "缩小",
  "变",
  "把",
  "改成",
  "变成",
  "不要",
  "换成蓝色",
  "改成红色",
  "移动",
  "拖到",
];

const REVIEW_KEYWORDS = ["检查", "审查", "有问题", "评价", "审查质量"];

export function detectAgentIntent(
  input: string,
  options: { hasCurrentHtml: boolean },
): AgentIntent {
  const text = input.trim().toLowerCase();

  if (options.hasCurrentHtml) {
    if (MODIFY_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return "modify";
    }

    if (REVIEW_KEYWORDS.some((keyword) => text.includes(keyword))) {
      return "review";
    }
  }

  return "create";
}

export function quickReviewGeneratedTool(html: string): QuickReviewResult {
  let score = 100;
  const issues: string[] = [];
  const good: string[] = [];

  if (html.includes("EduRender.run")) {
    good.push("✓ 使用了组件框架渲染（Spec 模式）");
  }

  if (!html.includes("edu-tool") && !html.includes("EduRender")) {
    score -= 20;
    issues.push("缺少 .edu-tool 容器");
  } else {
    good.push("✓ 使用了标准容器结构");
  }

  if (!html.includes("edu-toolbar") && !html.includes("EduComp.create")) {
    score -= 15;
    issues.push("缺少工具栏");
  } else {
    good.push("✓ 包含工具栏");
  }

  if (html.includes("resetAll") || html.includes("onReset")) {
    good.push("✓ 包含重置功能");
  } else {
    score -= 10;
    issues.push("缺少重置功能");
  }

  const sliderCount =
    (html.match(/"type":\s*"slider"/g) || []).length +
    (html.match(/type="range"/g) || []).length;
  if (sliderCount === 0) {
    score -= 15;
    issues.push("缺少滑块交互控件");
  } else if (sliderCount >= 3) {
    good.push(`✓ 包含 ${sliderCount} 个交互滑块`);
  } else {
    good.push(`✓ 包含 ${sliderCount} 个滑块（建议 3 个以上）`);
  }

  if (
    html.includes("info-box") ||
    html.includes('"type":"info"') ||
    html.includes('"type": "info"')
  ) {
    good.push("✓ 包含知识点说明");
  } else {
    score -= 5;
    issues.push("建议添加知识点说明卡片");
  }

  if (
    html.includes("canvas") ||
    html.includes("Edu3D") ||
    html.includes("EduComp.draw")
  ) {
    good.push("✓ 包含可视化内容");
  } else {
    score -= 20;
    issues.push("缺少可视化内容（Canvas 或 3D）");
  }

  if (/[\u4e00-\u9fff]/.test(html)) {
    good.push("✓ 包含中文界面");
  } else {
    score -= 10;
    issues.push("缺少中文界面文字");
  }

  score = Math.max(0, Math.min(100, score));

  let summary = `质量评分：${score}/100\n\n`;
  if (good.length > 0) {
    summary += `优点：\n${good.join("\n")}\n\n`;
  }
  if (issues.length > 0) {
    summary += `需要改进：\n${issues.map((issue) => `• ${issue}`).join("\n")}`;
  }

  return { score, summary };
}
