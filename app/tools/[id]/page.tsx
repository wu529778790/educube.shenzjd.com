import { getPathLabel } from "@/data/curriculum";
import { getToolById, tools } from "@/data/tools";
import { loadGeneratedTools } from "@/data/generated-tools";
import { notFound } from "next/navigation";
import Link from "next/link";
import BackArrow from "@/components/BackArrow";
import ShareButton from "@/components/ShareButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  const iframeSrc = isGenerated
    ? `/tools/gen/${id}.html`
    : `/tools/${id}.html`;

  return (
    <div className="flex flex-col h-screen" style={{ background: "var(--edu-primary)" }}>
      {/* 顶部工具条 — 深靛蓝 */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-4 h-12 border-b gap-3"
        style={{
          background: "var(--edu-primary)",
          borderColor: "rgba(255,255,255,0.1)",
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
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-white/60 px-2 py-1 rounded-md"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            按 F11 全屏
          </span>
          <a
            href={iframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-white/70 px-3 py-1.5 rounded-lg transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.08)" }}
            title="在新窗口中打开教具"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span className="hidden sm:inline">新窗口</span>
          </a>
        </div>
      </header>

      {/* 教具 iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={iframeSrc}
          className="w-full h-full border-0"
          title={tool.name}
          sandbox="allow-scripts"
        />
      </div>
    </div>
  );
}
