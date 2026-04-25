export const agentStyles = `
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
