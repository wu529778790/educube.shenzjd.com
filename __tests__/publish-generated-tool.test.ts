import { afterEach, describe, expect, it, vi } from "vitest";

const saveGeneratedTool = vi.fn();
const revalidatePath = vi.fn();

vi.mock("@/data/generated-tools", () => ({
  saveGeneratedTool,
}));

vi.mock("next/cache", () => ({
  revalidatePath,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/generated-tools/publish-generated-tool");
}

afterEach(() => {
  vi.clearAllMocks();
});

describe("publishGeneratedTool", () => {
  it("保存后会刷新首页缓存并返回工具对象", async () => {
    const { publishGeneratedTool } = await importModule();
    const tool = { id: "gen-1", name: "测试教具" };
    saveGeneratedTool.mockResolvedValue(tool);

    const result = await publishGeneratedTool({
      id: "gen-1",
      html: "<!DOCTYPE html><html></html>",
      meta: {
        name: "测试教具",
        grade: "p5",
        subject: "math",
        chapter: "第一单元",
        description: "描述",
        gradient: ["#000000", "#ffffff"],
        icon: "📐",
      },
    });

    expect(saveGeneratedTool).toHaveBeenCalledWith(
      "gen-1",
      "<!DOCTYPE html><html></html>",
      expect.objectContaining({
        name: "测试教具",
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(result).toBe(tool);
  });
});
