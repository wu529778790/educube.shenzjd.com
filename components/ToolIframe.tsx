"use client";

import { useState, useCallback } from "react";

interface ToolIframeProps {
  src: string;
  title: string;
}

export default function ToolIframe({ src, title }: ToolIframeProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setLoading(false);
    setError(true);
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden min-h-0">
      {loading && !error && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/90"
          style={{ background: "var(--edu-primary)" }}
          aria-busy="true"
          aria-live="polite"
        >
          <svg
            className="w-9 h-9 animate-spin text-white/85"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="31.4 31.4"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm font-medium">教具加载中…</p>
        </div>
      )}
      {error && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-red-50"
          role="alert"
        >
          <svg
            className="w-9 h-9 text-red-500"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="M12 8v4M12 16h.01"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm font-semibold text-red-600">教具加载失败，请刷新页面重试</p>
        </div>
      )}
      <iframe
        key={src}
        src={src}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-scripts"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}
