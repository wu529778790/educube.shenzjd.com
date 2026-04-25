export interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitStatus {
  remaining: number;
  resetAt: number;
}

export interface GenerateRateLimiterOptions {
  rateLimit?: number;
  rateWindowMs?: number;
  cleanupIntervalMs?: number;
  maxEntries?: number;
  now?: () => number;
}

const DEFAULT_RATE_LIMIT = 5;
const DEFAULT_RATE_WINDOW_MS = 60 * 60 * 1000;
const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 10_000;

const IP_REGEX =
  /^(?:(?:\d{1,3}\.){3}\d{1,3}|(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}|unknown)$/;

export class GenerateRateLimiter {
  private readonly map = new Map<string, RateLimitEntry>();
  private readonly rateLimit: number;
  private readonly rateWindowMs: number;
  private readonly cleanupIntervalMs: number;
  private readonly maxEntries: number;
  private readonly now: () => number;
  private lastCleanup: number;

  public constructor(options: GenerateRateLimiterOptions = {}) {
    this.rateLimit = options.rateLimit ?? DEFAULT_RATE_LIMIT;
    this.rateWindowMs = options.rateWindowMs ?? DEFAULT_RATE_WINDOW_MS;
    this.cleanupIntervalMs =
      options.cleanupIntervalMs ?? DEFAULT_CLEANUP_INTERVAL_MS;
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;
    this.now = options.now ?? Date.now;
    this.lastCleanup = this.now();
  }

  public check(ip: string): boolean {
    const now = this.now();
    const needsCleanup =
      now - this.lastCleanup > this.cleanupIntervalMs ||
      this.map.size >= this.maxEntries;

    if (needsCleanup) {
      this.cleanup(now);
    }

    const entry = this.map.get(ip);
    if (!entry || now > entry.resetAt) {
      this.map.set(ip, {
        count: 1,
        resetAt: now + this.rateWindowMs,
      });
      return true;
    }

    if (entry.count >= this.rateLimit) {
      return false;
    }

    entry.count++;
    return true;
  }

  public getRemaining(ip: string): RateLimitStatus {
    const now = this.now();
    const entry = this.map.get(ip);
    if (!entry || now > entry.resetAt) {
      return {
        remaining: this.rateLimit,
        resetAt: now + this.rateWindowMs,
      };
    }

    return {
      remaining: this.rateLimit - entry.count,
      resetAt: entry.resetAt,
    };
  }

  private cleanup(now: number) {
    for (const [key, value] of this.map) {
      if (now > value.resetAt) {
        this.map.delete(key);
      }
    }

    if (this.map.size >= this.maxEntries) {
      const entries = [...this.map.entries()].sort(
        (left, right) => left[1].resetAt - right[1].resetAt,
      );
      const toRemove = Math.max(1, Math.floor(entries.length * 0.1));
      for (let index = 0; index < toRemove && index < entries.length; index++) {
        this.map.delete(entries[index][0]);
      }
    }

    this.lastCleanup = now;
  }
}

export class GenerateConnectionGate {
  private activeConnections = 0;
  private readonly maxConcurrent: number;

  public constructor(maxConcurrent: number) {
    this.maxConcurrent = maxConcurrent;
  }

  public tryAcquire(): boolean {
    if (this.activeConnections >= this.maxConcurrent) {
      return false;
    }

    this.activeConnections++;
    return true;
  }

  public release(): void {
    this.activeConnections = Math.max(0, this.activeConnections - 1);
  }

  public getActiveCount(): number {
    return this.activeConnections;
  }
}

export function isGenerateRequestAuthorized(
  request: Request,
  secret: string,
): boolean {
  if (!secret) {
    return true;
  }

  const header = request.headers.get("x-generate-secret") ?? "";
  return header === secret;
}

export function extractClientIp(
  request: Request,
  trustedProxyCount: number = parseInt(
    process.env.TRUSTED_PROXY_COUNT || "1",
    10,
  ),
): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp && IP_REGEX.test(cfIp)) {
    return cfIp;
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const index = Math.max(0, parts.length - trustedProxyCount);
    const ip = parts[index];
    if (ip && IP_REGEX.test(ip)) {
      return ip;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp && IP_REGEX.test(realIp)) {
    return realIp;
  }

  return "unknown";
}

export function getAllowedOriginHosts(options?: {
  siteUrl?: string;
  extraOrigins?: string;
}): Set<string> {
  const siteUrl = options?.siteUrl || "https://educube.cn";
  const hosts = new Set<string>([
    new URL(siteUrl).host,
    "localhost:3000",
    "127.0.0.1:3000",
  ]);

  const extraOrigins = options?.extraOrigins;
  if (extraOrigins) {
    for (const origin of extraOrigins.split(",")) {
      const trimmed = origin.trim();
      if (trimmed) {
        hosts.add(trimmed);
      }
    }
  }

  return hosts;
}

export function isAllowedOrigin(
  origin: string | null,
  allowedHosts: Set<string>,
): boolean {
  if (!origin) {
    return true;
  }

  try {
    return allowedHosts.has(new URL(origin).host);
  } catch {
    return false;
  }
}
