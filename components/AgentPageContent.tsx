"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

/* ──────────────────────────────────────
 * 类型定义
 * ────────────────────────────────────── */

interface AgentEvent {
  type: "thinking" | "planning" | "generating" | "reviewing" | "editing" | "done" | "error";
  content: string;
  html?: string;
  actions?: { label: string; action: string }[];
  _state?: SessionState;
}

interface SessionState {
  messages: { role: string; content: string }[];
  currentHtml: string | null;
  currentSpec: Record<string, unknown> | null;
  stage: string;
  toolName: string | null;
  chapter: string | null;
  grade: string | null;
  subject: string | null;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  stage?: string;
  actions?: { label: string; action: string }[];
}

/* ──────────────────────────────────────
 * Agent 对话页面
 * ────────────────────────────────────── */

export default function AgentPageContent() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "你好！我是教立方的 AI 助手。\n\n你可以用自然语言描述你想创建的教学工具，我会帮你生成交互式教具。例如：\n\n• 「做一个三年级分数初步认识的工具」\n• 「生成一个五年级面积计算的互动教具」\n\n生成后你可以继续说「把颜色改成蓝色」「增加一个练习模式」来修改。",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sessionState, setSessionState] = useState<SessionState | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 更新 iframe 预览
  useEffect(() => {
    if (previewHtml && iframeRef.current) {
      const blob = new Blob([previewHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      return () => URL.revokeObjectURL(url);
    }
  }, [previewHtml]);

  // 发送消息
  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) return;

      setInput("");
      setIsLoading(true);

      // 添加用户消息
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: msg,
      };
      setMessages((prev) => [...prev, userMsg]);

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: msg,
            sessionState: sessionState
              ? {
                  messages: sessionState.messages,
                  currentHtml: sessionState.currentHtml,
                  currentSpec: sessionState.currentSpec,
                  stage: sessionState.stage,
                  toolName: sessionState.toolName,
                  chapter: sessionState.chapter,
                  grade: sessionState.grade,
                  subject: sessionState.subject,
                }
              : undefined,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "请求失败" }));
          throw new Error(err.error || "请求失败");
        }

        // 解析 SSE 流
        const reader = res.body?.getReader();
        if (!reader) throw new Error("无法读取响应流");

        const decoder = new TextDecoder();
        let assistantContent = "";
        let assistantStage = "";
        let assistantActions: { label: string; action: string }[] | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: AgentEvent = JSON.parse(line.slice(6));

              if (event.type === "done" && event._state) {
                // 更新 session state
                setSessionState(event._state);
              }

              if (event.content) {
                assistantContent = event.content;
                assistantStage = event.type;
              }

              if (event.html) {
                setPreviewHtml(event.html);
                setShowPreview(true);
              }

              if (event.actions) {
                assistantActions = event.actions;
              }
            } catch {
              // 忽略解析错误
            }
          }
        }

        // 添加助手消息
        if (assistantContent) {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}`,
              role: "assistant",
              content: assistantContent,
              stage: assistantStage,
              actions: assistantActions,
            },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: `出错了：${err instanceof Error ? err.message : "请重试"}`,
            stage: "error",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, sessionState],
  );

  // 处理快捷操作
  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case "restart":
          setSessionState(null);
          setPreviewHtml(null);
          setShowPreview(false);
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "已重置。请描述你想创建的教具。",
            },
          ]);
          break;
        case "iterate":
          inputRef.current?.focus();
          break;
        case "save":
          handleSave();
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionState],
  );

  const handleSave = useCallback(async () => {
    if (!sessionState?.currentHtml) return;

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "",
          action: "save",
          sessionState,
          saveMeta: {
            gradeId: sessionState.grade || "p5",
            subjectId: sessionState.subject || "math",
            semester: "上册" as const,
          },
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `save-${Date.now()}`,
            role: "assistant",
            content: `教具「${sessionState.toolName || "自定义教具"}」已保存成功！`,
          },
        ]);
      } else {
        throw new Error(data.error || "保存失败");
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `save-err-${Date.now()}`,
          role: "assistant",
          content: `保存失败：${err instanceof Error ? err.message : "请重试"}`,
          stage: "error",
        },
      ]);
    }
  }, [sessionState]);

  // 键盘快捷键
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage],
  );

  return (
    <div className="agent-page">
      {/* ── 头部 ── */}
      <header className="agent-header">
        <Link href="/" className="agent-logo">
          教立方
        </Link>
        <h1 className="agent-title">AI 教具助手</h1>
        <div className="agent-header-actions">
          {previewHtml && (
            <button
              className="preview-toggle"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? "收起预览" : "展开预览"}
            </button>
          )}
        </div>
      </header>

      {/* ── 主内容 ── */}
      <div className="agent-body">
        {/* 对话面板 */}
        <div className={`agent-chat ${showPreview ? "with-preview" : ""}`}>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`chat-msg chat-msg-${msg.role}`}>
                {msg.role === "assistant" && (
                  <div className="chat-avatar">AI</div>
                )}
                <div className="chat-bubble">
                  {msg.stage && msg.stage !== "done" && msg.stage !== "error" && (
                    <div className={`stage-badge stage-${msg.stage}`}>
                      {stageLabel(msg.stage)}
                    </div>
                  )}
                  <div className="chat-text">{formatContent(msg.content)}</div>
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="chat-actions">
                      {msg.actions.map((act) => (
                        <button
                          key={act.action}
                          className="chat-action-btn"
                          onClick={() => handleAction(act.action)}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="chat-msg chat-msg-assistant">
                <div className="chat-avatar">AI</div>
                <div className="chat-bubble">
                  <div className="chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 输入区 */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="描述你想创建的教具，或对当前教具提出修改..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={isLoading}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "生成中..." : "发送"}
            </button>
          </div>
        </div>

        {/* 预览面板 */}
        {showPreview && previewHtml && (
          <div className="agent-preview">
            <div className="preview-header">
              <span>实时预览</span>
              <button
                className="preview-close"
                onClick={() => setShowPreview(false)}
              >
                ✕
              </button>
            </div>
            <iframe
              ref={iframeRef}
              className="preview-iframe"
              sandbox="allow-scripts allow-same-origin"
              title="教具预览"
            />
          </div>
        )}
      </div>

      <style>{agentStyles}</style>
    </div>
  );
}

/* ──────────────────────────────────────
 * 辅助函数
 * ────────────────────────────────────── */

function stageLabel(stage: string): string {
  const map: Record<string, string> = {
    thinking: "思考中...",
    planning: "规划教具",
    generating: "生成代码",
    reviewing: "质量检查",
    editing: "修改中",
    done: "完成",
    error: "出错了",
  };
  return map[stage] || stage;
}

function formatContent(text: string) {
  // 简单换行处理
  return text.split("\n").map((line, i) => (
    <span key={i}>
      {line}
      {i < text.split("\n").length - 1 && <br />}
    </span>
  ));
}

/* ──────────────────────────────────────
 * 样式
 * ────────────────────────────────────── */

const agentStyles = `
.agent-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f8f9fa;
  font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
}

.agent-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 24px;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,.05);
}

.agent-logo {
  font-weight: 800;
  font-size: 18px;
  color: #2d3a8c;
  text-decoration: none;
}

.agent-title {
  font-size: 16px;
  font-weight: 600;
  color: #374151;
}

.agent-header-actions {
  margin-left: auto;
}

.preview-toggle {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  background: #2d3a8c;
  color: #fff;
  border: none;
  cursor: pointer;
}

.agent-body {
  flex: 1;
  display: flex;
  overflow: hidden;
}

/* ── 对话面板 ── */
.agent-chat {
  flex: 1;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
.agent-chat.with-preview {
  max-width: 480px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-msg {
  display: flex;
  gap: 10px;
  max-width: 100%;
}

.chat-msg-user {
  justify-content: flex-end;
}

.chat-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2d3a8c;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.chat-bubble {
  max-width: 85%;
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.chat-msg-assistant .chat-bubble {
  background: #fff;
  border: 1px solid #e5e7eb;
  color: #1f2937;
  border-top-left-radius: 4px;
}

.chat-msg-user .chat-bubble {
  background: #2d3a8c;
  color: #fff;
  border-top-right-radius: 4px;
}

.stage-badge {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 6px;
}

.stage-thinking { background: #fef3c7; color: #92400e; }
.stage-planning { background: #dbeafe; color: #1e40af; }
.stage-generating { background: #ede9fe; color: #5b21b6; }
.stage-reviewing { background: #d1fae5; color: #065f46; }
.stage-editing { background: #fce7f3; color: #9d174d; }
.stage-error { background: #fee2e2; color: #991b1b; }

.chat-text {
  white-space: pre-wrap;
}

.chat-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.chat-action-btn {
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1.5px solid #2d3a8c;
  background: #fff;
  color: #2d3a8c;
  cursor: pointer;
  transition: all .15s;
}
.chat-action-btn:hover {
  background: #2d3a8c;
  color: #fff;
}

/* 打字动画 */
.chat-typing {
  display: flex;
  gap: 6px;
  padding: 4px 0;
}
.chat-typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #9ca3af;
  animation: typing-dot 1.2s infinite;
}
.chat-typing span:nth-child(2) { animation-delay: 0.2s; }
.chat-typing span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-dot {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-6px); opacity: 1; }
}

/* ── 输入区 ── */
.chat-input-area {
  display: flex;
  gap: 10px;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #e5e7eb;
}

.chat-input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color .15s;
}
.chat-input:focus {
  border-color: #2d3a8c;
}

.chat-send-btn {
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  background: #2d3a8c;
  color: #fff;
  border: none;
  cursor: pointer;
  transition: all .15s;
  white-space: nowrap;
}
.chat-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.chat-send-btn:not(:disabled):hover {
  background: #1e4a76;
}

/* ── 预览面板 ── */
.agent-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-left: 1px solid #e5e7eb;
  background: #fff;
  min-width: 400px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
}

.preview-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f3f4f6;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe {
  flex: 1;
  border: none;
  width: 100%;
  height: 100%;
}

/* ── 响应式 ── */
@media (max-width: 768px) {
  .agent-body {
    flex-direction: column;
  }
  .agent-preview {
    min-width: unset;
    max-height: 50vh;
    border-left: none;
    border-top: 1px solid #e5e7eb;
  }
  .agent-chat.with-preview {
    max-width: 100%;
  }
}
`;
