import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importRuntimeConfig() {
  vi.resetModules();
  return import("@/lib/runtime-config");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("runtime-config", () => {
  it("在未显式配置时提供稳定默认值", async () => {
    delete process.env.AI_PROVIDER;
    delete process.env.AI_MAX_TOKENS;
    delete process.env.AI_TIMEOUT;
    delete process.env.GENERATED_TOOLS_BACKEND;
    delete process.env.AGENT_SESSION_STORE;

    const mod = await importRuntimeConfig();

    expect(mod.AI_PROVIDER).toBe("openai");
    expect(mod.AI_MAX_TOKENS).toBe(16000);
    expect(mod.AI_TIMEOUT).toBe(120000);
    expect(mod.GENERATED_TOOLS_BACKEND).toBe("filesystem");
    expect(mod.AGENT_SESSION_STORE).toBe("memory");
  });

  it("拒绝不支持的 AI_PROVIDER", async () => {
    process.env.AI_PROVIDER = "glm";
    await expect(importRuntimeConfig()).rejects.toThrow(
      "Unsupported AI_PROVIDER",
    );
  });

  it("拒绝不支持的 GENERATED_TOOLS_BACKEND", async () => {
    process.env.GENERATED_TOOLS_BACKEND = "s3";
    await expect(importRuntimeConfig()).rejects.toThrow(
      "Unsupported GENERATED_TOOLS_BACKEND",
    );
  });

  it("拒绝非法的 AI_MAX_TOKENS", async () => {
    process.env.AI_MAX_TOKENS = "abc";
    await expect(importRuntimeConfig()).rejects.toThrow(
      "Unsupported AI_MAX_TOKENS",
    );
  });

  it("按 provider 返回默认模型名", async () => {
    delete process.env.AI_MODEL;
    const mod = await importRuntimeConfig();

    expect(mod.getDefaultAIModel("openai")).toBe("gpt-4o");
    expect(mod.getDefaultAIModel("anthropic")).toBe("claude-sonnet-4-20250514");
  });
});
