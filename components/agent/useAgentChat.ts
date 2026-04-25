import { useCallback, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import {
  createInitialChatMessages,
  createRequestErrorMessage,
  createResetChatMessages,
  createSaveErrorMessage,
  createSaveSuccessMessage,
  createUserChatMessage,
} from "@/components/agent/messages";
import { createAgentStreamStateUpdate } from "@/components/agent/stream-updates";
import type { ChatMessage } from "@/components/agent/types";
import {
  restartAgentSession,
  saveAgentTool,
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

  const handleSave = useCallback(async () => {
    if (!sessionState?.sessionId) {
      return;
    }

    try {
      const data = await saveAgentTool({
        sessionId: sessionState.sessionId,
        gradeId: sessionState.grade || "p5",
        subjectId: sessionState.subject || "math",
        semester: "上册",
      });

      if (data.ok) {
        appendMessage(createSaveSuccessMessage(sessionState.toolName));
        return;
      }

      throw new Error(data.error || "保存失败");
    } catch (error) {
      appendMessage(createSaveErrorMessage(error));
    }
  }, [appendMessage, sessionState]);

  const handleAction = useCallback(
    (action: string) => {
      switch (action) {
        case "restart":
          if (sessionState?.sessionId) {
            void restartAgentSession(sessionState.sessionId);
          }
          setSessionState(null);
          setPreviewHtml(null);
          setShowPreview(false);
          setMessages(createResetChatMessages());
          return;
        case "iterate":
          inputRef.current?.focus();
          return;
        case "save":
          void handleSave();
          return;
      }
    },
    [handleSave, inputRef, sessionState],
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
