import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { access, mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { Tool } from "@/data/tools";
import type { SaveGeneratedToolMeta } from "@/lib/generated-tools/repository";

const ORIGINAL_CWD = process.cwd();

function makeTool(id: string): Tool {
  return {
    id,
    name: `教具-${id}`,
    subtitle: `副标题-${id}`,
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
}

function makeMeta(name: string): SaveGeneratedToolMeta {
  return {
    name,
    grade: "p5",
    subject: "math",
    chapter: "第一单元",
    description: "用于仓储测试的描述",
    gradient: ["#111111", "#eeeeee"],
    icon: "📐",
  };
}

async function importRepositoryModule() {
  vi.resetModules();
  return import("@/lib/generated-tools/file-system-repository");
}

async function waitFor(assertion: () => Promise<void>, retries = 20) {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      await assertion();
      return;
    } catch (err) {
      lastError = err;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
  throw lastError;
}

let tempRoot = "";

beforeEach(async () => {
  tempRoot = await mkdtemp(join(tmpdir(), "educube-generated-tools-"));
  process.chdir(tempRoot);
  await mkdir(join(tempRoot, "data"), { recursive: true });
  await mkdir(join(tempRoot, "public", "tools", "gen"), { recursive: true });
});

afterEach(async () => {
  process.chdir(ORIGINAL_CWD);
  vi.resetModules();
  if (tempRoot) {
    await rm(tempRoot, { recursive: true, force: true });
  }
});

describe("FileSystemGeneratedToolsRepository", () => {
  it("读取带遗留字段的索引后会异步压缩文件", async () => {
    const legacyTool = {
      ...makeTool("legacy-1"),
      legacyField: "old",
    };
    const indexPath = join(tempRoot, "data", "generated-tools.json");
    await writeFile(
      indexPath,
      JSON.stringify([
        {
          tool: legacyTool,
          createdAt: "2025-01-01T00:00:00.000Z",
          publisherId: "legacy-user",
        },
      ], null, 2),
      "utf-8",
    );

    const { FileSystemGeneratedToolsRepository } = await importRepositoryModule();
    const repository = new FileSystemGeneratedToolsRepository();

    const tools = await repository.listTools();
    expect(tools).toHaveLength(1);
    expect(tools[0].id).toBe("legacy-1");

    await waitFor(async () => {
      const rewritten = JSON.parse(await readFile(indexPath, "utf-8")) as Array<Record<string, unknown>>;
      const first = rewritten[0];
      expect(first.publisherId).toBeUndefined();
      expect((first.tool as Record<string, unknown>).legacyField).toBeUndefined();
    });
  });

  it("保存第 501 个教具时会 FIFO 裁剪并删除最旧 HTML", async () => {
    const indexPath = join(tempRoot, "data", "generated-tools.json");
    const htmlDir = join(tempRoot, "public", "tools", "gen");
    const existingRecords = [];

    for (let i = 0; i < 500; i++) {
      const id = `seed-${i}`;
      existingRecords.push({
        tool: makeTool(id),
        createdAt: new Date(2025, 0, 1, 0, 0, i).toISOString(),
      });
      await writeFile(
        join(htmlDir, `${id}.html`),
        `<!DOCTYPE html><html><body>${id}</body></html>`,
        "utf-8",
      );
    }

    await writeFile(indexPath, JSON.stringify(existingRecords, null, 2), "utf-8");

    const { FileSystemGeneratedToolsRepository } = await importRepositoryModule();
    const repository = new FileSystemGeneratedToolsRepository();

    const html = "<!DOCTYPE html><html><body>" + "x".repeat(200) + "</body></html>";
    await repository.saveTool("seed-500", html, makeMeta("新增教具"));

    const records = JSON.parse(await readFile(indexPath, "utf-8")) as Array<{ tool: Tool }>;
    expect(records).toHaveLength(500);
    expect(records[0].tool.id).toBe("seed-1");
    expect(records.at(-1)?.tool.id).toBe("seed-500");

    await waitFor(async () => {
      await expect(access(join(htmlDir, "seed-0.html"))).rejects.toThrow();
    });
  });

  it("HTML 文件缺失时返回 fallback 页面", async () => {
    const { FileSystemGeneratedToolsRepository } = await importRepositoryModule();
    const repository = new FileSystemGeneratedToolsRepository();
    const tool = makeTool("missing-html");

    const html = await repository.readToolHtml(tool);

    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("missing-html".replace("missing-html", tool.name));
    expect(html).toContain("/edu-lib/edu-base.css");
  });
});
