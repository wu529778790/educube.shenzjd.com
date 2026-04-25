"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import AgentInputBar from "@/components/agent/AgentInputBar";
import AgentMessageList from "@/components/agent/AgentMessageList";
import AgentPreviewPanel from "@/components/agent/AgentPreviewPanel";
import { agentStyles } from "@/components/agent/styles";
import { useAgentChat } from "@/components/agent/useAgentChat";

/* ──────────────────────────────────────
 * Agent 对话页面
 * ────────────────────────────────────── */

export default function AgentPageContent() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    handleAction,
    handleKeyDown,
    input,
    isLoading,
    messages,
    previewHtml,
    sendMessage,
    setInput,
    setShowPreview,
    showPreview,
  } = useAgentChat(inputRef);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
          <AgentMessageList
            isLoading={isLoading}
            messages={messages}
            messagesEndRef={messagesEndRef}
            onAction={handleAction}
          />

          {/* 输入区 */}
          <AgentInputBar
            input={input}
            inputRef={inputRef}
            isLoading={isLoading}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            onSend={() => void sendMessage()}
          />
        </div>

        {/* 预览面板 */}
        {showPreview && previewHtml && (
          <AgentPreviewPanel
            html={previewHtml}
            onClose={() => setShowPreview(false)}
          />
        )}
      </div>

      <style>{agentStyles}</style>
    </div>
  );
}
