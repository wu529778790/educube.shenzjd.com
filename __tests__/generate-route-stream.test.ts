import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const generateAndPublishTool = vi.fn();
const logger = {
  info: vi.fn(),
  error: vi.fn(),
};

vi.mock("@/lib/generate/service", () => ({
  GenerateToolError: class GenerateToolError extends Error {
    public readonly userMessage: string;

    public constructor(message: string, userMessage: string) {
      super(message);
      this.name = "GenerateToolError";
      this.userMessage = userMessage;
    }
  },
  generateAndPublishTool,
}));

vi.mock("@/lib/logger", () => ({
  logger,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/generate/route-stream");
}

beforeEach(() => {
  generateAndPublishTool.mockReset();
  logger.info.mockReset();
  logger.error.mockReset();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("createGenerateStreamResponse", () => {
  it("输出 stage、refined、done 事件并在结束时释放连接", async () => {
    const { createGenerateStreamResponse } = await importModule();
    const releaseConnection = vi.fn();

    generateAndPublishTool.mockImplementation(async (_input, callbacks) => {
      callbacks.onStage?.({
        stage: "refining",
        message: "正在分析需求并整理规格说明…",
      });
      callbacks.onRefined?.({
        refinedName: "分数比较器",
        refinedSpec: "比较同分母分数大小",
      });

      return {
        tool: { id: "gen-1", name: "分数比较器" },
        html: "<!DOCTYPE html><html></html>",
        refinedName: "分数比较器",
        refinedSpec: "比较同分母分数大小",
      };
    });

    const response = createGenerateStreamResponse({
      startTime: Date.now(),
      gradeId: "p5",
      subjectId: "math",
      userIntent: "做一个分数比较教具",
      gradeLabel: "五年级",
      subjectLabel: "数学",
      releaseConnection,
    });

    const text = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/event-stream");
    expect(text).toContain('event: stage');
    expect(text).toContain('event: refined');
    expect(text).toContain('event: done');
    expect(text).toContain('"refinedName":"分数比较器"');
    expect(releaseConnection).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalled();
  });

  it("在生成失败时输出 error 事件并释放连接", async () => {
    const { createGenerateStreamResponse } = await importModule();
    const releaseConnection = vi.fn();

    generateAndPublishTool.mockRejectedValue(new Error("boom"));

    const response = createGenerateStreamResponse({
      startTime: Date.now(),
      gradeId: "p5",
      subjectId: "math",
      userIntent: "做一个分数比较教具",
      gradeLabel: "五年级",
      subjectLabel: "数学",
      releaseConnection,
    });

    const text = await response.text();

    expect(text).toContain('event: error');
    expect(text).toContain("生成失败，请稍后重试");
    expect(releaseConnection).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalled();
  });
});
