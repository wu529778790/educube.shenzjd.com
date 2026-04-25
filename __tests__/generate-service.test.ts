import { beforeEach, describe, expect, it, vi } from "vitest";

const generateRefinedSpec = vi.fn();
const generateToolHtml = vi.fn();
const publishGeneratedTool = vi.fn();
const sanitizeHtml = vi.fn();
const buildRefineUserPrompt = vi.fn();
const buildSystemPrompt = vi.fn();
const buildUserPrompt = vi.fn();
const parseRefinedSpecOutput = vi.fn();

vi.mock("@/lib/ai-client", () => ({
  generateRefinedSpec,
  generateToolHtml,
}));

vi.mock("@/lib/generated-tools/publish-generated-tool", () => ({
  publishGeneratedTool,
}));

vi.mock("@/lib/html-sanitizer", () => ({
  sanitizeHtml,
}));

vi.mock("@/data/prompt-template", () => ({
  REFINE_SYSTEM: "REFINE_SYSTEM",
  buildRefineUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  parseRefinedSpecOutput,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/generate/service");
}

beforeEach(() => {
  generateRefinedSpec.mockReset();
  generateToolHtml.mockReset();
  publishGeneratedTool.mockReset();
  sanitizeHtml.mockReset();
  buildRefineUserPrompt.mockReset();
  buildSystemPrompt.mockReset();
  buildUserPrompt.mockReset();
  parseRefinedSpecOutput.mockReset();

  buildRefineUserPrompt.mockReturnValue("REFINE_USER");
  buildSystemPrompt.mockReturnValue("SYSTEM_PROMPT");
  buildUserPrompt.mockReturnValue("USER_PROMPT");
  parseRefinedSpecOutput.mockReturnValue({
    name: "分数教具",
    spec: "用于分数入门",
  });
  sanitizeHtml.mockImplementation((html: string) => `clean:${html}`);
});

describe("generateAndPublishTool", () => {
  it("按阶段生成并发布教具", async () => {
    const { generateAndPublishTool } = await importModule();
    generateRefinedSpec.mockResolvedValue("raw refine");
    generateToolHtml.mockResolvedValue("<html>tool</html>");
    publishGeneratedTool.mockResolvedValue({
      id: "gen-1",
      name: "分数教具",
    });

    const stages: string[] = [];
    const refinedEvents: Array<{ refinedName: string; refinedSpec: string }> =
      [];

    const result = await generateAndPublishTool(
      {
        gradeId: "p5",
        subjectId: "math",
        userIntent: "帮我做一个分数入门教具",
      },
      {
        onStage(event) {
          stages.push(event.stage);
        },
        onRefined(event) {
          refinedEvents.push(event);
        },
      },
    );

    expect(generateRefinedSpec).toHaveBeenCalledWith(
      "REFINE_SYSTEM",
      "REFINE_USER",
    );
    expect(generateToolHtml).toHaveBeenCalledWith(
      "SYSTEM_PROMPT",
      "USER_PROMPT",
    );
    expect(sanitizeHtml).toHaveBeenCalledWith("<html>tool</html>", {
      preserveInlineEventHandlers: true,
    });
    expect(publishGeneratedTool).toHaveBeenCalledWith(
      expect.objectContaining({
        html: "clean:<html>tool</html>",
        meta: expect.objectContaining({
          name: "分数教具",
          grade: "p5",
          subject: "math",
          description: "用于分数入门",
        }),
      }),
    );
    expect(stages).toEqual(["refining", "generating", "saving"]);
    expect(refinedEvents).toEqual([
      {
        refinedName: "分数教具",
        refinedSpec: "用于分数入门",
      },
    ]);
    expect(result).toEqual({
      tool: {
        id: "gen-1",
        name: "分数教具",
      },
      html: "clean:<html>tool</html>",
      refinedName: "分数教具",
      refinedSpec: "用于分数入门",
    });
  });

  it("在整理需求失败时抛出用户可读错误", async () => {
    const { generateAndPublishTool } = await importModule();
    generateRefinedSpec.mockRejectedValue(new Error("refine failed"));

    await expect(
      generateAndPublishTool({
        gradeId: "p5",
        subjectId: "math",
        userIntent: "帮我做一个分数入门教具",
      }),
    ).rejects.toMatchObject({
      name: "GenerateToolError",
      userMessage: "整理需求失败，请稍后重试",
    });
  });

  it("在生成结果过大时抛出用户可读错误", async () => {
    const { generateAndPublishTool } = await importModule();
    generateRefinedSpec.mockResolvedValue("raw refine");
    generateToolHtml.mockResolvedValue("x".repeat(1_024 * 1_024 + 1));

    await expect(
      generateAndPublishTool({
        gradeId: "p5",
        subjectId: "math",
        userIntent: "帮我做一个分数入门教具",
      }),
    ).rejects.toMatchObject({
      name: "GenerateToolError",
      userMessage: "生成的教具过大，请简化需求后重试",
    });
  });

  it("在保存失败时抛出用户可读错误", async () => {
    const { generateAndPublishTool } = await importModule();
    generateRefinedSpec.mockResolvedValue("raw refine");
    generateToolHtml.mockResolvedValue("<html>tool</html>");
    publishGeneratedTool.mockRejectedValue(new Error("save failed"));

    await expect(
      generateAndPublishTool({
        gradeId: "p5",
        subjectId: "math",
        userIntent: "帮我做一个分数入门教具",
      }),
    ).rejects.toMatchObject({
      name: "GenerateToolError",
      userMessage: "保存失败，请稍后重试",
    });
  });
});
