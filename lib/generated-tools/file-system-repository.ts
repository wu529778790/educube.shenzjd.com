import type { Tool } from "@/data/tools";
import { buildGeneratedToolFallbackHtml } from "@/data/gen-tool-fallback-html";
import { logger } from "@/lib/logger";
import type {
  GeneratedToolsRepository,
  SaveGeneratedToolMeta,
} from "@/lib/generated-tools/repository";
import {
  access,
  constants,
  mkdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "fs/promises";
import { join } from "path";

interface GeneratedToolRecord {
  tool: Tool;
  createdAt: string;
  /** @deprecated 历史遗留字段，压缩时会移除 */
  publisherId?: string;
}

const INDEX_PATH = join(process.cwd(), "data", "generated-tools.json");
const HTML_DIR = join(process.cwd(), "public", "tools", "gen");
const CACHE_TTL = 30_000;
const MAX_RECORDS = 500;

const GENERATED_ASSET_PATHS: ReadonlyArray<[RegExp, string]> = [
  [/\.\.\/\.\.\/edu-lib\//g, "/edu-lib/"],
  [/\.\.\/edu-lib\//g, "/edu-lib/"],
];

const STOP_WORDS = new Set([
  "的", "了", "是", "在", "有", "和", "就", "不", "也", "这",
  "为", "与", "或", "等", "被", "把", "让", "从", "到", "对",
  "及", "其", "之", "用", "个", "中", "上", "下", "大", "小",
  "可以", "能够", "一个", "通过", "进行", "帮助", "用于",
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "and", "or", "of", "in", "to", "for", "with", "on", "at",
]);

const KNOWN_TOOL_KEYS = new Set([
  "id", "name", "subtitle", "chapter", "semester", "unitNum",
  "gradeId", "subjectId", "description", "tags", "gradient", "icon",
]);

function validateToolRecord(
  record: unknown,
  index: number,
): { valid: true; tool: Tool } | { valid: false; reason: string } {
  if (record === null || typeof record !== "object" || Array.isArray(record)) {
    return { valid: false, reason: `record #${index} is not a plain object` };
  }

  const rec = record as Record<string, unknown>;
  const t = rec.tool;

  if (t === null || t === undefined || typeof t !== "object" || Array.isArray(t)) {
    return { valid: false, reason: `record #${index} has missing or invalid .tool` };
  }

  const tool = t as Record<string, unknown>;
  const stringFields = [
    "id",
    "name",
    "subtitle",
    "chapter",
    "description",
    "gradeId",
    "subjectId",
    "icon",
  ] as const;

  for (const field of stringFields) {
    const val = tool[field];
    if (typeof val !== "string" || val.length === 0) {
      return {
        valid: false,
        reason: `record #${index} .tool.${field} is missing or not a non-empty string`,
      };
    }
  }

  if (tool.semester !== "上册" && tool.semester !== "下册") {
    return {
      valid: false,
      reason: `record #${index} .tool.semester must be "上册" or "下册", got "${String(tool.semester)}"`,
    };
  }

  if (typeof tool.unitNum !== "number" || !Number.isFinite(tool.unitNum)) {
    return {
      valid: false,
      reason: `record #${index} .tool.unitNum is not a finite number`,
    };
  }

  if (!Array.isArray(tool.tags) || !tool.tags.every((v) => typeof v === "string")) {
    return {
      valid: false,
      reason: `record #${index} .tool.tags is not a string array`,
    };
  }

  if (
    !Array.isArray(tool.gradient) ||
    tool.gradient.length !== 2 ||
    typeof tool.gradient[0] !== "string" ||
    typeof tool.gradient[1] !== "string"
  ) {
    return {
      valid: false,
      reason: `record #${index} .tool.gradient is not a [string, string] tuple`,
    };
  }

  return {
    valid: true,
    tool: {
      id: tool.id as string,
      name: tool.name as string,
      subtitle: tool.subtitle as string,
      chapter: tool.chapter as string,
      semester: tool.semester as "上册" | "下册",
      unitNum: tool.unitNum as number,
      gradeId: tool.gradeId as string,
      subjectId: tool.subjectId as string,
      description: tool.description as string,
      tags: tool.tags as string[],
      gradient: tool.gradient as [string, string],
      icon: tool.icon as string,
    } satisfies Tool,
  };
}

function extractTags(text: string): string[] {
  const tokens = text
    .split(/[\s,，。、；;：:！!？?·\-—\[\]【】（()）\n\r\t]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 12);

  const seen = new Set<string>();
  const result: string[] = [];
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (!STOP_WORDS.has(lower) && !STOP_WORDS.has(token) && !seen.has(lower)) {
      seen.add(lower);
      result.push(token);
      if (result.length >= 5) break;
    }
  }
  return result;
}

function cleanName(name: string): string {
  if (name.length <= 30) return name;
  return name.slice(0, 27) + "...";
}

function guessSemester(text: string): "上册" | "下册" {
  if (text.includes("下册")) return "下册";
  if (text.includes("上册")) return "上册";
  return "上册";
}

function stripToolToSchema(tool: Tool): Tool {
  return {
    id: tool.id,
    name: tool.name,
    subtitle: tool.subtitle,
    chapter: tool.chapter,
    semester: tool.semester,
    unitNum: tool.unitNum,
    gradeId: tool.gradeId,
    subjectId: tool.subjectId,
    description: tool.description,
    tags: tool.tags,
    gradient: tool.gradient,
    icon: tool.icon,
  } satisfies Tool;
}

function normalizeGeneratedHtmlAssetPaths(html: string): string {
  let normalized = html;
  for (const [pattern, replacement] of GENERATED_ASSET_PATHS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}

export class FileSystemGeneratedToolsRepository
  implements GeneratedToolsRepository {
  private cachedTools: Tool[] | null = null;

  private cacheTime = 0;

  private writeLock: Promise<void> = Promise.resolve();

  private pendingLoad: Promise<Tool[]> | null = null;

  async listTools(): Promise<Tool[]> {
    const now = Date.now();
    if (this.cachedTools && now - this.cacheTime < CACHE_TTL) {
      return this.cachedTools;
    }

    if (this.pendingLoad) return this.pendingLoad;

    this.pendingLoad = (async () => {
      try {
        const raw = await readFile(INDEX_PATH, "utf-8");
        const parsed: unknown[] = JSON.parse(raw);

        if (!Array.isArray(parsed)) {
          logger.warn("generated-tools 索引文件内容不是数组，已忽略");
          this.cachedTools = [];
          this.cacheTime = Date.now();
          return [];
        }

        const { records, hadExtraFields } = this.collectValidRecords(parsed);
        this.cachedTools = records.map((record) => record.tool);
        this.cacheTime = Date.now();

        if (hadExtraFields) {
          this.compactIndexFile(records).catch((err) => {
            logger.warn("generated-tools 索引压缩失败", {
              message: err instanceof Error ? err.message : "未知错误",
            });
          });
        }

        return this.cachedTools;
      } catch (err) {
        const code = (err as NodeJS.ErrnoException).code;
        if (code !== "ENOENT") {
          logger.error("generated-tools 读取索引文件失败", {
            code,
            message: err instanceof Error ? err.message : "未知错误",
          });
        }
        this.cachedTools = [];
        this.cacheTime = Date.now();
        return [];
      } finally {
        this.pendingLoad = null;
      }
    })();

    return this.pendingLoad;
  }

  invalidateCache(): void {
    this.cachedTools = null;
    this.cacheTime = 0;
  }

  async saveTool(
    id: string,
    html: string,
    meta: SaveGeneratedToolMeta,
  ): Promise<Tool> {
    const prevLock = this.writeLock;
    let releaseLock: () => void = () => {};
    this.writeLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    await prevLock;

    const htmlTmpPath = join(HTML_DIR, `${id}.html.tmp`);
    const htmlFinalPath = join(HTML_DIR, `${id}.html`);
    const indexTmpPath = `${INDEX_PATH}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;

    try {
      await mkdir(HTML_DIR, { recursive: true });
      const tool = this.buildTool(id, meta);

      const htmlTrim = html.trim();
      const finalHtml =
        htmlTrim.length >= 120
          ? normalizeGeneratedHtmlAssetPaths(html)
          : buildGeneratedToolFallbackHtml(tool);

      await writeFile(htmlTmpPath, finalHtml, "utf-8");

      const records = await this.readCurrentRecords();
      records.push({ tool, createdAt: new Date().toISOString() });

      let evictedIds: string[] = [];
      let finalRecords = records;
      if (records.length > MAX_RECORDS) {
        const evicted = records.slice(0, records.length - MAX_RECORDS);
        evictedIds = evicted.map((record) => record.tool.id).filter(Boolean);
        finalRecords = records.slice(records.length - MAX_RECORDS);
      }

      await writeFile(
        indexTmpPath,
        JSON.stringify(finalRecords, null, 2),
        "utf-8",
      );

      await rename(indexTmpPath, INDEX_PATH);
      await rename(htmlTmpPath, htmlFinalPath);

      for (const evictedId of evictedIds) {
        unlink(join(HTML_DIR, `${evictedId}.html`)).catch(() => {});
      }

      this.invalidateCache();
      return tool;
    } catch (err) {
      await Promise.allSettled([
        unlink(htmlTmpPath).catch(() => {}),
        unlink(indexTmpPath).catch(() => {}),
      ]);
      throw err;
    } finally {
      releaseLock();
    }
  }

  async getToolById(id: string): Promise<Tool | undefined> {
    const tools = await this.listTools();
    return tools.find((tool) => tool.id === id);
  }

  async readToolHtml(tool: Tool): Promise<string> {
    const htmlFinalPath = join(HTML_DIR, `${tool.id}.html`);
    try {
      await access(htmlFinalPath, constants.F_OK);
      const html = await readFile(htmlFinalPath, "utf-8");
      return normalizeGeneratedHtmlAssetPaths(html);
    } catch {
      return buildGeneratedToolFallbackHtml(tool);
    }
  }

  private buildTool(id: string, meta: SaveGeneratedToolMeta): Tool {
    const semester = guessSemester(
      `${meta.name} ${meta.description} ${meta.chapter}`,
    );
    const descTags = extractTags(`${meta.description} ${meta.chapter}`);
    const tagSet = new Set<string>([meta.subject, ...descTags]);
    const tags = Array.from(tagSet).slice(0, 5);
    const cleanedName = cleanName(meta.name);

    return {
      id,
      name: cleanedName,
      subtitle: cleanedName,
      chapter: meta.chapter,
      semester,
      unitNum: 99,
      gradeId: meta.grade,
      subjectId: meta.subject,
      description: meta.description,
      tags,
      gradient: meta.gradient,
      icon: meta.icon,
    } satisfies Tool;
  }

  private async compactIndexFile(
    records: GeneratedToolRecord[],
  ): Promise<boolean> {
    const compacted: GeneratedToolRecord[] = records.map((record) => ({
      tool: stripToolToSchema(record.tool),
      createdAt: record.createdAt,
    }));

    const tmpPath = INDEX_PATH + ".compact.tmp";
    try {
      await writeFile(tmpPath, JSON.stringify(compacted, null, 2), "utf-8");
      await rename(tmpPath, INDEX_PATH);
      logger.info("generated-tools 索引文件已压缩，移除遗留字段");
      return true;
    } catch (err) {
      logger.error("generated-tools 压缩索引文件失败", {
        message: err instanceof Error ? err.message : "未知错误",
      });
      try {
        await unlink(tmpPath).catch(() => {});
      } catch {
        /* ignore */
      }
      return false;
    }
  }

  private collectValidRecords(parsed: unknown[]): {
    records: GeneratedToolRecord[];
    hadExtraFields: boolean;
  } {
    const records: GeneratedToolRecord[] = [];
    let hadExtraFields = false;

    for (let i = 0; i < parsed.length; i++) {
      const result = validateToolRecord(parsed[i], i);
      if (!result.valid) {
        logger.warn("generated-tools 跳过无效记录", {
          reason: result.reason,
        });
        continue;
      }

      const record = parsed[i] as GeneratedToolRecord;
      const toolKeys = Object.keys(record.tool as object);
      if (toolKeys.some((key) => !KNOWN_TOOL_KEYS.has(key))) {
        hadExtraFields = true;
      }
      const recordKeys = Object.keys(record);
      if (recordKeys.some((key) => key !== "tool" && key !== "createdAt")) {
        hadExtraFields = true;
      }

      records.push({
        tool: stripToolToSchema(result.tool),
        createdAt: record.createdAt ?? new Date().toISOString(),
      });
    }

    return { records, hadExtraFields };
  }

  private async readCurrentRecords(): Promise<GeneratedToolRecord[]> {
    try {
      const raw = await readFile(INDEX_PATH, "utf-8");
      const parsed: unknown[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return this.collectValidRecords(parsed).records;
    } catch {
      return [];
    }
  }
}

export const fileSystemGeneratedToolsRepository =
  new FileSystemGeneratedToolsRepository();
