"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  searchInput?: string;
  onSearchChange?: (value: string) => void;
}

export default function Header({ searchInput, onSearchChange }: HeaderProps) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <header
      className="sticky top-0 z-50 backdrop-blur-xl border-b shadow-sm"
      style={{
        background: "var(--edu-header-bg)",
        borderColor: "var(--edu-header-border)",
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-md"
            style={{ background: "var(--edu-accent-gradient)" }}
          >
            <span className="text-white font-bold text-sm">教</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-white text-base" style={{ fontFamily: "var(--edu-font-serif)" }}>
                教立方
              </span>
              <span className="text-white/60 text-sm">EduCube</span>
            </div>
            <p className="text-white/60 text-xs mt-0.5 hidden sm:block">
              中小学交互教具平台 · 按教材与年级浏览
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2.5 shrink-0">
          {onSearchChange && (
            <>
              {/* Desktop search */}
              <div className="relative hidden sm:block">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchInput ?? ""}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="搜索教具…"
                  aria-label="搜索教具"
                  className="w-48 lg:w-56 rounded-lg border bg-white/10 border-white/20 pl-9 pr-3 py-1.5 text-sm outline-none transition-all focus:bg-white/20 focus:border-white/40 placeholder-white/40"
                  style={{ color: "white" }}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => onSearchChange("")}
                    aria-label="清除搜索"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-colors"
                    style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.7)" }}
                  >
                    &times;
                  </button>
                )}
              </div>

              {/* Mobile search toggle */}
              <button
                type="button"
                onClick={() => { setMobileSearchOpen(!mobileSearchOpen); if (mobileSearchOpen) onSearchChange(""); }}
                aria-label="搜索教具"
                className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
              >
                {mobileSearchOpen ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                )}
              </button>
            </>
          )}
          <Link
            href="/generate"
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl edu-btn-accent shrink-0 shadow-md hover:shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
            AI 生成
          </Link>
        </div>
      </div>

      {/* Mobile search bar */}
      {onSearchChange && mobileSearchOpen && (
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "rgba(255,255,255,0.5)" }}
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
            <input
              ref={mobileInputRef}
              type="text"
              value={searchInput ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索教具…"
              aria-label="搜索教具"
              className="w-full rounded-lg border bg-white/10 border-white/20 pl-9 pr-3 py-2.5 text-sm outline-none transition-all focus:bg-white/20 focus:border-white/40 placeholder-white/40"
              style={{ color: "white" }}
            />
          </div>
        </div>
      )}
    </header>
  );
}
