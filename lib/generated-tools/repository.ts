import type { Tool } from "@/data/tools";

export interface SaveGeneratedToolMeta {
  name: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  gradient: [string, string];
  icon: string;
}

export interface GeneratedToolsRepository {
  listTools(): Promise<Tool[]>;
  saveTool(id: string, html: string, meta: SaveGeneratedToolMeta): Promise<Tool>;
  getToolById(id: string): Promise<Tool | undefined>;
  readToolHtml(tool: Tool): Promise<string>;
  invalidateCache(): void;
}
