import type { Tool } from "@/data/tools";
import { getDefaultGeneratedToolsRepository } from "@/lib/generated-tools/provider";
import type { SaveGeneratedToolMeta } from "@/lib/generated-tools/repository";

const repository = getDefaultGeneratedToolsRepository();

export async function loadGeneratedTools(): Promise<Tool[]> {
  return repository.listTools();
}

export function invalidateCache(): void {
  repository.invalidateCache();
}

export async function saveGeneratedTool(
  id: string,
  html: string,
  meta: SaveGeneratedToolMeta,
): Promise<Tool> {
  return repository.saveTool(id, html, meta);
}

export async function getGeneratedToolById(
  id: string,
): Promise<Tool | undefined> {
  return repository.getToolById(id);
}

export async function readGeneratedToolHtml(
  tool: Tool,
): Promise<string> {
  return repository.readToolHtml(tool);
}
