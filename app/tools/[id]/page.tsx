import { getPathLabel } from "@/data/curriculum";
import { tools } from "@/data/tools";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackArrow from "@/components/BackArrow";
import ShareButton from "@/components/ShareButton";
import ToolIframe from "@/components/ToolIframe";
import FullscreenButton from "@/components/FullscreenButton";
import {
  createToolMetadata,
  findToolPageEntry,
  getToolIframeSrc,
} from "@/lib/tool-page";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600; // 1 小时 ISR，降低 generated tool 页面的 SSR 压力

export async function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await findToolPageEntry(id);
  return result ? createToolMetadata(result.tool) : {};
}

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const result = await findToolPageEntry(id);
  if (!result) notFound();

  const { tool, isGenerated } = result;
  const iframeSrc = getToolIframeSrc(id, isGenerated);

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--edu-primary)" }}>
      {/* 顶部工具条 — 深靛蓝 */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b gap-3"
        style={{
          background: "var(--edu-header-bg)",
          borderColor: "var(--edu-header-border)",
        }}
      >
        {/* 返回 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm flex-shrink-0"
        >
          <BackArrow />
          <span className="hidden sm:inline">返回</span>
        </Link>

        {/* 中间：工具名 */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{tool.icon}</span>
          <span
            className="text-sm font-semibold text-white truncate"
            style={{ fontFamily: "var(--edu-font-serif)" }}
          >
            {tool.name}
          </span>
          <span
            className="hidden sm:inline text-xs text-white/60 flex-shrink-0 truncate max-w-[min(280px,40vw)]"
            title={getPathLabel(tool.gradeId, tool.subjectId)}
          >
            · {getPathLabel(tool.gradeId, tool.subjectId)}
          </span>
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <ShareButton toolName={tool.name} />
          <FullscreenButton />
        </div>
      </header>

      <ToolIframe key={iframeSrc} src={iframeSrc} title={tool.name} />
    </div>
  );
}
