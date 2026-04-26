"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface UseSharePopoverOptions {
  url: string;
}

interface UseSharePopoverResult {
  open: boolean;
  copied: boolean;
  popoverRef: RefObject<HTMLDivElement | null>;
  toggleOpen: () => void;
  handleCopy: () => Promise<void>;
}

export function useSharePopover({
  url,
}: UseSharePopoverOptions): UseSharePopoverResult {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const copiedResetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const clickHandler = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    const keyHandler = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", clickHandler);
    document.addEventListener("keydown", keyHandler);

    return () => {
      document.removeEventListener("mousedown", clickHandler);
      document.removeEventListener("keydown", keyHandler);
    };
  }, [open]);

  useEffect(() => {
    return () => {
      if (copiedResetTimerRef.current !== null) {
        window.clearTimeout(copiedResetTimerRef.current);
      }
    };
  }, []);

  const toggleOpen = useCallback(() => {
    setOpen((current) => !current);
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);

      if (copiedResetTimerRef.current !== null) {
        window.clearTimeout(copiedResetTimerRef.current);
      }

      copiedResetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        copiedResetTimerRef.current = null;
      }, 2000);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("[ShareButton] 复制失败:", error);
      }
    }
  }, [url]);

  return {
    open,
    copied,
    popoverRef,
    toggleOpen,
    handleCopy,
  };
}
