import type { RefObject } from "react";
import { getAgentMessageDisplayInfo } from "@/components/agent/message-list";
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
      {messages.map((message) => {
        const display = getAgentMessageDisplayInfo(message);

        return (
          <div
            key={message.id}
            className={`chat-msg chat-msg-${message.role}`}
          >
            {message.role === "assistant" && <div className="chat-avatar">AI</div>}
            <div className="chat-bubble">
              {display.showStageBadge && display.stageClassName && display.stageLabel && (
                <div className={`stage-badge ${display.stageClassName}`}>
                  {display.stageLabel}
                </div>
              )}
              <div className="chat-text">
                {display.contentLines.map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < display.contentLines.length - 1 && <br />}
                  </span>
                ))}
              </div>
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
        );
      })}

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
