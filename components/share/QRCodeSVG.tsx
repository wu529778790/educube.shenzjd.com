"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

interface QRCodeSVGProps {
  text: string;
  size: number;
}

export default function QRCodeSVG({ text, size }: QRCodeSVGProps) {
  const [svg, setSvg] = useState<ReactNode>(null);

  useEffect(() => {
    let cancelled = false;

    import("qrcode-generator")
      .then((QRCode) => {
        if (cancelled) {
          return;
        }

        const qr = QRCode.default(0, "M");
        qr.addData(text);
        qr.make();

        const moduleCount = qr.getModuleCount();
        const cellSize = size / moduleCount;
        const rects: ReactNode[] = [];

        for (let row = 0; row < moduleCount; row += 1) {
          for (let col = 0; col < moduleCount; col += 1) {
            if (!qr.isDark(row, col)) {
              continue;
            }

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
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }

        if (process.env.NODE_ENV === "development") {
          console.warn("[QRCode] 加载失败:", error);
        }

        setSvg(<span className="text-xs text-red-400">二维码加载失败</span>);
      });

    return () => {
      cancelled = true;
    };
  }, [size, text]);

  return (
    <div className="flex h-[140px] w-[140px] items-center justify-center rounded bg-slate-50">
      {svg ?? <span className="text-xs text-slate-400">加载中…</span>}
    </div>
  );
}
