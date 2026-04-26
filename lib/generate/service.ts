import {
  generateSanitizedToolHtml,
  refineGenerateToolSpec,
  resolveGenerateToolLabels,
  saveGeneratedTool,
} from "@/lib/generate/pipeline";
import type {
  GenerateToolCallbacks,
  GenerateToolInput,
  GenerateToolResult,
} from "@/lib/generate/types";
export { GenerateToolError } from "@/lib/generate/types";
export type {
  GenerateToolCallbacks,
  GenerateToolInput,
  GenerateToolRefinedEvent,
  GenerateToolResult,
  GenerateToolStageEvent,
} from "@/lib/generate/types";

export async function generateAndPublishTool(
  input: GenerateToolInput,
  callbacks: GenerateToolCallbacks = {},
): Promise<GenerateToolResult> {
  const labels = resolveGenerateToolLabels(input);

  callbacks.onStage?.({
    stage: "refining",
    message: "正在分析需求并整理规格说明…",
  });

  const refined = await refineGenerateToolSpec(input, labels);
  callbacks.onRefined?.({
    refinedName: refined.refinedName,
    refinedSpec: refined.refinedSpec,
  });

  callbacks.onStage?.({
    stage: "generating",
    message: "正在生成交互式教具页面…",
  });

  const html = await generateSanitizedToolHtml({
    labels,
    refined,
  });

  callbacks.onStage?.({
    stage: "saving",
    message: "正在保存教具…",
  });

  const tool = await saveGeneratedTool({
    input,
    html,
    refined,
  });

  return {
    tool,
    html,
    refinedName: refined.refinedName,
    refinedSpec: refined.refinedSpec,
  };
}
