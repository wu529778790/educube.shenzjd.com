import { generateToolHtml, generateRefinedSpec } from "@/lib/ai-client";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { saveGeneratedTool } from "@/data/generated-tools";
import {
  REFINE_SYSTEM,
  buildRefineUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  parseRefinedSpecOutput,
} from "@/data/prompt-template";
import { grades, subjects } from "@/data/curriculum";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

/* ================================================================
 * IP 限流：5 次/小时，自动清理过期条目，防止内存泄漏
 * ================================================================ */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 小时
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 分钟清理一次
const MAX_ENTRIES = 10_000; // Map 大小上限，防止 OOM
let lastCleanup = Date.now();

/** 校验字符串是否为合法 IPv4 或 IPv6 格式 */
const IP_REGEX =
  /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|unknown)$/;

function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim() ?? "";
    if (IP_REGEX.test(first)) return first;
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && IP_REGEX.test(realIp)) return realIp;
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  const needsCleanup =
    now - lastCleanup > CLEANUP_INTERVAL ||
    rateLimitMap.size >= MAX_ENTRIES;

  if (needsCleanup) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    if (rateLimitMap.size >= MAX_ENTRIES) {
      let oldestKey = "";
      let oldestReset = Infinity;
      for (const [key, val] of rateLimitMap) {
        if (val.resetAt < oldestReset) {
          oldestReset = val.resetAt;
          oldestKey = key;
        }
      }
      if (oldestKey) rateLimitMap.delete(oldestKey);
    }
    lastCleanup = now;
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

function getRemainingCount(ip: string): { remaining: number; resetAt: number } {
  const entry = rateLimitMap.get(ip);
  if (!entry || Date.now() > entry.resetAt) {
    return { remaining: RATE_LIMIT, resetAt: Date.now() + RATE_WINDOW };
  }
  return { remaining: RATE_LIMIT - entry.count, resetAt: entry.resetAt };
}

/* ================================================================
 * 输入校验
 * ================================================================ */
const VALID_GRADES = new Set(grades.map((g) => g.id));
const VALID_SUBJECTS = new Set(subjects.map((s) => s.id));

interface GenerateRequest {
  grade: string;
  subject: string;
  description: string;
}

const DEFAULT_GRADIENT: [string, string] = ["#3B82F6", "#2563EB"];
const DEFAULT_ICON = "📐";
const DEFAULT_CHAPTER = "综合实践";

function validateInput(body: Partial<GenerateRequest>): string | null {
  if (!body.description?.trim()) return "请填写需求描述";
  if (body.description.trim().length < 8)
    return "需求描述请至少写 8 个字，便于生成可用教具";
  if (body.description.length > 800) return "需求描述过长（最多 800 字）";
  if (body.grade && !VALID_GRADES.has(body.grade))
    return "无效的年级";
  if (body.subject && !VALID_SUBJECTS.has(body.subject))
    return "无效的学科";
  return null;
}

/* ================================================================
 * SSE 辅助
 * ================================================================ */
function sseMessage(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/* ================================================================
 * GET /api/generate — 查询剩余次数
 * ================================================================ */
export async function GET(request: Request): Promise<Response> {
  const ip = extractClientIp(request);
  const { remaining, resetAt } = getRemainingCount(ip);
  return new Response(JSON.stringify({ remaining, resetAt }), {
    headers: { "Content-Type": "application/json" },
  });
}

/* ================================================================
 * POST /api/generate — SSE 流式生成
 * ================================================================ */
export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const ip = extractClientIp(request);
  if (!checkRateLimit(ip)) {
    console.warn(`[generate] IP ${ip} 限流拒绝`);
    return new Response(
      JSON.stringify({ error: "生成次数已达上限，请一小时后再试" }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "请求格式错误" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const validationError = validateInput(body);
  if (validationError) {
    return new Response(
      JSON.stringify({ error: validationError }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const gradeId = body.grade || "p5";
  const subjectId = body.subject || "math";
  const userIntent = body.description!.trim();
  console.log(`[generate] IP ${ip} 开始生成: grade=${gradeId} subject=${subjectId} desc="${userIntent.slice(0, 50)}..."`);

  const gradeLabel = grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectLabel =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      };

      try {
        // ── 阶段 1：整理需求 ──
        send("stage", { stage: "refining", message: "正在分析需求并整理规格说明…" });

        let refinedRaw: string;
        try {
          refinedRaw = await generateRefinedSpec(
            REFINE_SYSTEM,
            buildRefineUserPrompt({ gradeLabel, subjectLabel, userIntent }),
          );
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "AI 服务暂时不可用";
          send("error", { error: `整理需求失败：${message}` });
          controller.close();
          return;
        }

        const { name, spec } = parseRefinedSpecOutput(refinedRaw, userIntent);
        send("refined", { refinedName: name, refinedSpec: spec });

        // ── 阶段 2：生成 HTML ──
        send("stage", { stage: "generating", message: "正在生成交互式教具页面…" });

        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt({
          name,
          gradeLabel,
          subjectLabel,
          chapter: DEFAULT_CHAPTER,
          description: spec,
        });

        let html: string;
        try {
          const raw = await generateToolHtml(systemPrompt, userPrompt);
          html = sanitizeHtml(raw, { preserveInlineEventHandlers: true });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "AI 服务暂时不可用";
          send("error", { error: message });
          controller.close();
          return;
        }

        // ── 阶段 3：保存 ──
        send("stage", { stage: "saving", message: "正在保存教具…" });

        const id = `gen-${randomUUID()}`;
        const tool = await saveGeneratedTool(id, html, {
          name,
          grade: gradeId,
          subject: subjectId,
          chapter: DEFAULT_CHAPTER,
          description: spec,
          gradient: DEFAULT_GRADIENT,
          icon: DEFAULT_ICON,
        });

        // 主动刷新首页缓存，使新生成的工具立即可见
        revalidatePath("/");

        send("done", { tool, html, refinedName: name, refinedSpec: spec });
        console.log(`[generate] 成功: id=${id} name="${name}" 耗时 ${Date.now() - startTime}ms`);
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "未知错误";
        console.error(`[generate] 失败: ${message} 耗时 ${Date.now() - startTime}ms`);
        send("error", { error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
