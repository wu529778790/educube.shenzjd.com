"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import {
  createInitialToolIframeState,
  markToolIframeErrored,
  markToolIframeLoaded,
  TOOL_IFRAME_READY_TIMEOUT_MS,
  type ToolIframeState,
} from "@/components/tool-iframe/state";

interface UseToolIframeStateOptions {
  src: string;
}

interface UseToolIframeStateResult {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  state: ToolIframeState;
  handleLoad: () => void;
  handleError: () => void;
}

export function useToolIframeState({
  src,
}: UseToolIframeStateOptions): UseToolIframeStateResult {
  const [state, setState] = useState<ToolIframeState>(() =>
    createInitialToolIframeState(),
  );
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const finishLoad = useCallback(() => {
    setState(markToolIframeLoaded());
  }, []);

  const handleLoad = useCallback(() => {
    finishLoad();
  }, [finishLoad]);

  const handleError = useCallback(() => {
    setState(markToolIframeErrored());
  }, []);

  useEffect(() => {
    let done = false;

    const complete = () => {
      if (done) {
        return;
      }

      done = true;
      finishLoad();
    };

    const iframe = iframeRef.current;
    if (!iframe) {
      const fallbackId = window.setTimeout(
        complete,
        TOOL_IFRAME_READY_TIMEOUT_MS,
      );

      return () => {
        done = true;
        window.clearTimeout(fallbackId);
      };
    }

    const onLoadEvent = () => complete();
    iframe.addEventListener("load", onLoadEvent);

    const checkAlreadyDone = () => {
      try {
        if (iframe.contentDocument?.readyState === "complete") {
          complete();
        }
      } catch {
        /* 非同源时不可读 document，依赖 load 事件 */
      }
    };

    checkAlreadyDone();
    const rafId = requestAnimationFrame(checkAlreadyDone);
    const timeoutId = window.setTimeout(
      complete,
      TOOL_IFRAME_READY_TIMEOUT_MS,
    );

    return () => {
      done = true;
      iframe.removeEventListener("load", onLoadEvent);
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeoutId);
    };
  }, [finishLoad, src]);

  return {
    iframeRef,
    state,
    handleLoad,
    handleError,
  };
}
