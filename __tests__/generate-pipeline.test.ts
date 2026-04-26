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
  return import("@/lib/generate/pipeline");
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

describe("generate pipeline helpers", () => {
  it("解析年级和学科标签，未知值回退到原始 id", async () => {
    const { resolveGenerateToolLabels } = await importModule();

    expect(
      resolveGenerateToolLabels({
        gradeId: "p5",
        subjectId: "math",
        userIntent: "分数教具",
      }),
    ).toEqual({
      gradeLabel: "五年级",
      subjectLabel: "数学",
    });

    expect(
      resolveGenerateToolLabels({
        gradeId: "unknown-grade",
        subjectId: "unknown-subject",
        userIntent: "分数教具",
      }),
    ).toEqual({
      gradeLabel: "unknown-grade",
      subjectLabel: "unknown-subject",
    });
  });

  it("在 HTML 过大时抛出用户可读错误", async () => {
    const { generateSanitizedToolHtml } = await importModule();
    generateToolHtml.mockResolvedValue("x".repeat(1_024 * 1_024 + 1));

    await expect(
      generateSanitizedToolHtml({
        labels: {
          gradeLabel: "五年级",
          subjectLabel: "数学",
        },
        refined: {
          refinedName: "分数教具",
          refinedSpec: "用于分数入门",
        },
      }),
    ).rejects.toMatchObject({
      name: "GenerateToolError",
      userMessage: "生成的教具过大，请简化需求后重试",
    });
  });

  it("在保存失败时抛出用户可读错误", async () => {
    const { saveGeneratedTool } = await importModule();
    publishGeneratedTool.mockRejectedValue(new Error("save failed"));

    await expect(
      saveGeneratedTool({
        input: {
          gradeId: "p5",
          subjectId: "math",
          userIntent: "帮我做一个分数入门教具",
        },
        html: "<html>tool</html>",
        refined: {
          refinedName: "分数教具",
          refinedSpec: "用于分数入门",
        },
      }),
    ).rejects.toMatchObject({
      name: "GenerateToolError",
      userMessage: "保存失败，请稍后重试",
    });
  });
});
