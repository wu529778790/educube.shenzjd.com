import { describe, expect, it } from "vitest";
import {
  extractClientIp,
  GenerateConnectionGate,
  GenerateRateLimiter,
  getAllowedOriginHosts,
  isAllowedOrigin,
  isGenerateRequestAuthorized,
} from "@/lib/generate/request-guards";

function createRequest(url: string, headers?: Record<string, string>): Request {
  return new Request(url, {
    headers: headers ? new Headers(headers) : undefined,
  });
}

describe("GenerateRateLimiter", () => {
  it("允许前 5 次请求并拒绝第 6 次", () => {
    const limiter = new GenerateRateLimiter();

    for (let index = 0; index < 5; index++) {
      expect(limiter.check("1.2.3.4")).toBe(true);
    }

    expect(limiter.check("1.2.3.4")).toBe(false);
  });

  it("为不同 IP 维护独立配额", () => {
    const limiter = new GenerateRateLimiter();

    for (let index = 0; index < 5; index++) {
      limiter.check("1.1.1.1");
    }

    expect(limiter.check("1.1.1.1")).toBe(false);
    expect(limiter.check("2.2.2.2")).toBe(true);
  });

  it("返回正确的剩余额度和重置时间", () => {
    let now = 1_000;
    const limiter = new GenerateRateLimiter({
      now: () => now,
      rateWindowMs: 500,
    });

    expect(limiter.getRemaining("1.2.3.4")).toEqual({
      remaining: 5,
      resetAt: 1_500,
    });

    limiter.check("1.2.3.4");

    expect(limiter.getRemaining("1.2.3.4")).toEqual({
      remaining: 4,
      resetAt: 1_500,
    });

    now = 1_600;

    expect(limiter.getRemaining("1.2.3.4")).toEqual({
      remaining: 5,
      resetAt: 2_100,
    });
  });
});

describe("extractClientIp", () => {
  it("优先使用 cf-connecting-ip", () => {
    const request = createRequest("https://educube.cn/api/generate", {
      "cf-connecting-ip": "1.2.3.4",
      "x-forwarded-for": "5.6.7.8",
    });

    expect(extractClientIp(request)).toBe("1.2.3.4");
  });

  it("按可信代理层数解析 x-forwarded-for", () => {
    const request = createRequest("https://educube.cn/api/generate", {
      "x-forwarded-for": "1.1.1.1, 2.2.2.2, 3.3.3.3",
    });

    expect(extractClientIp(request, 1)).toBe("3.3.3.3");
    expect(extractClientIp(request, 2)).toBe("2.2.2.2");
    expect(extractClientIp(request, 3)).toBe("1.1.1.1");
  });

  it("在上游头不可用时回退到 x-real-ip", () => {
    const request = createRequest("https://educube.cn/api/generate", {
      "x-real-ip": "8.8.8.8",
    });

    expect(extractClientIp(request)).toBe("8.8.8.8");
  });

  it("无法识别时返回 unknown", () => {
    const request = createRequest("https://educube.cn/api/generate", {
      "x-forwarded-for": "not-an-ip",
    });

    expect(extractClientIp(request)).toBe("unknown");
  });
});

describe("请求来源与鉴权", () => {
  it("支持共享密钥鉴权", () => {
    const request = createRequest("https://educube.cn/api/generate", {
      "x-generate-secret": "secret",
    });

    expect(isGenerateRequestAuthorized(request, "")).toBe(true);
    expect(isGenerateRequestAuthorized(request, "secret")).toBe(true);
    expect(isGenerateRequestAuthorized(request, "other")).toBe(false);
  });

  it("构建允许的来源 host 集合并校验 origin", () => {
    const allowedHosts = getAllowedOriginHosts({
      siteUrl: "https://demo.educube.cn",
      extraOrigins: "preview.educube.cn, internal.educube.cn ",
    });

    expect(allowedHosts).toEqual(
      new Set([
        "demo.educube.cn",
        "localhost:3000",
        "127.0.0.1:3000",
        "preview.educube.cn",
        "internal.educube.cn",
      ]),
    );
    expect(isAllowedOrigin(null, allowedHosts)).toBe(true);
    expect(
      isAllowedOrigin("https://preview.educube.cn/editor", allowedHosts),
    ).toBe(true);
    expect(isAllowedOrigin("https://evil.example.com", allowedHosts)).toBe(
      false,
    );
    expect(isAllowedOrigin("not-a-url", allowedHosts)).toBe(false);
  });
});

describe("GenerateConnectionGate", () => {
  it("限制并发连接数并允许释放后继续获取", () => {
    const gate = new GenerateConnectionGate(2);

    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(false);
    expect(gate.getActiveCount()).toBe(2);

    gate.release();

    expect(gate.getActiveCount()).toBe(1);
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.getActiveCount()).toBe(2);
  });
});
