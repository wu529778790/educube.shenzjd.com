/**
 * 教立方 — 生成工具的 JSON 索引与文件 I/O
 */
import type { Tool } from "@/data/tools";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

interface GeneratedToolRecord {
  tool: Tool;
  createdAt: string;
}

const INDEX_PATH = join(process.cwd(), "data", "generated-tools.json");
const HTML_DIR = join(process.cwd(), "public", "tools", "gen");

/** 模块级缓存，避免频繁读盘 */
let cachedTools: Tool[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 秒

/** 简易写锁：防止并发写入 JSON 导致数据丢失 */
let writeLock: Promise<void> = Promise.resolve();

export async function loadGeneratedTools(): Promise<Tool[]> {
  const now = Date.now();
  if (cachedTools && now - cacheTime < CACHE_TTL) return cachedTools;

  try {
    const raw = await readFile(INDEX_PATH, "utf-8");
    const records: GeneratedToolRecord[] = JSON.parse(raw);
    cachedTools = records.map((r) => r.tool);
    cacheTime = now;
    return cachedTools;
  } catch {
    cachedTools = [];
    cacheTime = now;
    return [];
  }
}

/** 强制刷新缓存（保存后调用） */
export function invalidateCache(): void {
  cachedTools = null;
  cacheTime = 0;
}

export async function saveGeneratedTool(
  id: string,
  html: string,
  meta: {
    name: string;
    grade: string;
    subject: string;
    chapter: string;
    description: string;
    gradient: [string, string];
    icon: string;
  },
): Promise<Tool> {
  // 排队写入，防止并发竞争
  const prevLock = writeLock;
  let releaseLock: () => void;
  writeLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  await prevLock;

  try {
    await mkdir(HTML_DIR, { recursive: true });

    const semester: "上册" | "下册" =
      meta.chapter.includes("下册") ? "下册" : "上册";

    const tool: Tool = {
      id,
      name: meta.name,
      subtitle: meta.name,
      chapter: meta.chapter,
      semester,
      unitNum: 99,
      publisherId: "pep",
      gradeId: meta.grade,
      subjectId: meta.subject,
      description: meta.description,
      tags: [meta.subject],
      gradient: meta.gradient,
      icon: meta.icon,
    };

    // Save HTML file
    await writeFile(join(HTML_DIR, `${id}.html`), html, "utf-8");

    // Update index
    let records: GeneratedToolRecord[] = [];
    try {
      const raw = await readFile(INDEX_PATH, "utf-8");
      records = JSON.parse(raw);
    } catch {
      /* first time */
    }

    records.push({ tool, createdAt: new Date().toISOString() });
    await writeFile(
      INDEX_PATH,
      JSON.stringify(records, null, 2),
      "utf-8",
    );

    invalidateCache();
    return tool;
  } finally {
    releaseLock!();
  }
}

export async function getGeneratedToolById(
  id: string,
): Promise<Tool | undefined> {
  const tools = await loadGeneratedTools();
  return tools.find((t) => t.id === id);
}
