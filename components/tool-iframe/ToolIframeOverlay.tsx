import type { ToolIframeState } from "@/components/tool-iframe/state";

interface ToolIframeOverlayProps {
  state: ToolIframeState;
}

export default function ToolIframeOverlay({ state }: ToolIframeOverlayProps) {
  if (state.loading && !state.error) {
    return (
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-white/90"
        style={{ background: "var(--edu-primary)" }}
        aria-busy="true"
        aria-live="polite"
      >
        <svg
          className="h-9 w-9 animate-spin text-white/85"
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
    );
  }

  if (state.error) {
    return (
      <div
        className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-red-50"
        role="alert"
      >
        <svg
          className="h-9 w-9 text-red-500"
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
        <p className="text-sm font-semibold text-red-600">
          教具加载失败，请刷新页面重试
        </p>
      </div>
    );
  }

  return null;
}
