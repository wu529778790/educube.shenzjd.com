import { getPathLabel } from "@/data/curriculum";
import { getToolById, tools } from "@/data/tools";
import {
  ensureGeneratedToolHtmlFile,
  loadGeneratedTools,
} from "@/data/generated-tools";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackArrow from "@/components/BackArrow";
import ShareButton from "@/components/ShareButton";
import ToolIframe from "@/components/ToolIframe";
import FullscreenButton from "@/components/FullscreenButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamicParams = true;
export const revalidate = 3600; // 1 小时 ISR，降低 generated tool 页面的 SSR 压力

export async function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }));
}

async function findTool(id: string) {
  // 快速路径：静态工具直接命中，无需加载生成工具索引
  const staticTool = getToolById(id);
  if (staticTool) return { tool: staticTool, isGenerated: false };
  // 只有 gen- 前缀的 ID 才会去查生成工具（避免对每个静态工具页面读 JSON 索引）
  if (!id.startsWith("gen-")) return null;
  const generated = await loadGeneratedTools();
  const genTool = generated.find((t) => t.id === id);
  if (genTool) return { tool: genTool, isGenerated: true };
  return null;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const result = await findTool(id);
  if (!result) return {};
  const title = `${result.tool.name} — 教立方 EduCube`;
  return {
    title,
    description: result.tool.description,
    openGraph: {
      title,
      description: result.tool.description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description: result.tool.description,
    },
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const result = await findTool(id);
  if (!result) notFound();

  const { tool, isGenerated } = result;
  if (isGenerated) {
    try {
      await ensureGeneratedToolHtmlFile(tool);
    } catch (err) {
      console.error("[tools/[id]] 补全生成教具 HTML 失败:", err);
    }
  }
  const iframeSrc = isGenerated
    ? `/tools/gen/${id}.html`
    : `/tools/${id}.html`;

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
