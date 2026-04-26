import { describe, expect, it } from "vitest";
import { getAgentMessageDisplayInfo } from "@/components/agent/message-list";

describe("agent message list helpers", () => {
  it("为处理中阶段生成 badge 文案和 class", () => {
    expect(
      getAgentMessageDisplayInfo({
        content: "第一行\n第二行",
        stage: "planning",
      }),
    ).toEqual({
      contentLines: ["第一行", "第二行"],
      showStageBadge: true,
      stageClassName: "stage-planning",
      stageLabel: "规划教具",
    });
  });

  it("对 done 和 error 隐藏 badge，并保留未知阶段文案回退", () => {
    expect(
      getAgentMessageDisplayInfo({
        content: "完成",
        stage: "done",
      }),
    ).toEqual({
      contentLines: ["完成"],
      showStageBadge: false,
      stageClassName: null,
      stageLabel: null,
    });

    expect(
      getAgentMessageDisplayInfo({
        content: "自定义阶段",
        stage: "custom-stage",
      }),
    ).toEqual({
      contentLines: ["自定义阶段"],
      showStageBadge: true,
      stageClassName: "stage-custom-stage",
      stageLabel: "custom-stage",
    });
  });
});
