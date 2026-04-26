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
import {
  GenerateToolError,
  type GenerateToolInput,
  type GenerateToolLabels,
  type RefinedGenerateTool,
} from "@/lib/generate/types";

const DEFAULT_GRADIENT: [string, string] = ["#3B82F6", "#2563EB"];
const DEFAULT_ICON = "📐";
const DEFAULT_CHAPTER = "综合实践";
const MAX_HTML_SIZE = 1_024 * 1_024;

interface GenerateToolHtmlOptions {
  labels: GenerateToolLabels;
  refined: RefinedGenerateTool;
}

interface SaveGeneratedToolOptions {
  input: GenerateToolInput;
  html: string;
  refined: RefinedGenerateTool;
}

export function resolveGenerateToolLabels(
  input: GenerateToolInput,
): GenerateToolLabels {
  return {
    gradeLabel:
      grades.find((grade) => grade.id === input.gradeId)?.name ?? input.gradeId,
    subjectLabel:
      subjects.find((subject) => subject.id === input.subjectId)?.name ??
      input.subjectId,
  };
}

export async function refineGenerateToolSpec(
  input: GenerateToolInput,
  labels: GenerateToolLabels,
): Promise<RefinedGenerateTool> {
  let refinedRaw: string;

  try {
    refinedRaw = await generateRefinedSpec(
      REFINE_SYSTEM,
      buildRefineUserPrompt({
        gradeLabel: labels.gradeLabel,
        subjectLabel: labels.subjectLabel,
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

  return {
    refinedName: name,
    refinedSpec: spec,
  };
}

export async function generateSanitizedToolHtml({
  labels,
  refined,
}: GenerateToolHtmlOptions): Promise<string> {
  try {
    const rawHtml = await generateToolHtml(
      buildSystemPrompt(),
      buildUserPrompt({
        name: refined.refinedName,
        gradeLabel: labels.gradeLabel,
        subjectLabel: labels.subjectLabel,
        chapter: DEFAULT_CHAPTER,
        description: refined.refinedSpec,
      }),
    );

    if (rawHtml.length > MAX_HTML_SIZE) {
      throw new GenerateToolError(
        "generated html too large",
        "生成的教具过大，请简化需求后重试",
      );
    }

    return sanitizeHtml(rawHtml, { preserveInlineEventHandlers: true });
  } catch (error) {
    if (error instanceof GenerateToolError) {
      throw error;
    }

    throw new GenerateToolError(
      error instanceof Error ? error.message : "generate html failed",
      "生成失败，请稍后重试",
    );
  }
}

export async function saveGeneratedTool({
  input,
  html,
  refined,
}: SaveGeneratedToolOptions): Promise<Awaited<ReturnType<typeof publishGeneratedTool>>> {
  try {
    return await publishGeneratedTool({
      id: `gen-${randomUUID()}`,
      html,
      meta: {
        name: refined.refinedName,
        grade: input.gradeId,
        subject: input.subjectId,
        chapter: DEFAULT_CHAPTER,
        description: refined.refinedSpec,
        gradient: DEFAULT_GRADIENT,
        icon: DEFAULT_ICON,
      },
    });
  } catch (error) {
    throw new GenerateToolError(
      error instanceof Error ? error.message : "save generated tool failed",
      "保存失败，请稍后重试",
    );
  }
}
