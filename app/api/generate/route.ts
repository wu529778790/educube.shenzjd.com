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
 * 共享密钥认证：防止未授权调用消耗 AI API 额度
 *
 * 设置环境变量 GENERATE_SECRET 后，POST /api/generate 要求请求头
 * X-Generate-Secret 携带相同密钥。GET 端点（查询余量）免认证。
 * 未设置 GENERATE_SECRET 时跳过认证（开发模式）。
 * ================================================================ */
const GENERATE_SECRET = process.env.GENERATE_SECRET || "";

function checkAuth(request: Request): Response | null {
  if (!GENERATE_SECRET) return null; // 未配置密钥则跳过
  const header = request.headers.get("x-generate-secret") ?? "";
  if (header === GENERATE_SECRET) return null;
  return new Response(
    JSON.stringify({ error: "认证失败" }),
    { status: 401, headers: { "Content-Type": "application/json" } },
  );
}

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
 * 优先使用 CDN 提供商的真实 IP 头（如 CF-Connecting-IP），
 * 再回退到 x-forwarded-for / x-real-ip。
 */
function extractClientIp(request: Request): string {
  // 优先使用 CDN 提供商头（不可被客户端伪造）
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && IP_REGEX.test(cfIp)) return cfIp;

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
    // 批量清理所有过期条目
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    // 超过上限时批量驱逐最旧的 10%
    if (rateLimitMap.size >= MAX_ENTRIES) {
      const entries = [...rateLimitMap.entries()]
        .sort((a, b) => a[1].resetAt - b[1].resetAt);
      const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        rateLimitMap.delete(entries[i][0]);
      }
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
 * 并发连接限制：防止 Slowloris 式攻击耗尽服务器资源
 * ================================================================ */
let activeConnections = 0;
const MAX_CONCURRENT = 10;

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

/** 服务端配置的合法 Origin 白名单 */
function getAllowedOrigins(): Set<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://educube.cn";
  const origins = new Set([
    new URL(siteUrl).host,
    "localhost:3000",
    "127.0.0.1:3000",
  ]);
  // 额外配置
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }
  return origins;
}

/* ================================================================
 * GET /api/generate — 查询剩余次数（免认证）
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

  // 共享密钥认证
  const authErr = checkAuth(request);
  if (authErr) return authErr;

  // 并发连接限制
  if (activeConnections >= MAX_CONCURRENT) {
    logger.warn("并发连接数已达上限", { ip, active: activeConnections });
    return new Response(
      JSON.stringify({ error: "服务器繁忙，请稍后重试" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  // CSRF 防护：校验 Origin 头（使用服务端白名单而非客户端 Host 头）
  const origin = request.headers.get("origin");
  if (origin) {
    const allowedOrigins = getAllowedOrigins();
    try {
      const originHost = new URL(origin).host;
      if (!allowedOrigins.has(originHost)) {
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

  activeConnections++;
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
        activeConnections--;
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
        } catch {
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
        } catch {
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
