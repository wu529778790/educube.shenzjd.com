import type { KeyboardEvent, RefObject } from "react";

interface AgentInputBarProps {
  input: string;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  isLoading: boolean;
  onChange: (value: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSend: () => void;
}

export default function AgentInputBar({
  input,
  inputRef,
  isLoading,
  onChange,
  onKeyDown,
  onSend,
}: AgentInputBarProps) {
  return (
    <div className="chat-input-area">
      <textarea
        ref={inputRef}
        className="chat-input"
        placeholder="描述你想创建的教具，或对当前教具提出修改..."
        value={input}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={onKeyDown}
        rows={2}
        disabled={isLoading}
      />
      <button
        className="chat-send-btn"
        onClick={onSend}
        disabled={isLoading || !input.trim()}
      >
        {isLoading ? "生成中..." : "发送"}
      </button>
    </div>
  );
}
