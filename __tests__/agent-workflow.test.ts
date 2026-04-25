import { beforeEach, describe, expect, it, vi } from "vitest";

const generateChatText = vi.fn();
const buildRefineUserPrompt = vi.fn();
const parseRefinedSpecOutput = vi.fn();
const buildSpecSystemPrompt = vi.fn();
const buildSpecUserPrompt = vi.fn();
const parseSpecOutput = vi.fn();
const wrapSpecAsHtml = vi.fn();
const buildCreateFallbackHtmlPrompt = vi.fn();
const buildFallbackSystemPrompt = vi.fn();
const buildEditPrompt = vi.fn();
const buildEditSpecPrompt = vi.fn();
const sanitizeHtml = vi.fn();
const validateSpecRuntime = vi.fn();
const logger = {
  debug: vi.fn(),
  warn: vi.fn(),
};

vi.mock("@/lib/ai-client", () => ({
  generateChatText,
}));

vi.mock("@/data/prompt-template", () => ({
  buildRefineUserPrompt,
  parseRefinedSpecOutput,
}));

vi.mock("@/data/spec-prompt", () => ({
  buildSpecSystemPrompt,
  buildSpecUserPrompt,
  parseSpecOutput,
  wrapSpecAsHtml,
}));

vi.mock("@/lib/agent/prompting", async () => {
  const actual = await vi.importActual<typeof import("@/lib/agent/prompting")>(
    "@/lib/agent/prompting",
  );
  return {
    ...actual,
    buildCreateFallbackHtmlPrompt,
    buildFallbackSystemPrompt,
    buildEditPrompt,
    buildEditSpecPrompt,
  };
});

vi.mock("@/lib/agent/spec-runtime", () => ({
  validateSpecRuntime,
}));

vi.mock("@/lib/html-sanitizer", () => ({
  sanitizeHtml,
}));

vi.mock("@/lib/logger", () => ({
  logger,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/agent/workflow");
}

beforeEach(() => {
  generateChatText.mockReset();
  buildRefineUserPrompt.mockReset();
  parseRefinedSpecOutput.mockReset();
  buildSpecSystemPrompt.mockReset();
  buildSpecUserPrompt.mockReset();
  parseSpecOutput.mockReset();
  wrapSpecAsHtml.mockReset();
  buildCreateFallbackHtmlPrompt.mockReset();
  buildFallbackSystemPrompt.mockReset();
  buildEditPrompt.mockReset();
  buildEditSpecPrompt.mockReset();
  sanitizeHtml.mockReset();
  validateSpecRuntime.mockReset();
  logger.debug.mockReset();
  logger.warn.mockReset();

  buildRefineUserPrompt.mockReturnValue("REFINE_USER");
  parseRefinedSpecOutput.mockReturnValue({
    name: "分数教具",
    spec: "展示分数圆",
  });
  buildSpecSystemPrompt.mockReturnValue("SPEC_SYSTEM");
  buildSpecUserPrompt.mockReturnValue("SPEC_USER");
  wrapSpecAsHtml.mockReturnValue("<html>spec</html>");
  buildCreateFallbackHtmlPrompt.mockReturnValue("CREATE_FALLBACK");
  buildFallbackSystemPrompt.mockReturnValue("FALLBACK_SYSTEM");
  buildEditPrompt.mockReturnValue("EDIT_HTML_PROMPT");
  buildEditSpecPrompt.mockReturnValue("EDIT_SPEC_PROMPT");
  sanitizeHtml.mockImplementation((html: string) => `clean:${html}`);
});

describe("createAgentTool", () => {
  it("在 spec 有效时返回 spec 模式结果", async () => {
    const { createAgentTool } = await importModule();
    generateChatText
      .mockResolvedValueOnce("refined")
      .mockResolvedValueOnce("spec-result");
    parseSpecOutput.mockReturnValue({
      spec: { title: "分数教具" },
      valid: true,
    });

    const result = await createAgentTool({
      userInput: "做一个分数教具",
      gradeLabel: "五年级",
      subjectLabel: "数学",
    });

    expect(generateChatText).toHaveBeenNthCalledWith(
      1,
      expect.any(String),
      "REFINE_USER",
      expect.objectContaining({ maxTokens: 2048 }),
    );
    expect(generateChatText).toHaveBeenNthCalledWith(
      2,
      "SPEC_SYSTEM",
      "SPEC_USER",
      expect.objectContaining({ temperature: 0.3 }),
    );
    expect(validateSpecRuntime).toHaveBeenCalledWith({ title: "分数教具" });
    expect(result).toEqual({
      toolName: "分数教具",
      html: "<html>spec</html>",
      spec: { title: "分数教具" },
      mode: "spec",
    });
  });

  it("在 spec 无效时回退到 html 模式", async () => {
    const { createAgentTool } = await importModule();
    generateChatText
      .mockResolvedValueOnce("refined")
      .mockResolvedValueOnce("bad-spec")
      .mockResolvedValueOnce("<html>fallback</html>");
    parseSpecOutput.mockReturnValue({
      spec: {},
      valid: false,
    });

    const result = await createAgentTool({
      userInput: "做一个分数教具",
      gradeLabel: "五年级",
      subjectLabel: "数学",
    });

    expect(generateChatText).toHaveBeenNthCalledWith(
      3,
      "FALLBACK_SYSTEM",
      "CREATE_FALLBACK",
      expect.objectContaining({ temperature: 0.3 }),
    );
    expect(sanitizeHtml).toHaveBeenCalledWith("<html>fallback</html>", {
      preserveInlineEventHandlers: true,
    });
    expect(result).toEqual({
      toolName: "分数教具",
      html: "clean:<html>fallback</html>",
      spec: null,
      mode: "html",
    });
  });
});

describe("modifyAgentTool", () => {
  it("在 spec 修改成功时返回 spec 模式结果", async () => {
    const { modifyAgentTool } = await importModule();
    generateChatText.mockResolvedValueOnce("modified-spec");
    parseSpecOutput.mockReturnValue({
      spec: { title: "修改后教具" },
      valid: true,
    });
    wrapSpecAsHtml.mockReturnValue("<html>modified-spec</html>");

    const result = await modifyAgentTool({
      userInput: "改成蓝色",
      currentHtml: "<html>current</html>",
      currentSpec: { title: "原教具" },
      messages: [
        { role: "user", content: "先做一个教具" },
        { role: "assistant", content: "已经生成" },
      ],
    });

    expect(generateChatText).toHaveBeenCalledWith(
      expect.any(String),
      "EDIT_SPEC_PROMPT",
      expect.objectContaining({ temperature: 0.2 }),
    );
    expect(result).toEqual({
      html: "<html>modified-spec</html>",
      spec: { title: "修改后教具" },
      mode: "spec",
    });
  });

  it("在 spec 修改失败时回退到 html 修改", async () => {
    const { modifyAgentTool } = await importModule();
    generateChatText
      .mockResolvedValueOnce("bad-spec")
      .mockResolvedValueOnce("<html>modified-html</html>");
    parseSpecOutput.mockReturnValue({
      spec: {},
      valid: false,
    });

    const result = await modifyAgentTool({
      userInput: "增加练习模式",
      currentHtml: "<html>current</html>",
      currentSpec: { title: "原教具" },
      messages: [],
    });

    expect(generateChatText).toHaveBeenNthCalledWith(
      2,
      expect.any(String),
      "EDIT_HTML_PROMPT",
      expect.objectContaining({ temperature: 0.2 }),
    );
    expect(result).toEqual({
      html: "clean:<html>modified-html</html>",
      spec: null,
      mode: "html",
    });
  });
});
