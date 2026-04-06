"use client";

import { useState, useCallback } from "react";

interface ToolIframeProps {
  src: string;
  title: string;
}

export default function ToolIframe({ src, title }: ToolIframeProps) {
  const [loading, setLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setLoading(false);
  }, []);

  return (
    <div className="relative flex-1 overflow-hidden min-h-0">
      {loading && (
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
      <iframe
        key={src}
        src={src}
        className="w-full h-full border-0"
        title={title}
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleLoad}
      />
    </div>
  );
}
