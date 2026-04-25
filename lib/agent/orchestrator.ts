/**
 * 教立方 EduCube — Agent 编排器
 *
 * 核心职责：
 * 1. 意图识别（创建/修改/审查/推荐）
 * 2. 多轮对话状态管理
 * 3. 分阶段生成：规划 → Spec 生成 → HTML 包装 → 审查
 * 4. 流式输出 SSE 事件
 */

import {
  detectAgentIntent,
  quickReviewGeneratedTool,
} from "@/lib/agent/analysis";
import {
  createAgentCreateDoneEvent,
  createAgentErrorEvent,
  createAgentModifyDoneEvent,
  createAgentReviewEvent,
} from "@/lib/agent/events";
import {
  applyCreateResultToSession,
  applyModifyResultToSession,
  cloneSessionState,
  createEmptySessionState,
} from "@/lib/agent/state";
import {
  createAgentTool,
  modifyAgentTool,
} from "@/lib/agent/workflow";
import type {
  AgentEvent,
  SessionState,
} from "@/lib/agent/types";

/* ──────────────────────────────────────
 * Agent 编排器
 * ────────────────────────────────────── */

export class AgentOrchestrator {
  private state: SessionState;

  constructor(initialState?: Partial<SessionState>) {
    this.state = {
      ...createEmptySessionState(),
      ...initialState,
      messages: initialState?.messages ?? [],
    };
  }

  getState(): SessionState {
    return cloneSessionState(this.state);
  }

  /**
   * 处理用户消息，返回 SSE 事件流
   */
  async *handleMessage(userInput: string): AsyncGenerator<AgentEvent> {
    // 记录用户消息
    this.state.messages.push({ role: "user", content: userInput });

    // 意图识别
    const intent = detectAgentIntent(userInput, {
      hasCurrentHtml: Boolean(this.state.currentHtml),
    });

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

  /* ── 创建新教具（三阶段：需求整理 → Spec 生成 → HTML 包装） ── */

  private async *handleCreate(userInput: string): AsyncGenerator<AgentEvent> {
    this.state.stage = "planning";

    // 阶段 1：需求整理
    yield { type: "thinking", content: "正在分析你的需求..." };

    const gradeLabel = this.state.grade || "未指定年级";
    const subjectLabel = this.state.subject || "数学";

    // 发送 planning 事件（不带详细规格，避免太大）
    yield {
      type: "planning",
      content: "我正在整理需求并生成教具...",
    };

    // 阶段 2：生成 JSON Spec
    this.state.stage = "generating";
    yield { type: "generating", content: "正在生成教具代码..." };

    try {
      const result = await createAgentTool({
        userInput,
        gradeLabel,
        subjectLabel,
      });
      applyCreateResultToSession(this.state, result);
      yield createAgentCreateDoneEvent(result);
    } catch (err) {
      this.state.stage = "idle";
      yield createAgentErrorEvent("生成失败", err, "，请重试。");
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
      yield {
        type: "editing",
        content: this.state.currentSpec
          ? "正在修改教具规格..."
          : "正在修改教具代码...",
      };

      const result = await modifyAgentTool({
        userInput,
        currentHtml: this.state.currentHtml,
        currentSpec: this.state.currentSpec,
        messages: this.state.messages,
      });

      applyModifyResultToSession(this.state, userInput, result);
      yield createAgentModifyDoneEvent(result);
    } catch (err) {
      this.state.stage = "idle";
      yield createAgentErrorEvent("修改失败", err);
    }
  }

  /* ── 审查当前教具 ── */

  private async *handleReview(): AsyncGenerator<AgentEvent> {
    if (!this.state.currentHtml) {
      yield { type: "error", content: "当前没有可审查的教具。" };
      return;
    }

    yield { type: "reviewing", content: "正在审查教具质量..." };

    const result = quickReviewGeneratedTool(this.state.currentHtml);

    yield createAgentReviewEvent(this.state, result.summary);
  }
}
