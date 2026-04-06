import { describe, it, expect } from "vitest";

/* ================================================================
 * 限流器测试 — 直接测试限流逻辑（从 route.ts 提取核心算法）
 * ================================================================ */

interface RateEntry {
  count: number;
  resetAt: number;
}

const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000;

function createRateLimiter() {
  const map = new Map<string, RateEntry>();
  let lastCleanup = Date.now();
  const CLEANUP_INTERVAL = 5 * 60 * 1000;
  const MAX_ENTRIES = 10_000;

  function cleanup(now: number) {
    for (const [key, val] of map) {
      if (now > val.resetAt) map.delete(key);
    }
    if (map.size >= MAX_ENTRIES) {
      let oldestKey = "";
      let oldestReset = Infinity;
      for (const [key, val] of map) {
        if (val.resetAt < oldestReset) {
          oldestReset = val.resetAt;
          oldestKey = key;
        }
      }
      if (oldestKey) map.delete(oldestKey);
    }
    lastCleanup = now;
  }

  function check(ip: string): boolean {
    const now = Date.now();
    if (now - lastCleanup > CLEANUP_INTERVAL || map.size >= MAX_ENTRIES) {
      cleanup(now);
    }
    const entry = map.get(ip);
    if (!entry || now > entry.resetAt) {
      map.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
      return true;
    }
    if (entry.count >= RATE_LIMIT) return false;
    entry.count++;
    return true;
  }

  function getRemaining(ip: string): number {
    const entry = map.get(ip);
    if (!entry || Date.now() > entry.resetAt) return RATE_LIMIT;
    return RATE_LIMIT - entry.count;
  }

  return { check, getRemaining, size: () => map.size };
}

describe("限流器", () => {
  it("允许前 5 次请求", () => {
    const rl = createRateLimiter();
    for (let i = 0; i < 5; i++) {
      expect(rl.check("1.2.3.4")).toBe(true);
    }
  });

  it("第 6 次请求被拒绝", () => {
    const rl = createRateLimiter();
    for (let i = 0; i < 5; i++) rl.check("1.2.3.4");
    expect(rl.check("1.2.3.4")).toBe(false);
  });

  it("不同 IP 有独立的配额", () => {
    const rl = createRateLimiter();
    for (let i = 0; i < 5; i++) rl.check("1.1.1.1");
    expect(rl.check("1.1.1.1")).toBe(false);
    expect(rl.check("2.2.2.2")).toBe(true);
  });

  it("getRemaining 返回正确的剩余次数", () => {
    const rl = createRateLimiter();
    expect(rl.getRemaining("1.2.3.4")).toBe(5);
    rl.check("1.2.3.4");
    expect(rl.getRemaining("1.2.3.4")).toBe(4);
  });

  it("未知 IP 返回满额配额", () => {
    const rl = createRateLimiter();
    expect(rl.getRemaining("9.9.9.9")).toBe(5);
  });
});
