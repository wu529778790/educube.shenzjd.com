import { beforeEach, describe, expect, it, vi } from "vitest";

const validateGeneratedJavaScript = vi.fn();

vi.mock("@/lib/html-sanitizer", () => ({
  validateGeneratedJavaScript,
}));

async function importModule() {
  vi.resetModules();
  return import("@/lib/agent/spec-runtime");
}

beforeEach(() => {
  validateGeneratedJavaScript.mockReset();
});

describe("validateSpecRuntime", () => {
  it("校验 render 和标签页里的脚本字段", async () => {
    const { validateSpecRuntime } = await importModule();

    validateSpecRuntime({
      render: {
        draw: "draw code",
        resultArea: "result code",
        setup: "setup code",
        update: "update code",
        tabs: [
          { draw: "tab draw 1" },
          { draw: "tab draw 2" },
        ],
      },
      onReset: "reset code",
    });

    expect(validateGeneratedJavaScript).toHaveBeenCalledTimes(7);
    expect(validateGeneratedJavaScript).toHaveBeenNthCalledWith(1, "draw code");
    expect(validateGeneratedJavaScript).toHaveBeenNthCalledWith(7, "reset code");
  });

  it("忽略缺失或非字符串字段", async () => {
    const { validateSpecRuntime } = await importModule();

    validateSpecRuntime({
      render: {
        draw: 123,
        tabs: [{ draw: null }, "invalid"],
      },
      onReset: false,
    });

    expect(validateGeneratedJavaScript).not.toHaveBeenCalled();
  });
});
