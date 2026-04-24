/**
 * 教立方 — 生成工具的 JSON 索引与文件 I/O
 *
 * 写入策略：先写临时文件再 rename，确保原子性。
 * 读取策略：模块级缓存 + 去重并发读取。
 * 安全策略：逐条校验、最大记录数裁剪、索引自动压缩。
 */
import type { Tool } from "@/data/tools";
import { buildGeneratedToolFallbackHtml } from "@/data/gen-tool-fallback-html";
import {
  access,
  constants,
  readFile,
  writeFile,
  mkdir,
  rename,
  unlink,
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

const GENERATED_ASSET_PATHS: ReadonlyArray<[RegExp, string]> = [
  [/\.\.\/\.\.\/edu-lib\//g, "/edu-lib/"],
  [/\.\.\/edu-lib\//g, "/edu-lib/"],
];

/** 模块级缓存，避免频繁读盘 */
let cachedTools: Tool[] | null = null;
let cacheTime = 0;
const CACHE_TTL = 30_000; // 30 秒

/** 简易写锁：防止并发写入 JSON 导致数据丢失 */
let writeLock: Promise<void> = Promise.resolve();

/** 去重并发读取：多个调用方同时 miss 缓存时，只读一次文件 */
let pendingLoad: Promise<Tool[]> | null = null;

/** 单条记录校验：确保解析后的记录包含所有必需 Tool 字段且类型正确 */
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

  // ---- string fields ----
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

  // ---- semester ----
  if (tool.semester !== "上册" && tool.semester !== "下册") {
    return {
      valid: false,
      reason: `record #${index} .tool.semester must be "上册" or "下册", got "${String(tool.semester)}"`,
    };
  }

  // ---- unitNum ----
  if (typeof tool.unitNum !== "number" || !Number.isFinite(tool.unitNum)) {
    return {
      valid: false,
      reason: `record #${index} .tool.unitNum is not a finite number`,
    };
  }

  // ---- tags ----
  if (!Array.isArray(tool.tags) || !tool.tags.every((v) => typeof v === "string")) {
    return {
      valid: false,
      reason: `record #${index} .tool.tags is not a string array`,
    };
  }

  // ---- gradient ----
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

/** 中文停用词表（轻量版） */
const STOP_WORDS = new Set([
  "的", "了", "是", "在", "有", "和", "就", "不", "也", "这",
  "为", "与", "或", "等", "被", "把", "让", "从", "到", "对",
  "及", "其", "之", "用", "个", "中", "上", "下", "大", "小",
  "可以", "能够", "一个", "通过", "进行", "帮助", "用于",
  "the", "a", "an", "is", "are", "was", "were", "be", "been",
  "and", "or", "of", "in", "to", "for", "with", "on", "at",
]);

/** 从文本中提取有意义的关键词作为 tags */
function extractTags(text: string): string[] {
  // 按常见分隔符拆分：标点、空格、顿号等
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

/** 清理工具名称：超长截断 */
function cleanName(name: string): string {
  if (name.length <= 30) return name;
  return name.slice(0, 27) + "...";
}

/** Tool 类型定义中已知字段的 key 集合，用于索引压缩和字段校验 */
const KNOWN_TOOL_KEYS = new Set([
  "id", "name", "subtitle", "chapter", "semester", "unitNum",
  "gradeId", "subjectId", "description", "tags", "gradient", "icon",
]);

/** 最大保存记录数，超出后 FIFO 裁剪 */
const MAX_RECORDS = 500;

/** 从多个字段中推断学期 */
function guessSemester(text: string): "上册" | "下册" {
  if (text.includes("下册")) return "下册";
  if (text.includes("上册")) return "上册";
  return "上册"; // 默认
}

/** 将 Tool 对象投影到已知字段，剥离多余字段（如 publisherId） */
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

/**
 * 压缩索引文件：去掉记录中所有历史遗留字段（如 publisherId），
 * 只保留 Tool 类型定义的字段。如果文件中有需要清理的记录则重写。
 */
async function compactIndexFile(
  records: GeneratedToolRecord[],
): Promise<boolean> {
  let needsRewrite = false;
  for (const rec of records) {
    // 检查是否存在 Tool schema 之外的 key
    const toolKeys = Object.keys(rec.tool as object);
    if (toolKeys.some((k) => !KNOWN_TOOL_KEYS.has(k))) {
      needsRewrite = true;
      break;
    }
    // 检查记录级别是否有遗留字段
    const recKeys = Object.keys(rec);
    if (recKeys.some((k) => k !== "tool" && k !== "createdAt")) {
      needsRewrite = true;
      break;
    }
  }

  if (!needsRewrite) return false;

  const compacted: GeneratedToolRecord[] = records.map((r) => ({
    tool: stripToolToSchema(r.tool),
    createdAt: r.createdAt,
  }));

  const tmpPath = INDEX_PATH + ".compact.tmp";
  try {
    await writeFile(tmpPath, JSON.stringify(compacted, null, 2), "utf-8");
    await rename(tmpPath, INDEX_PATH);
    console.log("[generated-tools] 索引文件已压缩，移除遗留字段");
    return true;
  } catch (err) {
    console.error("[generated-tools] 压缩索引文件失败:", err);
    try { await unlink(tmpPath).catch(() => {}); } catch { /* ignore */ }
    return false;
  }
}

export async function loadGeneratedTools(): Promise<Tool[]> {
  const now = Date.now();
  if (cachedTools && now - cacheTime < CACHE_TTL) return cachedTools;

  // 去重：如果已有进行中的读取，复用同一个 Promise
  if (pendingLoad) return pendingLoad;

  pendingLoad = (async () => {
    try {
      const raw = await readFile(INDEX_PATH, "utf-8");
      const parsed: unknown[] = JSON.parse(raw);

      if (!Array.isArray(parsed)) {
        console.warn("[generated-tools] 索引文件内容不是数组，已忽略");
        cachedTools = [];
        cacheTime = Date.now();
        return [];
      }

      // 逐条校验，跳过无效记录并记录警告
      const validRecords: GeneratedToolRecord[] = [];
      let hadExtraFields = false;

      for (let i = 0; i < parsed.length; i++) {
        const result = validateToolRecord(parsed[i], i);
        if (result.valid) {
          const rec = parsed[i] as GeneratedToolRecord;
          // 检查是否存在多余字段
          const toolKeys = Object.keys(rec.tool as object);
          if (toolKeys.some((k) => !KNOWN_TOOL_KEYS.has(k))) hadExtraFields = true;
          const recKeys = Object.keys(rec);
          if (recKeys.some((k) => k !== "tool" && k !== "createdAt")) hadExtraFields = true;

          validRecords.push({
            tool: stripToolToSchema(result.tool),
            createdAt: rec.createdAt ?? new Date().toISOString(),
          });
        } else {
          console.warn(`[generated-tools] 跳过无效记录: ${result.valid === false ? result.reason : "unknown"}`);
        }
      }

      cachedTools = validRecords.map((r) => r.tool);
      cacheTime = Date.now();

      // 如果存在遗留字段，异步压缩（不阻塞当前请求）
      if (hadExtraFields) {
        compactIndexFile(validRecords).catch((err) => {
          console.warn("[generated-tools] 索引压缩失败:", err);
        });
      }

      return cachedTools;
    } catch (err) {
      // 文件不存在是正常情况（首次运行）；其他错误需要记录
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        console.error("[generated-tools] 读取索引文件失败:", err);
      }
      cachedTools = [];
      cacheTime = Date.now();
      return [];
    } finally {
      pendingLoad = null;
    }
  })();

  return pendingLoad;
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
  let releaseLock: () => void = () => {};
  writeLock = new Promise<void>((resolve) => {
    releaseLock = resolve;
  });
  await prevLock;

  const htmlTmpPath = join(HTML_DIR, `${id}.html.tmp`);
  const htmlFinalPath = join(HTML_DIR, `${id}.html`);
  const indexTmpPath = `${INDEX_PATH}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`;

  try {
    await mkdir(HTML_DIR, { recursive: true });

    const semester = guessSemester(
      `${meta.name} ${meta.description} ${meta.chapter}`,
    );

    // 提取更好的 tags：从描述和章节中提取关键词，合并学科
    const descTags = extractTags(`${meta.description} ${meta.chapter}`);
    const tagSet = new Set<string>([meta.subject, ...descTags]);
    const tags = Array.from(tagSet).slice(0, 5);

    // 清理名称
    const cleanedName = cleanName(meta.name);

    const tool: Tool = {
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
    };

    /** 模型输出异常或过短时仍保证可打开的页面，避免只写入索引、磁盘无 HTML */
    const htmlTrim = html.trim();
    const finalHtml =
      htmlTrim.length >= 120
        ? normalizeGeneratedHtmlAssetPaths(html)
        : buildGeneratedToolFallbackHtml(tool);

    // 1. 写 HTML 到临时文件
    await writeFile(htmlTmpPath, finalHtml, "utf-8");

    // 2. 读取并更新索引，写到临时文件
    let records: GeneratedToolRecord[] = [];
    try {
      const raw = await readFile(INDEX_PATH, "utf-8");
      const parsed: unknown[] = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // 逐条校验已有记录
        for (let i = 0; i < parsed.length; i++) {
          const result = validateToolRecord(parsed[i], i);
          if (result.valid) {
            const rec = parsed[i] as GeneratedToolRecord;
            records.push({
              tool: stripToolToSchema(result.tool),
              createdAt: rec.createdAt ?? new Date().toISOString(),
            });
          }
        }
      }
    } catch {
      /* 首次创建 */
    }

    records.push({ tool, createdAt: new Date().toISOString() });

    // 3. FIFO 裁剪：超过 MAX_RECORDS 时移除最旧的记录，并删除对应 HTML 文件
    let evictedIds: string[] = [];
    if (records.length > MAX_RECORDS) {
      const evicted = records.slice(0, records.length - MAX_RECORDS);
      evictedIds = evicted.map((r) => r.tool.id).filter(Boolean);
      records = records.slice(records.length - MAX_RECORDS);
    }

    await writeFile(
      indexTmpPath,
      JSON.stringify(records, null, 2),
      "utf-8",
    );

    // 4. 原子 rename：先更新索引，再移动 HTML
    //    如果索引 rename 成功但 HTML rename 失败，索引会指向不存在的文件（404），
    //    但这比 HTML 存在但索引缺失要好——前者可重试生成，后者是幽灵文件。
    await rename(indexTmpPath, INDEX_PATH);
    await rename(htmlTmpPath, htmlFinalPath);

    // 5. 异步删除被驱逐的 HTML 文件（不阻塞当前请求）
    for (const eid of evictedIds) {
      unlink(join(HTML_DIR, `${eid}.html`)).catch(() => {});
    }

    invalidateCache();
    return tool;
  } catch (err) {
    // 清理残留临时文件
    await Promise.allSettled([
      unlink(htmlTmpPath).catch(() => {}),
      unlink(indexTmpPath).catch(() => {}),
    ]);
    throw err;
  } finally {
    releaseLock();
  }
}

export async function getGeneratedToolById(
  id: string,
): Promise<Tool | undefined> {
  const tools = await loadGeneratedTools();
  return tools.find((t) => t.id === id);
}

export async function readGeneratedToolHtml(
  tool: Tool,
): Promise<string> {
  const htmlFinalPath = join(HTML_DIR, `${tool.id}.html`);
  try {
    await access(htmlFinalPath, constants.F_OK);
    const html = await readFile(htmlFinalPath, "utf-8");
    return normalizeGeneratedHtmlAssetPaths(html);
  } catch {
    return buildGeneratedToolFallbackHtml(tool);
  }
}

export function normalizeGeneratedHtmlAssetPaths(html: string): string {
  let normalized = html;
  for (const [pattern, replacement] of GENERATED_ASSET_PATHS) {
    normalized = normalized.replace(pattern, replacement);
  }
  return normalized;
}
