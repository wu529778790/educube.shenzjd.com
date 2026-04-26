import type { publishGeneratedTool } from "@/lib/generated-tools/publish-generated-tool";

export interface GenerateToolInput {
  gradeId: string;
  subjectId: string;
  userIntent: string;
}

export interface GenerateToolStageEvent {
  stage: "refining" | "generating" | "saving";
  message: string;
}

export interface GenerateToolRefinedEvent {
  refinedName: string;
  refinedSpec: string;
}

export interface GenerateToolCallbacks {
  onStage?: (event: GenerateToolStageEvent) => void;
  onRefined?: (event: GenerateToolRefinedEvent) => void;
}

export interface GenerateToolResult {
  tool: Awaited<ReturnType<typeof publishGeneratedTool>>;
  html: string;
  refinedName: string;
  refinedSpec: string;
}

export interface GenerateToolLabels {
  gradeLabel: string;
  subjectLabel: string;
}

export interface RefinedGenerateTool {
  refinedName: string;
  refinedSpec: string;
}

export class GenerateToolError extends Error {
  public readonly userMessage: string;

  public constructor(message: string, userMessage: string) {
    super(message);
    this.name = "GenerateToolError";
    this.userMessage = userMessage;
  }
}
