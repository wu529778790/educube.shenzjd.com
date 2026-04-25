import type { RefObject } from "react";
import type { ChatMessage } from "@/components/agent/types";

interface AgentMessageListProps {
  isLoading: boolean;
  messages: ChatMessage[];
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onAction: (action: string) => void;
}

export default function AgentMessageList({
  isLoading,
  messages,
  messagesEndRef,
  onAction,
}: AgentMessageListProps) {
  return (
    <div className="chat-messages">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`chat-msg chat-msg-${message.role}`}
        >
          {message.role === "assistant" && <div className="chat-avatar">AI</div>}
          <div className="chat-bubble">
            {message.stage &&
              message.stage !== "done" &&
              message.stage !== "error" && (
                <div className={`stage-badge stage-${message.stage}`}>
                  {stageLabel(message.stage)}
                </div>
              )}
            <div className="chat-text">{formatContent(message.content)}</div>
            {message.actions && message.actions.length > 0 && (
              <div className="chat-actions">
                {message.actions.map((action) => (
                  <button
                    key={action.action}
                    className="chat-action-btn"
                    onClick={() => onAction(action.action)}
                  >
                    {action.label}
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
  );
}

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
  const lines = text.split("\n");

  return lines.map((line, index) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </span>
  ));
}
