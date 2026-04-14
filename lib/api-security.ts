/**
 * 教立方 — API 安全防护共享模块
 *
 * 提供 IP 限流、CSRF Origin 校验、并发连接限制。
 * /api/generate 和 /api/agent 共用。
 */

/* ================================================================
 * IP 限流
 * ================================================================ */
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
const MAX_ENTRIES = 10_000;
let lastCleanup = Date.now();

const IP_REGEX =
  /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|unknown)$/;

export function extractClientIp(request: Request): string {
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

export function checkRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  const needsCleanup =
    now - lastCleanup > CLEANUP_INTERVAL ||
    rateLimitMap.size >= MAX_ENTRIES;

  if (needsCleanup) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
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

  const key = `${ip}:${limit}:${windowMs}`;
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

/* ================================================================
 * CSRF Origin 校验
 * ================================================================ */

export function getAllowedOrigins(): Set<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://educube.cn";
  const origins = new Set([
    new URL(siteUrl).host,
    "localhost:3000",
    "127.0.0.1:3000",
  ]);
  const extra = process.env.ALLOWED_ORIGINS;
  if (extra) {
    for (const o of extra.split(",")) {
      const trimmed = o.trim();
      if (trimmed) origins.add(trimmed);
    }
  }
  return origins;
}

export function checkCsrfOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
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
  return null;
}

/* ================================================================
 * 并发连接限制
 * ================================================================ */

let activeConnections = 0;

export function getConnectionCount(): number {
  return activeConnections;
}

export function acquireConnection(maxConcurrent: number): boolean {
  if (activeConnections >= maxConcurrent) return false;
  activeConnections++;
  return true;
}

export function releaseConnection(): void {
  if (activeConnections > 0) activeConnections--;
}
