import { useCallback, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { executeAgentChatAction } from "@/components/agent/action-handlers";
import {
  createInitialChatMessages,
  createRequestErrorMessage,
  createResetChatMessages,
  createUserChatMessage,
} from "@/components/agent/messages";
import { createAgentStreamStateUpdate } from "@/components/agent/stream-updates";
import type { ChatMessage } from "@/components/agent/types";
import {
  streamAgentMessage,
} from "@/lib/agent/client";
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

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isLoading) {
        return;
      }

      setInput("");
      setIsLoading(true);
      appendMessage(createUserChatMessage(msg));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);

      try {
        await streamAgentMessage({
          message: msg,
          sessionId: sessionState?.sessionId,
          signal: controller.signal,
          onEvent: (event) => {
            const update = createAgentStreamStateUpdate(event);

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
          },
        });
      } catch (error) {
        appendMessage(createRequestErrorMessage(error));
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    },
    [appendMessage, input, isLoading, sessionState],
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
