/**
 * 教立方 EduCube — Agent 编排器
 *
 * 核心职责：
 * 1. 意图识别（创建/修改/审查/推荐）
 * 2. 多轮对话状态管理
 * 3. 分阶段生成：规划 → Spec 生成 → HTML 包装 → 审查
 * 4. 流式输出 SSE 事件
 */

import { generateChatText } from "@/lib/ai-client";
import type {
  AgentEvent,
  AgentMessage,
  SessionState,
} from "@/lib/agent/types";
import {
  buildRefineUserPrompt,
  parseRefinedSpecOutput,
} from "@/data/prompt-template";
import {
  buildSpecSystemPrompt,
  buildSpecUserPrompt,
  parseSpecOutput,
  wrapSpecAsHtml,
} from "@/data/spec-prompt";
import {
  sanitizeHtml,
  validateGeneratedJavaScript,
} from "@/lib/html-sanitizer";
import { logger } from "@/lib/logger";
import { AI_MAX_TOKENS } from "@/lib/runtime-config";

/* ──────────────────────────────────────
 * Agent 编排器
 * ────────────────────────────────────── */

export class AgentOrchestrator {
  private state: SessionState;

  constructor(initialState?: Partial<SessionState>) {
    this.state = {
      messages: initialState?.messages || [],
      currentHtml: initialState?.currentHtml || null,
      currentSpec: initialState?.currentSpec || null,
      stage: initialState?.stage || "idle",
      toolName: initialState?.toolName || null,
      chapter: initialState?.chapter || null,
      subject: initialState?.subject || null,
      grade: initialState?.grade || null,
    };
  }

  getState(): SessionState {
    return { ...this.state };
  }

  /**
   * 处理用户消息，返回 SSE 事件流
   */
  async *handleMessage(userInput: string): AsyncGenerator<AgentEvent> {
    // 记录用户消息
    this.state.messages.push({ role: "user", content: userInput });

    // 意图识别
    const intent = this.detectIntent(userInput);

    switch (intent) {
      case "create":
        yield* this.handleCreate(userInput);
        break;
      case "modify":
        yield* this.handleModify(userInput);
        break;
      case "review":
        yield* this.handleReview();
        break;
      default:
        yield* this.handleCreate(userInput);
        break;
    }
  }

  /* ── 意图识别（规则 + AI 辅助） ── */

  private detectIntent(input: string): "create" | "modify" | "review" {
    const text = input.trim().toLowerCase();

    // 修改意图：已有 HTML 且用户要求修改
    if (this.state.currentHtml) {
      const modifyKeywords = [
        "改", "修改", "调整", "换成", "增加", "加上", "添加", "去掉", "删除",
        "移除", "放大", "缩小", "变", "把", "换成", "改成", "变成",
        "不要", "换成蓝色", "改成红色", "移动", "拖到",
      ];
      if (modifyKeywords.some((k) => text.includes(k))) return "modify";
    }

    // 审查意图
    const reviewKeywords = ["检查", "审查", "有问题", "评价", "审查质量"];
    if (reviewKeywords.some((k) => text.includes(k)) && this.state.currentHtml) {
      return "review";
    }

    // 默认为创建
    return "create";
  }

  /* ── 创建新教具（三阶段：需求整理 → Spec 生成 → HTML 包装） ── */

  private async *handleCreate(userInput: string): AsyncGenerator<AgentEvent> {
    this.state.stage = "planning";

    // 阶段 1：需求整理
    yield { type: "thinking", content: "正在分析你的需求..." };

    const gradeLabel = this.state.grade || "未指定年级";
    const subjectLabel = this.state.subject || "数学";

    let refinedSpec: { name: string; spec: string };
    try {
      const refineResult = await generateChatText(
        REFINE_SYSTEM_AGENT,
        buildRefineUserPrompt({
          gradeLabel,
          subjectLabel,
          userIntent: userInput,
        }),
        { maxTokens: 2048, temperature: 0.2 },
      );
      refinedSpec = parseRefinedSpecOutput(refineResult, userInput);
    } catch (err) {
      logger.warn("Agent 需求整理失败，回退到原始输入", {
        message: err instanceof Error ? err.message : "未知错误",
      });
      refinedSpec = {
        name: userInput.slice(0, 18),
        spec: userInput,
      };
    }

    this.state.toolName = refinedSpec.name;

    // 发送 planning 事件（不带详细规格，避免太大）
    yield {
      type: "planning",
      content: `我理解你需要「${refinedSpec.name}」。正在生成教具...`,
    };

    // 阶段 2：生成 JSON Spec
    this.state.stage = "generating";
    yield { type: "generating", content: "正在生成教具代码..." };

    try {
      logger.debug("Agent 开始生成 spec", {
        toolName: refinedSpec.name,
      });
      // 优先使用 Spec-based 生成
      const specResult = await generateChatText(
        buildSpecSystemPrompt(),
        buildSpecUserPrompt({
          name: refinedSpec.name,
          gradeLabel,
          subjectLabel,
          chapter: "",
          description: refinedSpec.spec,
        }),
        {
          maxTokens: AI_MAX_TOKENS,
          temperature: 0.3,
        },
      );
      logger.debug("Agent spec 生成完成", {
        toolName: refinedSpec.name,
        length: specResult.length,
      });

      const { spec, valid } = parseSpecOutput(specResult);

      let finalHtml: string;

      if (valid && spec.title) {
        validateSpecRuntime(spec);
        // Spec 有效 → 包装为 HTML
        this.state.currentSpec = spec;
        const specJson = JSON.stringify(spec, null, 2);
        finalHtml = wrapSpecAsHtml(specJson);

        this.state.stage = "idle";
        yield {
          type: "done",
          content: `教具「${refinedSpec.name}」已生成！(Spec 模式)\n\n使用了组件框架渲染，交互更稳定。你可以说"修改XXX"来调整。`,
          html: finalHtml,
          spec,
          actions: [
            { label: "保存教具", action: "save" },
            { label: "继续优化", action: "iterate" },
            { label: "重新生成", action: "restart" },
          ],
        };
      } else {
        // Spec 无效 → fallback 到原始 HTML 生成
        const html = await generateChatText(
          buildSystemPromptFallback(),
          `请制作一个交互式教具：\n\n教具名称：${refinedSpec.name}\n适用年级：${gradeLabel}\n学科：${subjectLabel}\n\n<requirement>\n${refinedSpec.spec}\n</requirement>\n\n直接输出完整 HTML，不要输出任何解释文字。`,
          {
            maxTokens: AI_MAX_TOKENS,
            temperature: 0.3,
          },
        );

        finalHtml = sanitizeHtml(html, {
          preserveInlineEventHandlers: true,
        });
        this.state.currentHtml = finalHtml;
        this.state.stage = "idle";

        yield {
          type: "done",
          content: `教具「${refinedSpec.name}」已生成！(HTML 模式)\n\n你可以说"修改XXX"来调整。`,
          html: finalHtml,
          actions: [
            { label: "保存教具", action: "save" },
            { label: "继续优化", action: "iterate" },
            { label: "重新生成", action: "restart" },
          ],
        };
      }

      this.state.currentHtml = finalHtml;
      this.state.messages.push({
        role: "assistant",
        content: `已生成教具「${refinedSpec.name}」`,
      });
    } catch (err) {
      this.state.stage = "idle";
      yield {
        type: "error",
        content: `生成失败：${err instanceof Error ? err.message : "未知错误"}，请重试。`,
      };
    }
  }

  /* ── 修改已有教具 ── */

  private async *handleModify(userInput: string): AsyncGenerator<AgentEvent> {
    if (!this.state.currentHtml) {
      yield { type: "error", content: "当前没有可修改的教具，请先创建一个。" };
      return;
    }

    this.state.stage = "editing";
    yield { type: "thinking", content: "正在理解修改需求..." };

    try {
      // 如果有 JSON Spec，优先修改 spec
      if (this.state.currentSpec) {
        yield { type: "editing", content: "正在修改教具规格..." };

        const specStr = JSON.stringify(this.state.currentSpec, null, 2);
        const modifiedResult = await generateChatText(
          EDIT_SPEC_SYSTEM_PROMPT,
          buildEditSpecPrompt(specStr, userInput, this.state.messages.slice(-6)),
          {
            maxTokens: AI_MAX_TOKENS,
            temperature: 0.2,
          },
        );

        const { spec, valid } = parseSpecOutput(modifiedResult);

        if (valid && spec.title) {
          validateSpecRuntime(spec);
          this.state.currentSpec = spec;
          const finalHtml = wrapSpecAsHtml(JSON.stringify(spec, null, 2));
          this.state.currentHtml = finalHtml;
          this.state.stage = "idle";

          yield {
            type: "done",
            content: "已修改完成！右侧预览已更新。",
            html: finalHtml,
            spec,
            actions: [
              { label: "保存教具", action: "save" },
              { label: "继续优化", action: "iterate" },
            ],
          };

          this.state.messages.push({
            role: "assistant",
            content: `已按"${userInput}"修改了教具`,
          });
          return;
        }
      }

      // Fallback：直接修改 HTML
      const modifiedHtml = await generateChatText(
        EDIT_SYSTEM_PROMPT,
        buildEditPrompt(this.state.currentHtml, userInput, this.state.messages.slice(-6)),
        {
          maxTokens: AI_MAX_TOKENS,
          temperature: 0.2,
        },
      );

      const cleanHtml = sanitizeHtml(modifiedHtml, {
        preserveInlineEventHandlers: true,
      });
      this.state.currentHtml = cleanHtml;
      this.state.currentSpec = null; // HTML 模式下清除 spec
      this.state.stage = "idle";

      yield {
        type: "done",
        content: "已修改完成！右侧预览已更新。",
        html: cleanHtml,
        actions: [
          { label: "保存教具", action: "save" },
          { label: "继续优化", action: "iterate" },
        ],
      };

      this.state.messages.push({
        role: "assistant",
        content: `已按"${userInput}"修改了教具`,
      });
    } catch (err) {
      this.state.stage = "idle";
      yield {
        type: "error",
        content: `修改失败：${err instanceof Error ? err.message : "未知错误"}`,
      };
    }
  }

  /* ── 审查当前教具 ── */

  private async *handleReview(): AsyncGenerator<AgentEvent> {
    if (!this.state.currentHtml) {
      yield { type: "error", content: "当前没有可审查的教具。" };
      return;
    }

    yield { type: "reviewing", content: "正在审查教具质量..." };

    const result = this.quickReview(this.state.currentHtml);

    yield {
      type: "done",
      content: `审查完成：\n\n${result.summary}\n\n你可以说"修改XXX"来修复问题。`,
      html: this.state.currentHtml,
      actions: [
        { label: "自动修复", action: "autoFix" },
        { label: "保存教具", action: "save" },
      ],
    };
  }

  /* ── 快速审查（不消耗 AI token，基于规则） ── */

  private quickReview(html: string): {
    score: number;
    summary: string;
  } {
    let score = 100;
    const issues: string[] = [];
    const good: string[] = [];

    // 检查是否使用组件框架
    if (html.includes("EduRender.run")) {
      good.push("✓ 使用了组件框架渲染（Spec 模式）");
    }

    // 检查必需结构
    if (!html.includes("edu-tool") && !html.includes("EduRender")) {
      score -= 20; issues.push("缺少 .edu-tool 容器");
    } else good.push("✓ 使用了标准容器结构");

    if (!html.includes("edu-toolbar") && !html.includes("EduComp.create")) {
      score -= 15; issues.push("缺少工具栏");
    } else good.push("✓ 包含工具栏");

    if (html.includes("resetAll") || html.includes("onReset")) {
      good.push("✓ 包含重置功能");
    } else {
      score -= 10; issues.push("缺少重置功能");
    }

    // 检查交互控件
    const sliderCount = (html.match(/"type":\s*"slider"/g) || []).length
      + (html.match(/type="range"/g) || []).length;
    if (sliderCount === 0) { score -= 15; issues.push("缺少滑块交互控件"); }
    else if (sliderCount >= 3) good.push(`✓ 包含 ${sliderCount} 个交互滑块`);
    else good.push(`✓ 包含 ${sliderCount} 个滑块（建议 3 个以上）`);

    // 检查 info-box
    if (html.includes("info-box") || html.includes('"type":"info"') || html.includes('"type": "info"')) {
      good.push("✓ 包含知识点说明");
    } else {
      score -= 5; issues.push("建议添加知识点说明卡片");
    }

    // 检查 Canvas 或 3D
    if (html.includes("canvas") || html.includes("Edu3D") || html.includes("EduComp.draw")) {
      good.push("✓ 包含可视化内容");
    } else {
      score -= 20; issues.push("缺少可视化内容（Canvas 或 3D）");
    }

    // 检查中文
    const hasChinese = /[\u4e00-\u9fff]/.test(html);
    if (!hasChinese) { score -= 10; issues.push("缺少中文界面文字"); }
    else good.push("✓ 包含中文界面");

    score = Math.max(0, Math.min(100, score));

    let summary = `质量评分：${score}/100\n\n`;
    if (good.length > 0) summary += `优点：\n${good.join("\n")}\n\n`;
    if (issues.length > 0) summary += `需要改进：\n${issues.map((i) => "• " + i).join("\n")}`;

    return { score, summary };
  }
}

/* ──────────────────────────────────────
 * Prompt 模板
 * ────────────────────────────────────── */

const REFINE_SYSTEM_AGENT = `你是资深小学/初中教研员兼产品经理。用户会用口语描述想做的交互教具，你要整理成给前端工程师用的「标准需求说明」。

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

const EDIT_SPEC_SYSTEM_PROMPT = `你是一个教具规格修改专家。你会收到当前的 JSON Spec 和用户的修改要求。

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

const EDIT_SYSTEM_PROMPT = `你是前端开发专家，专门修改中国中小学课堂的交互式 HTML 教具。

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

function buildEditSpecPrompt(
  currentSpec: string,
  userRequest: string,
  recentMessages: AgentMessage[],
): string {
  let context = "";
  if (recentMessages.length > 0) {
    context = "\n## 对话上下文\n" + recentMessages
      .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content.slice(0, 200)}`)
      .join("\n");
  }

  return `当前教具的 JSON Spec：

\`\`\`json
${currentSpec}
\`\`\`
${context}

## 用户的修改要求
${userRequest}

请按要求修改 Spec，输出完整的修改后 JSON。`;
}

function buildEditPrompt(
  currentHtml: string,
  userRequest: string,
  recentMessages: AgentMessage[],
): string {
  let context = "";
  if (recentMessages.length > 0) {
    context = "\n## 对话上下文\n" + recentMessages
      .map((m) => `${m.role === "user" ? "用户" : "助手"}: ${m.content.slice(0, 200)}`)
      .join("\n");
  }

  return `当前教具代码如下：

\`\`\`html
${currentHtml}
\`\`\`
${context}

## 用户的修改要求
${userRequest}

请按要求修改教具，输出完整的修改后 HTML 文件。`;
}

/* ──────────────────────────────────────
 * HTML Fallback Prompt（当 Spec 生成失败时）
 * ────────────────────────────────────── */

import { buildSystemPrompt } from "@/data/prompt-template";

function buildSystemPromptFallback(): string {
  return buildSystemPrompt();
}

function validateSpecRuntime(spec: Record<string, unknown>): void {
  const render = asRecord(spec.render);
  if (!render) return;

  validateSpecCode(render.draw);
  validateSpecCode(render.resultArea);
  validateSpecCode(render.setup);
  validateSpecCode(render.update);

  const tabs = render.tabs;
  if (Array.isArray(tabs)) {
    for (const tab of tabs) {
      const tabRecord = asRecord(tab);
      if (!tabRecord) continue;
      validateSpecCode(tabRecord.draw);
    }
  }

  validateSpecCode(spec.onReset);
}

function validateSpecCode(value: unknown): void {
  if (typeof value !== "string") return;
  validateGeneratedJavaScript(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}
