import type { Metadata } from "next";
import { getToolById } from "@/data/tools";
import type { Tool } from "@/data/tools";
import { loadGeneratedTools } from "@/data/generated-tools";

export interface ResolvedToolPageEntry {
  tool: Tool;
  isGenerated: boolean;
}

export async function findToolPageEntry(
  id: string,
): Promise<ResolvedToolPageEntry | null> {
  const staticTool = getToolById(id);
  if (staticTool) {
    return {
      tool: staticTool,
      isGenerated: false,
    };
  }

  if (!id.startsWith("gen-")) {
    return null;
  }

  const generatedTools = await loadGeneratedTools();
  const generatedTool = generatedTools.find((tool) => tool.id === id);

  if (!generatedTool) {
    return null;
  }

  return {
    tool: generatedTool,
    isGenerated: true,
  };
}

export function getToolIframeSrc(id: string, isGenerated: boolean): string {
  return isGenerated ? `/api/generated-tools/${id}/html` : `/tools/${id}.html`;
}

export function createToolMetadata(tool: Tool): Metadata {
  const title = `${tool.name} — 教立方 EduCube`;

  return {
    title,
    description: tool.description,
    openGraph: {
      title,
      description: tool.description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description: tool.description,
    },
  };
}
