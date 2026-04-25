import { generateToolHtml, generateRefinedSpec } from "@/lib/ai-client";
import {
  extractClientIp,
  GenerateConnectionGate,
  GenerateRateLimiter,
  getAllowedOriginHosts,
  isAllowedOrigin,
  isGenerateRequestAuthorized,
} from "@/lib/generate/request-guards";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { publishGeneratedTool } from "@/lib/generated-tools/publish-generated-tool";
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

const GENERATE_SECRET = process.env.GENERATE_SECRET || "";
const allowedOriginHosts = getAllowedOriginHosts({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://educube.cn",
  extraOrigins: process.env.ALLOWED_ORIGINS,
});
const rateLimiter = new GenerateRateLimiter();
const connectionGate = new GenerateConnectionGate(10);

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
 * GET /api/generate — 查询剩余次数（免认证）
 * ================================================================ */
export async function GET(request: Request): Promise<Response> {
  const ip = extractClientIp(request);
  const { remaining, resetAt } = rateLimiter.getRemaining(ip);
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

  if (!isGenerateRequestAuthorized(request, GENERATE_SECRET)) {
    return new Response(
      JSON.stringify({ error: "认证失败" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!connectionGate.tryAcquire()) {
    logger.warn("并发连接数已达上限", {
      ip,
      active: connectionGate.getActiveCount(),
    });
    return new Response(
      JSON.stringify({ error: "服务器繁忙，请稍后重试" }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin, allowedOriginHosts)) {
    connectionGate.release();
    return new Response(
      JSON.stringify({ error: "不允许的请求来源" }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!rateLimiter.check(ip)) {
    connectionGate.release();
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
      connectionGate.release();
      return new Response(
        JSON.stringify({ error: "请求体过大" }),
        { status: 413, headers: { "Content-Type": "application/json" } },
      );
    }
    body = JSON.parse(rawBody);
  } catch {
    connectionGate.release();
    return new Response(
      JSON.stringify({ error: "请求格式错误" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const validationError = validateInput(body);
  if (validationError) {
    connectionGate.release();
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
        connectionGate.release();
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
        const tool = await publishGeneratedTool({
          id,
          html,
          meta: {
            name,
            grade: gradeId,
            subject: subjectId,
            chapter: DEFAULT_CHAPTER,
            description: spec,
            gradient: DEFAULT_GRADIENT,
            icon: DEFAULT_ICON,
          },
        });

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
