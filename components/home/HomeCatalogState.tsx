import EmptyState from "@/components/EmptyState";
import ToolGrid from "@/components/ToolGrid";
import { getHomePageDisplayState } from "@/components/home/page-state";
import type { Tool } from "@/data/tools";

interface HomeCatalogStateProps {
  catalogTools: Tool[];
  displayTools: Tool[];
  searchQuery: string;
}

export default function HomeCatalogState({
  catalogTools,
  displayTools,
  searchQuery,
}: HomeCatalogStateProps) {
  const state = getHomePageDisplayState({
    searchQuery,
    catalogCount: catalogTools.length,
    displayCount: displayTools.length,
  });

  if (state.kind === "ready") {
    return <ToolGrid tools={displayTools} />;
  }

  if (state.kind === "search-empty") {
    return (
      <EmptyState>
        <p className="mb-1 font-medium" style={{ color: "var(--edu-text)" }}>
          没有找到匹配「{state.query}」的教具
        </p>
        <p className="text-sm" style={{ color: "var(--edu-text-muted)" }}>
          试试换个关键词，或清空搜索浏览全部教具。
        </p>
      </EmptyState>
    );
  }

  if (state.kind === "catalog-empty") {
    return (
      <EmptyState>
        <p className="mb-2 text-lg font-medium" style={{ color: "var(--edu-text)" }}>
          该目录下暂无教具
        </p>
        <p
          className="mx-auto max-w-md text-sm leading-relaxed"
          style={{ color: "var(--edu-text-muted)" }}
        >
          该分类的交互内容正在制作与审核中。您可以切换筛选条件查看已上线的教具。
        </p>
      </EmptyState>
    );
  }

  return (
    <EmptyState>
      <p className="mb-1 font-medium" style={{ color: "var(--edu-text)" }}>
        当前年级下暂无教具
      </p>
      <p className="text-sm" style={{ color: "var(--edu-text-muted)" }}>
        请切换到其他年级查看。
      </p>
    </EmptyState>
  );
}
