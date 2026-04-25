import { useCallback, useState } from "react";
import type { KeyboardEvent, RefObject } from "react";
import type { ChatMessage } from "@/components/agent/types";
import {
  restartAgentSession,
  saveAgentTool,
  streamAgentMessage,
} from "@/lib/agent/client";
import type { AgentClientSessionState } from "@/lib/agent/types";

const DEFAULT_WELCOME_MESSAGE =
  "你好！我是教立方的 AI 助手。\n\n你可以用自然语言描述你想创建的教学工具，我会帮你生成交互式教具。例如：\n\n• 「做一个三年级分数初步认识的工具」\n• 「生成一个五年级面积计算的互动教具」\n\n生成后你可以继续说「把颜色改成蓝色」「增加一个练习模式」来修改。";

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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: DEFAULT_WELCOME_MESSAGE,
    },
  ]);
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
      appendMessage({
        id: `user-${Date.now()}`,
        role: "user",
        content: msg,
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600000);

      try {
        await streamAgentMessage({
          message: msg,
          sessionId: sessionState?.sessionId,
          signal: controller.signal,
          onEvent: (event) => {
            if (event.type === "done") {
              if (event._state !== undefined) {
                setSessionState(event._state ?? null);
              }
              if (event.html) {
                setPreviewHtml(event.html);
                setShowPreview(true);
              }
              return;
            }

            if (event.type === "error") {
              appendMessage({
                id: `error-${Date.now()}`,
                role: "assistant",
                content: event.content,
                stage: "error",
              });
              return;
            }

            appendMessage({
              id: `${event.type}-${Date.now()}`,
              role: "assistant",
              content: event.content,
              stage: event.type,
              actions: event.actions,
            });

            if (event.html) {
              setPreviewHtml(event.html);
              setShowPreview(true);
            }
          },
        });
      } catch (error) {
        appendMessage({
          id: `error-${Date.now()}`,
          role: "assistant",
          content: `出错了：${error instanceof Error ? error.message : "请重试"}`,
          stage: "error",
        });
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
        appendMessage({
          id: `save-${Date.now()}`,
          role: "assistant",
          content: `教具「${sessionState.toolName || "自定义教具"}」已保存成功！`,
        });
        return;
      }

      throw new Error(data.error || "保存失败");
    } catch (error) {
      appendMessage({
        id: `save-err-${Date.now()}`,
        role: "assistant",
        content: `保存失败：${error instanceof Error ? error.message : "请重试"}`,
        stage: "error",
      });
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
          setMessages([
            {
              id: "welcome",
              role: "assistant",
              content: "已重置。请描述你想创建的教具。",
            },
          ]);
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
