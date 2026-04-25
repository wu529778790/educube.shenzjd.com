import { buildSystemPrompt } from "@/data/prompt-template";
import type { AgentMessage } from "@/lib/agent/types";

export const REFINE_SYSTEM_AGENT = `你是资深小学/初中教研员兼产品经理。用户会用口语描述想做的交互教具，你要整理成给前端工程师用的「标准需求说明」。

## 输出格式（严格遵守，不要 markdown，不要代码块）
第一行必须是：
【教具名称】（这里写不超过18个字的简短名称，不要书名号）

换行后写：
【需求规格】
然后换行，用有序列表或分段说明，必须包含：
1. 教学目标（学生要理解什么）
2. 界面与交互（画布区域展示什么、右侧有哪些控件、每个控件控制什么）
3. 数学/学科约束（数值范围、单位、是否需要标注）
4. 默认状态与重置行为

语言简洁、可执行，总字数建议 200～500 字。不要输出 HTML。`;

export const EDIT_SPEC_SYSTEM_PROMPT = `你是一个教具规格修改专家。你会收到当前的 JSON Spec 和用户的修改要求。

## 严格规则
1. 只修改用户要求的部分，保持其他部分不变
2. 输出完整的修改后 JSON Spec（不是 diff）
3. 不要输出 markdown 代码围栏，直接输出纯 JSON
4. 保持与组件框架的兼容性
5. 所有界面文字使用中文

## 修改原则
- 用户说"改颜色"：只改 bgGradient、themeColor、颜色相关字段
- 用户说"加功能"：在 controls 或 render.tabs 中扩展
- 用户说"简化"：减少控件或标签页
- 用户说"加标签页"：在 render.tabs 中添加新 tab`;

export const EDIT_SYSTEM_PROMPT = `你是前端开发专家，专门修改中国中小学课堂的交互式 HTML 教具。

## 严格规则
1. 你收到的当前教具 HTML 代码和用户的修改要求
2. 只修改用户要求的部分，保持其他部分不变
3. 输出完整的修改后 HTML 文件（不是 diff）
4. 不要输出 markdown 代码围栏，直接输出纯 HTML
5. 保持与 edu-base.css 的兼容性
6. 所有界面文字使用中文
7. 保持 resetAll() 函数有效

## 修改原则
- 用户说"改颜色"：只改配色
- 用户说"加功能"：在现有结构上扩展
- 用户说"简化"：减少控件或视觉元素
- 保持代码整洁，不要引入冗余代码`;

export function buildEditSpecPrompt(
  currentSpec: string,
  userRequest: string,
  recentMessages: AgentMessage[],
): string {
  const context = buildConversationContext(recentMessages);

  return `当前教具的 JSON Spec：

\`\`\`json
${currentSpec}
\`\`\`
${context}

## 用户的修改要求
${userRequest}

请按要求修改 Spec，输出完整的修改后 JSON。`;
}

export function buildEditPrompt(
  currentHtml: string,
  userRequest: string,
  recentMessages: AgentMessage[],
): string {
  const context = buildConversationContext(recentMessages);

  return `当前教具代码如下：

\`\`\`html
${currentHtml}
\`\`\`
${context}

## 用户的修改要求
${userRequest}

请按要求修改教具，输出完整的修改后 HTML 文件。`;
}

export function buildCreateFallbackHtmlPrompt(input: {
  name: string;
  gradeLabel: string;
  subjectLabel: string;
  refinedSpec: string;
}): string {
  return `请制作一个交互式教具：

教具名称：${input.name}
适用年级：${input.gradeLabel}
学科：${input.subjectLabel}

<requirement>
${input.refinedSpec}
</requirement>

直接输出完整 HTML，不要输出任何解释文字。`;
}

export function buildFallbackSystemPrompt(): string {
  return buildSystemPrompt();
}

function buildConversationContext(recentMessages: AgentMessage[]): string {
  if (recentMessages.length === 0) {
    return "";
  }

  return (
    "\n## 对话上下文\n" +
    recentMessages
      .map((message) =>
        `${message.role === "user" ? "用户" : "助手"}: ${message.content.slice(0, 200)}`,
      )
      .join("\n")
  );
}
