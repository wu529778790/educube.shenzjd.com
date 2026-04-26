import { describe, expect, it } from "vitest";
import {
  readGenerateRequestBody,
  validateGenerateRequestBody,
} from "@/lib/generate/route-request";

describe("generate route request helpers", () => {
  it("解析合法请求体", async () => {
    const result = await readGenerateRequestBody(
      new Request("https://educube.cn/api/generate", {
        method: "POST",
        body: JSON.stringify({
          grade: "p5",
          subject: "math",
          description: "请生成一个分数比较互动教具",
        }),
      }),
    );

    expect(result).toEqual({
      grade: "p5",
      subject: "math",
      description: "请生成一个分数比较互动教具",
    });
  });

  it("拒绝过大的请求体", async () => {
    const result = await readGenerateRequestBody(
      new Request("https://educube.cn/api/generate", {
        method: "POST",
        body: "x".repeat(10_001),
      }),
    );

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(413);
    await expect((result as Response).json()).resolves.toEqual({
      error: "请求体过大",
    });
  });

  it("校验描述、年级和学科", async () => {
    expect(
      validateGenerateRequestBody({
        description: "太短",
      })?.status,
    ).toBe(400);

    expect(
      validateGenerateRequestBody({
        description: "请生成一个分数教具",
        grade: "unknown",
      })?.status,
    ).toBe(400);

    expect(
      validateGenerateRequestBody({
        description: "请生成一个分数教具",
        subject: "unknown",
      })?.status,
    ).toBe(400);

    expect(
      validateGenerateRequestBody({
        description: "请生成一个分数比较互动教具",
        grade: "p5",
        subject: "math",
      }),
    ).toBeNull();
  });
});
