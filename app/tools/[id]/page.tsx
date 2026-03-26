import { getToolById, tools } from "@/data/tools";
import { notFound } from "next/navigation";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return tools.map((tool) => ({ id: tool.id }));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) return {};
  return {
    title: `${tool.name} — 教立方 EduCube`,
    description: tool.description,
  };
}

export default async function ToolPage({ params }: PageProps) {
  const { id } = await params;
  const tool = getToolById(id);
  if (!tool) notFound();

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* 顶部工具条 */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 h-12 bg-slate-800 border-b border-slate-700 gap-3">
        {/* 返回 */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm flex-shrink-0"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          <span className="hidden sm:inline">返回</span>
        </Link>

        {/* 中间：工具名 */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{tool.icon}</span>
          <span className="text-sm font-semibold text-white truncate">
            {tool.name}
          </span>
          <span className="hidden sm:inline text-xs text-slate-400 flex-shrink-0">
            · {tool.chapter}
          </span>
        </div>

        {/* 右侧：标签 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden md:inline-flex items-center gap-1 text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            按 F11 全屏
          </span>
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: tool.gradient[0] }}
          />
        </div>
      </header>

      {/* 教具 iframe */}
      <div className="flex-1 overflow-hidden">
        <iframe
          src={`/tools/${id}.html`}
          className="w-full h-full border-0"
          title={tool.name}
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
}
