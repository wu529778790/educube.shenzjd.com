import { useCallback, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { executeAgentChatAction } from "@/components/agent/action-handlers";
import {
  createInitialChatMessages,
  createResetChatMessages,
} from "@/components/agent/messages";
import { executeAgentSendMessage } from "@/components/agent/send-handler";
import type { AgentStreamStateUpdate } from "@/components/agent/stream-updates";
import type { ChatMessage } from "@/components/agent/types";
import type { AgentClientSessionState } from "@/lib/agent/types";

export interface UseAgentChatResult {
  handleAction: (action: string) => void;
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  input: string;
  isLoading: boolean;
  messages: ChatMessage[];
  previewHtml: string | null;
  sendMessage: (text?: string) => Promise<void>;
  sessionState: AgentClientSessionState | null;
  setInput: (value: string) => void;
  setShowPreview: (value: boolean) => void;
  showPreview: boolean;
}

export function useAgentChat(
  inputRef: RefObject<HTMLTextAreaElement | null>,
): UseAgentChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>(
    createInitialChatMessages,
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [sessionState, setSessionState] =
    useState<AgentClientSessionState | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const applyStreamUpdate = useCallback((update: AgentStreamStateUpdate) => {
    if (update.sessionState !== undefined) {
      setSessionState(update.sessionState);
    }

    if (update.message) {
      appendMessage(update.message);
    }

    if (update.previewHtml) {
      setPreviewHtml(update.previewHtml);
      setShowPreview(true);
    }
  }, [appendMessage]);

  const sendMessage = useCallback(
    async (text?: string) => {
      await executeAgentSendMessage({
        appendMessage,
        applyStreamUpdate,
        isLoading,
        message: text || input,
        sessionId: sessionState?.sessionId,
        setInput,
        setLoading: setIsLoading,
      });
    },
    [appendMessage, applyStreamUpdate, input, isLoading, sessionState],
  );

  const resetChatState = useCallback(() => {
    setSessionState(null);
    setPreviewHtml(null);
    setShowPreview(false);
    setMessages(createResetChatMessages());
  }, []);

  const handleAction = useCallback(
    (action: string) => {
      void executeAgentChatAction({
        action,
        appendMessage,
        inputRef,
        resetChatState,
        sessionState,
      });
    },
    [appendMessage, inputRef, resetChatState, sessionState],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void sendMessage();
      }
    },
    [sendMessage],
  );

  return {
    handleAction,
    handleKeyDown,
    input,
    isLoading,
    messages,
    previewHtml,
    sendMessage,
    sessionState,
    setInput,
    setShowPreview,
    showPreview,
  };
}
