import Link from "next/link";
import BackArrow from "@/components/BackArrow";
import ShareButton from "@/components/ShareButton";
import FullscreenButton from "@/components/FullscreenButton";
import { getPathLabel } from "@/data/curriculum";
import type { Tool } from "@/data/tools";

interface ToolPageHeaderProps {
  tool: Tool;
}

export default function ToolPageHeader({ tool }: ToolPageHeaderProps) {
  const pathLabel = getPathLabel(tool.gradeId, tool.subjectId);

  return (
    <header
      className="flex h-12 flex-shrink-0 items-center justify-between gap-3 border-b px-4"
      style={{
        background: "var(--edu-header-bg)",
        borderColor: "var(--edu-header-border)",
      }}
    >
      <Link
        href="/"
        className="flex flex-shrink-0 items-center gap-1.5 text-sm text-white/60 transition-colors hover:text-white"
      >
        <BackArrow />
        <span className="hidden sm:inline">返回</span>
      </Link>

      <div className="flex min-w-0 items-center gap-2">
        <span className="text-lg flex-shrink-0">{tool.icon}</span>
        <span
          className="truncate text-sm font-semibold text-white"
          style={{ fontFamily: "var(--edu-font-serif)" }}
        >
          {tool.name}
        </span>
        <span
          className="hidden max-w-[min(280px,40vw)] flex-shrink-0 truncate text-xs text-white/60 sm:inline"
          title={pathLabel}
        >
          · {pathLabel}
        </span>
      </div>

      <div className="flex flex-shrink-0 items-center gap-2">
        <ShareButton toolName={tool.name} />
        <FullscreenButton />
      </div>
    </header>
  );
}
