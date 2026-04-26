import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Tool } from "@/data/tools";

const getToolById = vi.fn();
const loadGeneratedTools = vi.fn();

vi.mock("@/data/tools", () => ({
  getToolById,
}));

vi.mock("@/data/generated-tools", () => ({
  loadGeneratedTools,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/tool-page");
}

const sampleTool: Tool = {
  id: "p5-upper-2",
  name: "分数教具",
  subtitle: "五年级上册",
  chapter: "上册 · 第二单元",
  semester: "上册",
  unitNum: 2,
  gradeId: "p5",
  subjectId: "math",
  description: "用于分数入门",
  tags: ["分数"],
  gradient: ["#111111", "#222222"],
  icon: "📐",
};

const generatedSampleTool: Tool = {
  ...sampleTool,
  id: "gen-123",
};

beforeEach(() => {
  getToolById.mockReset();
  loadGeneratedTools.mockReset();
});

describe("tool page helpers", () => {
  it("优先命中静态工具，不读取生成工具列表", async () => {
    const { findToolPageEntry } = await importModule();
    getToolById.mockReturnValue(sampleTool);

    await expect(findToolPageEntry(sampleTool.id)).resolves.toEqual({
      tool: sampleTool,
      isGenerated: false,
    });
    expect(loadGeneratedTools).not.toHaveBeenCalled();
  });

  it("仅对 gen- id 查询生成工具列表", async () => {
    const { findToolPageEntry } = await importModule();
    getToolById.mockReturnValue(undefined);
    loadGeneratedTools.mockResolvedValue([generatedSampleTool]);

    await expect(findToolPageEntry("gen-123")).resolves.toEqual({
      tool: generatedSampleTool,
      isGenerated: true,
    });
    await expect(findToolPageEntry("custom-id")).resolves.toBeNull();
  });

  it("生成 iframe 地址和 metadata", async () => {
    const { createToolMetadata, getToolIframeSrc } = await importModule();

    expect(getToolIframeSrc("p5-upper-2", false)).toBe("/tools/p5-upper-2.html");
    expect(getToolIframeSrc("gen-123", true)).toBe("/api/generated-tools/gen-123/html");
    expect(createToolMetadata(sampleTool)).toEqual({
      title: "分数教具 — 教立方 EduCube",
      description: "用于分数入门",
      openGraph: {
        title: "分数教具 — 教立方 EduCube",
        description: "用于分数入门",
        type: "article",
      },
      twitter: {
        card: "summary",
        title: "分数教具 — 教立方 EduCube",
        description: "用于分数入门",
      },
    });
  });
});
