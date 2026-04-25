import { describe, expect, it } from "vitest";
import {
  detectAgentIntent,
  quickReviewGeneratedTool,
} from "@/lib/agent/analysis";

describe("detectAgentIntent", () => {
  it("在已有教具时识别修改意图", () => {
    expect(
      detectAgentIntent("把颜色改成蓝色", { hasCurrentHtml: true }),
    ).toBe("modify");
  });

  it("在已有教具时识别审查意图", () => {
    expect(
      detectAgentIntent("帮我检查一下有没有问题", { hasCurrentHtml: true }),
    ).toBe("review");
  });

  it("在没有现有教具时默认走创建", () => {
    expect(
      detectAgentIntent("帮我检查一下有没有问题", { hasCurrentHtml: false }),
    ).toBe("create");
  });
});

describe("quickReviewGeneratedTool", () => {
  it("对结构完整的教具给出较高评分", () => {
    const result = quickReviewGeneratedTool(`
      <div class="edu-tool">
        <div class="edu-toolbar"></div>
        <canvas></canvas>
        <script>
          function resetAll() {}
          EduRender.run({});
        </script>
        <div class="info-box">知识点</div>
        <input type="range" />
        <input type="range" />
        <input type="range" />
        <p>中文说明</p>
      </div>
    `);

    expect(result.score).toBe(100);
    expect(result.summary).toContain("使用了组件框架渲染");
    expect(result.summary).toContain("包含 3 个交互滑块");
  });

  it("对缺失基础结构的教具指出问题", () => {
    const result = quickReviewGeneratedTool("<div>plain html</div>");

    expect(result.score).toBeLessThan(60);
    expect(result.summary).toContain("缺少 .edu-tool 容器");
    expect(result.summary).toContain("缺少工具栏");
    expect(result.summary).toContain("缺少可视化内容");
    expect(result.summary).toContain("缺少中文界面文字");
  });
});
