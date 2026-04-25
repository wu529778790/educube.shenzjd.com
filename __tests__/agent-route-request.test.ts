import { describe, expect, it } from "vitest";
import {
  readAgentRequestBody,
  validateAgentConversationMessage,
} from "@/lib/agent/route-request";

describe("agent route request helpers", () => {
  it("在请求体不是合法 JSON 时返回 400", async () => {
    const request = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{invalid-json",
    });

    const result = await readAgentRequestBody(request as never);

    expect(result).toBeInstanceOf(Response);
    expect((result as Response).status).toBe(400);
    await expect((result as Response).json()).resolves.toEqual({
      error: "无效的请求体",
    });
  });

  it("读取合法请求体", async () => {
    const request = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "做一个分数教具",
        sessionId: "sess-1",
      }),
    });

    await expect(readAgentRequestBody(request as never)).resolves.toEqual({
      message: "做一个分数教具",
      sessionId: "sess-1",
    });
  });

  it("校验空消息和超长消息", async () => {
    const empty = validateAgentConversationMessage("");
    expect(empty?.status).toBe(400);
    await expect(empty?.json()).resolves.toEqual({ error: "消息不能为空" });

    const tooLong = validateAgentConversationMessage("a".repeat(2001));
    expect(tooLong?.status).toBe(400);
    await expect(tooLong?.json()).resolves.toEqual({
      error: "消息太长（最多 2000 字）",
    });

    expect(validateAgentConversationMessage("正常消息")).toBeNull();
  });
});
