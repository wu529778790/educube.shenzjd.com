import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importGeneratedToolsProvider() {
  vi.resetModules();
  return import("@/lib/generated-tools/provider");
}

async function importAgentSessionStoreProvider() {
  vi.resetModules();
  return import("@/lib/agent/session-store/provider");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.resetModules();
});

describe("generated-tools provider", () => {
  it("默认返回文件系统仓储实现", async () => {
    delete process.env.GENERATED_TOOLS_BACKEND;

    const mod = await importGeneratedToolsProvider();
    const repository = mod.getDefaultGeneratedToolsRepository();

    expect(repository).toMatchObject({
      listTools: expect.any(Function),
      saveTool: expect.any(Function),
      getToolById: expect.any(Function),
      readToolHtml: expect.any(Function),
      invalidateCache: expect.any(Function),
    });
  });
});

describe("agent session store provider", () => {
  it("默认返回内存 session store 实现", async () => {
    delete process.env.AGENT_SESSION_STORE;

    const mod = await importAgentSessionStoreProvider();
    const store = mod.getDefaultAgentSessionStore();
    const session = store.getOrCreate();

    expect(session.sessionId).toBeTruthy();
    expect(session.state.stage).toBe("idle");
    expect(store.get(session.sessionId)?.stage).toBe("idle");
  });
});
