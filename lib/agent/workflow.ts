import {
  buildRefineUserPrompt,
  parseRefinedSpecOutput,
} from "@/data/prompt-template";
import {
  buildSpecSystemPrompt,
  buildSpecUserPrompt,
  parseSpecOutput,
  wrapSpecAsHtml,
} from "@/data/spec-prompt";
import { generateChatText } from "@/lib/ai-client";
import {
  buildCreateFallbackHtmlPrompt,
  buildEditPrompt,
  buildEditSpecPrompt,
  buildFallbackSystemPrompt,
  EDIT_SPEC_SYSTEM_PROMPT,
  EDIT_SYSTEM_PROMPT,
  REFINE_SYSTEM_AGENT,
} from "@/lib/agent/prompting";
import { validateSpecRuntime } from "@/lib/agent/spec-runtime";
import type { AgentMessage } from "@/lib/agent/types";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { logger } from "@/lib/logger";
import { AI_MAX_TOKENS } from "@/lib/runtime-config";

const RECENT_MESSAGE_LIMIT = 6;

export interface AgentCreateInput {
  userInput: string;
  gradeLabel: string;
  subjectLabel: string;
}

export interface AgentCreateResult {
  toolName: string;
  html: string;
  spec: Record<string, unknown> | null;
  mode: "spec" | "html";
}

export interface AgentModifyInput {
  userInput: string;
  currentHtml: string;
  currentSpec: Record<string, unknown> | null;
  messages: AgentMessage[];
}

export interface AgentModifyResult {
  html: string;
  spec: Record<string, unknown> | null;
  mode: "spec" | "html";
}

export async function createAgentTool(
  input: AgentCreateInput,
): Promise<AgentCreateResult> {
  const refinedSpec = await refineUserIntent(input);

  logger.debug("Agent 开始生成 spec", {
    toolName: refinedSpec.name,
  });

  const specResult = await generateChatText(
    buildSpecSystemPrompt(),
    buildSpecUserPrompt({
      name: refinedSpec.name,
      gradeLabel: input.gradeLabel,
      subjectLabel: input.subjectLabel,
      chapter: "",
      description: refinedSpec.spec,
    }),
    {
      maxTokens: AI_MAX_TOKENS,
      temperature: 0.3,
    },
  );

  logger.debug("Agent spec 生成完成", {
    toolName: refinedSpec.name,
    length: specResult.length,
  });

  const { spec, valid } = parseSpecOutput(specResult);

  if (valid && spec.title) {
    validateSpecRuntime(spec);
    return {
      toolName: refinedSpec.name,
      html: wrapSpecAsHtml(JSON.stringify(spec, null, 2)),
      spec,
      mode: "spec",
    };
  }

  const rawHtml = await generateChatText(
    buildFallbackSystemPrompt(),
    buildCreateFallbackHtmlPrompt({
      name: refinedSpec.name,
      gradeLabel: input.gradeLabel,
      subjectLabel: input.subjectLabel,
      refinedSpec: refinedSpec.spec,
    }),
    {
      maxTokens: AI_MAX_TOKENS,
      temperature: 0.3,
    },
  );

  return {
    toolName: refinedSpec.name,
    html: sanitizeHtml(rawHtml, {
      preserveInlineEventHandlers: true,
    }),
    spec: null,
    mode: "html",
  };
}

export async function modifyAgentTool(
  input: AgentModifyInput,
): Promise<AgentModifyResult> {
  const recentMessages = input.messages.slice(-RECENT_MESSAGE_LIMIT);

  if (input.currentSpec) {
    const modifiedSpecResult = await generateChatText(
      EDIT_SPEC_SYSTEM_PROMPT,
      buildEditSpecPrompt(
        JSON.stringify(input.currentSpec, null, 2),
        input.userInput,
        recentMessages,
      ),
      {
        maxTokens: AI_MAX_TOKENS,
        temperature: 0.2,
      },
    );

    const { spec, valid } = parseSpecOutput(modifiedSpecResult);

    if (valid && spec.title) {
      validateSpecRuntime(spec);
      return {
        html: wrapSpecAsHtml(JSON.stringify(spec, null, 2)),
        spec,
        mode: "spec",
      };
    }
  }

  const modifiedHtml = await generateChatText(
    EDIT_SYSTEM_PROMPT,
    buildEditPrompt(input.currentHtml, input.userInput, recentMessages),
    {
      maxTokens: AI_MAX_TOKENS,
      temperature: 0.2,
    },
  );

  return {
    html: sanitizeHtml(modifiedHtml, {
      preserveInlineEventHandlers: true,
    }),
    spec: null,
    mode: "html",
  };
}

async function refineUserIntent(
  input: AgentCreateInput,
): Promise<{ name: string; spec: string }> {
  try {
    const refineResult = await generateChatText(
      REFINE_SYSTEM_AGENT,
      buildRefineUserPrompt({
        gradeLabel: input.gradeLabel,
        subjectLabel: input.subjectLabel,
        userIntent: input.userInput,
      }),
      { maxTokens: 2048, temperature: 0.2 },
    );
    return parseRefinedSpecOutput(refineResult, input.userInput);
  } catch (error) {
    logger.warn("Agent 需求整理失败，回退到原始输入", {
      message: error instanceof Error ? error.message : "未知错误",
    });
    return {
      name: input.userInput.slice(0, 18),
      spec: input.userInput,
    };
  }
}
