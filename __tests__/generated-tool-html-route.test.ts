import { afterEach, describe, expect, it, vi } from "vitest";
import type { Tool } from "@/data/tools";

const getGeneratedToolById = vi.fn();
const readGeneratedToolHtml = vi.fn();

vi.mock("@/data/generated-tools", () => ({
  getGeneratedToolById,
  readGeneratedToolHtml,
}));

async function importRouteModule() {
  vi.resetModules();
  return import("@/app/api/generated-tools/[id]/html/route");
}

const tool: Tool = {
  id: "gen-1",
  name: "测试教具",
  subtitle: "测试副标题",
  chapter: "第一单元",
  semester: "上册",
  unitNum: 1,
  gradeId: "p5",
  subjectId: "math",
  description: "测试描述",
  tags: ["测试"],
  gradient: ["#000000", "#ffffff"],
  icon: "📐",
};

afterEach(() => {
  vi.clearAllMocks();
});

describe("/api/generated-tools/[id]/html", () => {
  it("找不到教具时返回 404", async () => {
    const { GET } = await importRouteModule();
    getGeneratedToolById.mockResolvedValue(undefined);

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "missing" }),
    });

    expect(response.status).toBe(404);
    expect(await response.text()).toBe("Not Found");
  });

  it("找到教具时返回 HTML 和安全响应头", async () => {
    const { GET } = await importRouteModule();
    getGeneratedToolById.mockResolvedValue(tool);
    readGeneratedToolHtml.mockResolvedValue("<!DOCTYPE html><html></html>");

    const response = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "gen-1" }),
    });

    expect(getGeneratedToolById).toHaveBeenCalledWith("gen-1");
    expect(readGeneratedToolHtml).toHaveBeenCalledWith(tool);
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/html");
    expect(response.headers.get("Content-Security-Policy")).toContain(
      "sandbox allow-scripts",
    );
    expect(await response.text()).toBe("<!DOCTYPE html><html></html>");
  });
});
