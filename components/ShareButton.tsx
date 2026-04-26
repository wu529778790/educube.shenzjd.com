"use client";

import { useState } from "react";
import QRCodeSVG from "@/components/share/QRCodeSVG";
import { useSharePopover } from "@/components/share/useSharePopover";

interface ShareButtonProps {
  toolName: string;
}

export default function ShareButton({ toolName }: ShareButtonProps) {
  const [url] = useState(() =>
    typeof window === "undefined" ? "" : window.location.href,
  );
  const {
    open,
    copied,
    popoverRef,
    toggleOpen,
    handleCopy,
  } = useSharePopover({ url });

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={toggleOpen}
        className="flex items-center gap-1.5 text-xs hover:text-white px-3 py-1.5 rounded transition-colors"
        style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)" }}
        title="分享教具"
        aria-label="分享教具"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
          />
        </svg>
        <span className="hidden sm:inline">分享</span>
      </button>

      {open && (
        <div role="dialog" aria-label="分享选项" className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
          <p className="text-sm font-semibold text-slate-800 mb-3">
            分享「{toolName}」
          </p>

          {/* 二维码 */}
          <div className="flex justify-center mb-3">
            <QRCodeSVG text={url} size={140} />
          </div>
          <p className="text-[10px] text-slate-400 text-center mb-3">
            扫码在手机或平板上打开教具
          </p>

          {/* 复制链接 */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                已复制
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                复制链接
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
