import { randomUUID } from "crypto";
import { grades, subjects } from "@/data/curriculum";
import {
  REFINE_SYSTEM,
  buildRefineUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  parseRefinedSpecOutput,
} from "@/data/prompt-template";
import { generateRefinedSpec, generateToolHtml } from "@/lib/ai-client";
import { publishGeneratedTool } from "@/lib/generated-tools/publish-generated-tool";
import { sanitizeHtml } from "@/lib/html-sanitizer";

const DEFAULT_GRADIENT: [string, string] = ["#3B82F6", "#2563EB"];
const DEFAULT_ICON = "📐";
const DEFAULT_CHAPTER = "综合实践";
const MAX_HTML_SIZE = 1_024 * 1024;

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

export class GenerateToolError extends Error {
  public readonly userMessage: string;

  public constructor(message: string, userMessage: string) {
    super(message);
    this.name = "GenerateToolError";
    this.userMessage = userMessage;
  }
}

export async function generateAndPublishTool(
  input: GenerateToolInput,
  callbacks: GenerateToolCallbacks = {},
): Promise<GenerateToolResult> {
  const gradeLabel =
    grades.find((grade) => grade.id === input.gradeId)?.name ?? input.gradeId;
  const subjectLabel =
    subjects.find((subject) => subject.id === input.subjectId)?.name ??
    input.subjectId;

  callbacks.onStage?.({
    stage: "refining",
    message: "正在分析需求并整理规格说明…",
  });

  let refinedRaw: string;
  try {
    refinedRaw = await generateRefinedSpec(
      REFINE_SYSTEM,
      buildRefineUserPrompt({
        gradeLabel,
        subjectLabel,
        userIntent: input.userIntent,
      }),
    );
  } catch (error) {
    throw new GenerateToolError(
      error instanceof Error ? error.message : "refine failed",
      "整理需求失败，请稍后重试",
    );
  }

  const { name, spec } = parseRefinedSpecOutput(refinedRaw, input.userIntent);
  callbacks.onRefined?.({
    refinedName: name,
    refinedSpec: spec,
  });

  callbacks.onStage?.({
    stage: "generating",
    message: "正在生成交互式教具页面…",
  });

  let html: string;
  try {
    const rawHtml = await generateToolHtml(
      buildSystemPrompt(),
      buildUserPrompt({
        name,
        gradeLabel,
        subjectLabel,
        chapter: DEFAULT_CHAPTER,
        description: spec,
      }),
    );

    if (rawHtml.length > MAX_HTML_SIZE) {
      throw new GenerateToolError(
        "generated html too large",
        "生成的教具过大，请简化需求后重试",
      );
    }

    html = sanitizeHtml(rawHtml, { preserveInlineEventHandlers: true });
  } catch (error) {
    if (error instanceof GenerateToolError) {
      throw error;
    }

    throw new GenerateToolError(
      error instanceof Error ? error.message : "generate html failed",
      "生成失败，请稍后重试",
    );
  }

  callbacks.onStage?.({
    stage: "saving",
    message: "正在保存教具…",
  });

  try {
    const tool = await publishGeneratedTool({
      id: `gen-${randomUUID()}`,
      html,
      meta: {
        name,
        grade: input.gradeId,
        subject: input.subjectId,
        chapter: DEFAULT_CHAPTER,
        description: spec,
        gradient: DEFAULT_GRADIENT,
        icon: DEFAULT_ICON,
      },
    });

    return {
      tool,
      html,
      refinedName: name,
      refinedSpec: spec,
    };
  } catch (error) {
    throw new GenerateToolError(
      error instanceof Error ? error.message : "save generated tool failed",
      "保存失败，请稍后重试",
    );
  }
}
