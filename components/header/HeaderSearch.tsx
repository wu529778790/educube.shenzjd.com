"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

interface UseHeaderSearchOptions {
  onSearchChange: (value: string) => void;
}

interface HeaderSearchFieldProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
}

interface SearchFieldProps extends HeaderSearchFieldProps {
  mobile?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
}

interface HeaderSearchToggleProps {
  mobileSearchOpen: boolean;
  onToggle: () => void;
}

function SearchIcon() {
  return (
    <svg
      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
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
  );
}

export function useHeaderSearch({ onSearchChange }: UseHeaderSearchOptions) {
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mobileSearchOpen && mobileInputRef.current) {
      mobileInputRef.current.focus();
    }
  }, [mobileSearchOpen]);

  const handleMobileSearchToggle = () => {
    setMobileSearchOpen((current) => {
      if (current) {
        onSearchChange("");
      }

      return !current;
    });
  };

  return {
    mobileInputRef,
    mobileSearchOpen,
    handleMobileSearchToggle,
  };
}

export function HeaderSearchField({
  searchInput,
  onSearchChange,
  mobile = false,
  inputRef,
}: SearchFieldProps) {
  return (
    <div className="relative">
      <SearchIcon />
      <input
        ref={inputRef}
        type="text"
        value={searchInput}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="搜索教具…"
        aria-label="搜索教具"
        className={
          mobile
            ? "w-full rounded-lg border border-white/20 bg-white/10 py-2.5 pl-9 pr-3 text-sm outline-none transition-all placeholder-white/40 focus:border-white/40 focus:bg-white/20"
            : "w-48 rounded-lg border border-white/20 bg-white/10 py-1.5 pl-9 pr-3 text-sm outline-none transition-all placeholder-white/40 focus:border-white/40 focus:bg-white/20 lg:w-56"
        }
        style={{ color: "white" }}
      />
      {!mobile && searchInput && (
        <button
          type="button"
          onClick={() => onSearchChange("")}
          aria-label="清除搜索"
          className="absolute right-2 top-1/2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-full text-[10px] transition-colors"
          style={{
            background: "rgba(255,255,255,0.2)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          &times;
        </button>
      )}
    </div>
  );
}

export function HeaderSearchToggle({
  mobileSearchOpen,
  onToggle,
}: HeaderSearchToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="搜索教具"
      className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors sm:hidden"
      style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
    >
      {mobileSearchOpen ? (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      )}
    </button>
  );
}
