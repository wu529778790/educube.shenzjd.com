import { describe, expect, it } from "vitest";
import {
  createSseHeaders,
  formatSseData,
  formatSseEvent,
} from "@/lib/http/sse";

describe("SSE helpers", () => {
  it("格式化默认 data 消息", () => {
    expect(formatSseData({ ok: true })).toBe('data: {"ok":true}\n\n');
  });

  it("格式化带事件名的消息", () => {
    expect(formatSseEvent("stage", { step: "refining" })).toBe(
      'event: stage\ndata: {"step":"refining"}\n\n',
    );
  });

  it("提供可覆盖的 SSE 响应头", () => {
    const headers = createSseHeaders({
      "Cache-Control": "no-cache",
    });

    expect(headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
    expect(headers.get("Cache-Control")).toBe("no-cache");
    expect(headers.get("Connection")).toBe("keep-alive");
    expect(headers.get("X-Accel-Buffering")).toBe("no");
  });
});
