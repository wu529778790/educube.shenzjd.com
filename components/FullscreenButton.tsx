"use client";

export default function FullscreenButton() {
  return (
    <button
      className="flex items-center gap-1.5 text-xs text-white/70 px-3 py-1.5 rounded-lg transition-all hover:text-white cursor-pointer"
      style={{ background: "rgba(255,255,255,0.08)" }}
      title="全屏显示"
      onClick={() => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }}
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
      </svg>
      <span className="hidden sm:inline">全屏</span>
    </button>
  );
}
