import { tools } from "@/data/tools";
import { notFound } from "next/navigation";
import ToolIframe from "@/components/ToolIframe";
import ToolPageHeader from "@/components/tool-page/ToolPageHeader";
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
      <ToolPageHeader tool={tool} />
      <ToolIframe key={iframeSrc} src={iframeSrc} title={tool.name} />
    </div>
  );
}
