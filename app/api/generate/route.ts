import {
  extractClientIp,
  GenerateConnectionGate,
  GenerateRateLimiter,
  getAllowedOriginHosts,
  isAllowedOrigin,
  isGenerateRequestAuthorized,
} from "@/lib/generate/request-guards";
import {
  readGenerateRequestBody,
  validateGenerateRequestBody,
} from "@/lib/generate/route-request";
import { createGenerateStreamResponse } from "@/lib/generate/route-stream";
import { logger } from "@/lib/logger";
import { grades, subjects } from "@/data/curriculum";

const GENERATE_SECRET = process.env.GENERATE_SECRET || "";
const allowedOriginHosts = getAllowedOriginHosts({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://educube.cn",
  extraOrigins: process.env.ALLOWED_ORIGINS,
});
const rateLimiter = new GenerateRateLimiter();
const connectionGate = new GenerateConnectionGate(10);

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

export async function POST(request: Request): Promise<Response> {
  const startTime = Date.now();
  const ip = extractClientIp(request);

  if (!isGenerateRequestAuthorized(request, GENERATE_SECRET)) {
    return Response.json({ error: "认证失败" }, { status: 401 });
  }

  if (!connectionGate.tryAcquire()) {
    logger.warn("并发连接数已达上限", {
      ip,
      active: connectionGate.getActiveCount(),
    });
    return Response.json({ error: "服务器繁忙，请稍后重试" }, { status: 503 });
  }

  const origin = request.headers.get("origin");
  if (!isAllowedOrigin(origin, allowedOriginHosts)) {
    connectionGate.release();
    return Response.json({ error: "不允许的请求来源" }, { status: 403 });
  }

  if (!rateLimiter.check(ip)) {
    connectionGate.release();
    logger.warn("生成请求被限流拒绝", { ip });
    return Response.json(
      { error: "生成次数已达上限，请一小时后再试" },
      { status: 429 },
    );
  }

  const body = await readGenerateRequestBody(request);
  if (body instanceof Response) {
    connectionGate.release();
    return body;
  }

  const validationError = validateGenerateRequestBody(body);
  if (validationError) {
    connectionGate.release();
    return validationError;
  }

  const gradeId = body.grade || "p5";
  const subjectId = body.subject || "math";
  const userIntent = body.description!.trim();
  logger.info("开始生成", { ip, grade: gradeId, subject: subjectId });

  const gradeLabel = grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectLabel =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  return createGenerateStreamResponse({
    startTime,
    gradeId,
    subjectId,
    userIntent,
    gradeLabel,
    subjectLabel,
    releaseConnection: () => connectionGate.release(),
  });
}
