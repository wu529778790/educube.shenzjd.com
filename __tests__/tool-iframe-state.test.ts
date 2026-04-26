import { describe, expect, it } from "vitest";
import {
  createInitialToolIframeState,
  markToolIframeErrored,
  markToolIframeLoaded,
  TOOL_IFRAME_READY_TIMEOUT_MS,
} from "@/components/tool-iframe/state";

describe("tool iframe state helpers", () => {
  it("提供初始加载态", () => {
    expect(createInitialToolIframeState()).toEqual({
      loading: true,
      error: false,
    });
  });

  it("在成功加载后关闭遮罩", () => {
    expect(markToolIframeLoaded()).toEqual({
      loading: false,
      error: false,
    });
  });

  it("在加载失败后切换错误态并暴露统一超时值", () => {
    expect(markToolIframeErrored()).toEqual({
      loading: false,
      error: true,
    });
    expect(TOOL_IFRAME_READY_TIMEOUT_MS).toBe(15_000);
  });
});
