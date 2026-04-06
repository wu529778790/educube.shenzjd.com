import { generateToolHtml, generateRefinedSpec } from "@/lib/ai-client";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { saveGeneratedTool } from "@/data/generated-tools";
import { logger } from "@/lib/logger";
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

/**
 * 提取客户端真实 IP。
 * 策略：取 x-forwarded-for 最右侧（由最近的受信代理追加）的 IP，
 * 而非最左侧（可被客户端伪造）。如果配置了 TRUSTED_PROXY_COUNT，
 * 则从右侧跳过指定数量的代理层。
 */
function extractClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",").map((s) => s.trim()).filter(Boolean);
    const skipCount = parseInt(process.env.TRUSTED_PROXY_COUNT || "1", 10);
    const idx = Math.max(0, parts.length - skipCount);
    const ip = parts[idx];
    if (ip && IP_REGEX.test(ip)) return ip;
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
const MAX_HTML_SIZE = 1_024 * 1024; // 1MB 上限

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const ip = extractClientIp(request);

  // CSRF 防护：校验 Origin 头（浏览器自动携带，无法被 fetch 跨域伪造）
  const origin = request.headers.get("origin");
  if (origin) {
    const host = request.headers.get("host");
    if (host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return new Response(
            JSON.stringify({ error: "不允许的请求来源" }),
            { status: 403, headers: { "Content-Type": "application/json" } },
          );
        }
      } catch {
        return new Response(
          JSON.stringify({ error: "无效的请求来源" }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }
  }

  if (!checkRateLimit(ip)) {
    logger.warn("生成请求被限流拒绝", { ip });
    return new Response(
      JSON.stringify({ error: "生成次数已达上限，请一小时后再试" }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  /* ── 请求体解析与大小检查 ── */
  let body: Partial<GenerateRequest>;
  try {
    const rawBody = await request.text();
    if (rawBody.length > 10_000) {
      return new Response(
        JSON.stringify({ error: "请求体过大" }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }
    body = JSON.parse(rawBody);
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
  logger.info("开始生成", { ip, grade: gradeId, subject: subjectId });

  const gradeLabel = grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectLabel =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(sseMessage(event, data)));
      };

      // 心跳保活：每 15s 发送 SSE 注释，防止反向代理超时断连
      const heartbeat = setInterval(() => {
        try { controller.enqueue(encoder.encode(":\n\n")); } catch {}
      }, 15_000);

      // 统一清理函数：清除所有定时器，防止泄漏
      const cleanup = () => {
        clearInterval(heartbeat);
        clearTimeout(serverTimeout);
      };

      // 服务端超时：3 分钟后强制关闭
      const serverTimeout = setTimeout(() => {
        try { send("error", { error: "生成超时，请稍后重试" }); } catch {}
        cleanup();
        try { controller.close(); } catch {}
      }, 3 * 60 * 1000);

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
          send("error", { error: "整理需求失败，请稍后重试" });
          cleanup();
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
          // 生成的 HTML 大小限制
          if (raw.length > MAX_HTML_SIZE) {
            send("error", { error: "生成的教具过大，请简化需求后重试" });
            cleanup();
            controller.close();
            return;
          }
          html = sanitizeHtml(raw, { preserveInlineEventHandlers: true });
        } catch (err) {
          send("error", { error: "生成失败，请稍后重试" });
          cleanup();
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
        logger.info("生成成功", { id, name, durationMs: Date.now() - startTime });
        cleanup();
        controller.close();
      } catch (err) {
        logger.error("生成失败", { message: err instanceof Error ? err.message : "未知错误", durationMs: Date.now() - startTime });
        send("error", { error: "生成失败，请稍后重试" });
        cleanup();
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
