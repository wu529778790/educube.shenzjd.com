import type { Tool } from "@/data/tools";
import ToolCard from "./ToolCard";

interface ToolGridProps {
  tools: Tool[];
}

export default function ToolGrid({ tools }: ToolGridProps) {
  return (
    <div role="list" aria-label="教具列表">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool, i) => (
          <ToolCard key={tool.id} tool={tool} index={i} />
        ))}
      </div>
    </div>
  );
}
