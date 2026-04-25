import { afterEach, describe, expect, it, vi } from "vitest";
import {
  parseAgentSseChunk,
  restartAgentSession,
  saveAgentTool,
  streamAgentMessage,
} from "@/lib/agent/client";

function createStreamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    }),
    {
      headers: { "Content-Type": "text/event-stream" },
    },
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("parseAgentSseChunk", () => {
  it("解析 data 行并保留未完成尾巴", () => {
    const result = parseAgentSseChunk(
      'data: {"type":"thinking","content":"hi"}\n:comment\ndata: {"type":"done","content":"","html":"<html></html>"}\npart',
    );

    expect(result.events).toEqual([
      { type: "thinking", content: "hi" },
      { type: "done", content: "", html: "<html></html>" },
    ]);
    expect(result.remainder).toBe("part");
  });
});

describe("agent client", () => {
  it("流式读取 agent 事件", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      createStreamResponse([
        'data: {"type":"thinking","content":"第一步"}\n',
        'data: {"type":"error","content":"出错"}\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const events: Array<{ type: string; content: string }> = [];
    await streamAgentMessage({
      message: "生成教具",
      sessionId: "sess-1",
      onEvent: (event) => {
        events.push({ type: event.type, content: event.content });
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent",
      expect.objectContaining({
        method: "POST",
        signal: undefined,
      }),
    );
    expect(events).toEqual([
      { type: "thinking", content: "第一步" },
      { type: "error", content: "出错" },
    ]);
  });

  it("按约定格式提交保存请求", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      saveAgentTool({
        sessionId: "sess-1",
        gradeId: "p5",
        subjectId: "math",
        semester: "上册",
      }),
    ).resolves.toEqual({ ok: true });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "",
          action: "save",
          sessionId: "sess-1",
          saveMeta: {
            gradeId: "p5",
            subjectId: "math",
            semester: "上册",
          },
        }),
      }),
    );
  });

  it("按约定格式提交重置请求", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null));
    vi.stubGlobal("fetch", fetchMock);

    await restartAgentSession("sess-2");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/agent",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          message: "",
          action: "restart",
          sessionId: "sess-2",
        }),
      }),
    );
  });
});
