"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface ShareButtonProps {
  toolName: string;
}

export default function ShareButton({ toolName }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const url =
    typeof window !== "undefined" ? window.location.href : "";

  // 点击外部关闭
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <div className="relative" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-slate-300 bg-slate-700 hover:bg-slate-600 hover:text-white px-3 py-1.5 rounded transition-colors"
        title="分享教具"
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
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-4 z-50">
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

/** 轻量 QR 码 SVG 渲染，基于 qrcode-generator */
function QRCodeSVG({ text, size }: { text: string; size: number }) {
  // 动态导入会复杂化，直接用 inline 生成
  const [svg, setSvg] = useState<React.ReactNode>(null);

  useEffect(() => {
    import("qrcode-generator").then((QRCode) => {
      const qr = QRCode.default(0, "M");
      qr.addData(text);
      qr.make();
      const moduleCount = qr.getModuleCount();
      const cellSize = size / moduleCount;

      const rects: React.ReactNode[] = [];
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            rects.push(
              <rect
                key={`${row}-${col}`}
                x={col * cellSize}
                y={row * cellSize}
                width={cellSize + 0.5}
                height={cellSize + 0.5}
                fill="#1e293b"
              />,
            );
          }
        }
      }

      setSvg(
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rounded"
        >
          <rect width={size} height={size} fill="white" rx="4" />
          {rects}
        </svg>,
      );
    });
  }, [text, size]);

  return (
    <div className="w-[140px] h-[140px] flex items-center justify-center bg-slate-50 rounded">
      {svg ?? (
        <span className="text-xs text-slate-400">加载中…</span>
      )}
    </div>
  );
}
