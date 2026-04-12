import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

/* AI 调用超时（毫秒），可通过环境变量覆盖 */
const AI_TIMEOUT = parseInt(process.env.AI_TIMEOUT || "120000", 10);

/* 重试配置 */
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY = 1000; // 1 秒

type Provider = "openai" | "anthropic";
const VALID_PROVIDERS = new Set<Provider>(["openai", "anthropic"]);

function getProvider(): Provider {
  const v = process.env.AI_PROVIDER;
  if (v && VALID_PROVIDERS.has(v as Provider)) return v as Provider;
  return "openai";
}

/* 懒初始化单例，避免构建时因缺少 API Key 报错 */
let _openaiClient: OpenAI | null = null;
let _anthropicClient: Anthropic | null = null;

function getOpenAI(): OpenAI {
  if (!_openaiClient) {
    _openaiClient = new OpenAI({
      apiKey: process.env.AI_API_KEY,
      baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
    });
  }
  return _openaiClient;
}

function getAnthropicClient(): Anthropic {
  if (!_anthropicClient) {
    const baseURL = process.env.AI_BASE_URL?.trim();
    _anthropicClient = new Anthropic({
      apiKey: process.env.AI_API_KEY,
      ...(baseURL ? { baseURL } : {}),
    });
  }
  return _anthropicClient;
}

export async function generateToolHtml(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  return generateChatText(systemPrompt, userPrompt, {
    maxTokens: parseInt(process.env.AI_MAX_TOKENS || "16000", 10),
    temperature: 0.3,
  });
}

/** 短文本（如需求整理），默认更少 token、略低温度 */
export async function generateRefinedSpec(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const cap = Math.min(
    4096,
    parseInt(process.env.AI_MAX_TOKENS || "16000", 10),
  );
  return generateChatText(systemPrompt, userPrompt, {
    maxTokens: Math.min(2048, cap),
    temperature: 0.2,
  });
}

interface ChatOptions {
  maxTokens: number;
  temperature: number;
}

export async function generateChatText(
  systemPrompt: string,
  userPrompt: string,
  options: ChatOptions,
): Promise<string> {
  const provider = getProvider();
  if (provider === "anthropic") {
    return callAnthropic(systemPrompt, userPrompt, options);
  }
  return callOpenAI(systemPrompt, userPrompt, options);
}

async function callOpenAI(
  sys: string,
  user: string,
  options: ChatOptions,
): Promise<string> {
  return retryWithBackoff(async () => {
    const res = await getOpenAI().chat.completions.create(
      {
        model: process.env.AI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        max_tokens: options.maxTokens,
        temperature: options.temperature,
      },
      { timeout: AI_TIMEOUT },
    );

    const content = res.choices[0]?.message?.content;
    if (!content) throw new Error("AI 未生成内容（可能被安全过滤或内容为空）");
    return content;
  });
}

async function callAnthropic(
  sys: string,
  user: string,
  options: ChatOptions,
): Promise<string> {
  return retryWithBackoff(async () => {
    const res = await getAnthropicClient().messages.create(
      {
        model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
        max_tokens: options.maxTokens,
        system: sys,
        messages: [{ role: "user", content: user }],
        temperature: options.temperature,
      },
      { timeout: AI_TIMEOUT },
    );

    if (!res.content || res.content.length === 0) {
      throw new Error("AI 未生成内容（可能被安全过滤或内容为空）");
    }
    const block = res.content[0];
    if (block.type === "text") return block.text;
    throw new Error("AI 返回了非文本内容");
  });
}

/**
 * 带指数退避的重试包装器。
 * 仅对 5xx 错误和网络超时重试，4xx 错误直接抛出。
 */
async function retryWithBackoff<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      // 判断是否为可重试错误（5xx、网络超时等）
      const isRetryable = isRetryableError(err);
      if (!isRetryable || attempt === MAX_RETRIES) break;

      const delay = RETRY_BASE_DELAY * Math.pow(2, attempt);
      console.warn(
        `[ai-client] 请求失败 (尝试 ${attempt + 1}/${MAX_RETRIES + 1})，${delay}ms 后重试:`,
        err instanceof Error ? err.message : err,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

function isRetryableError(err: unknown): boolean {
  // OpenAI SDK 结构化错误
  if (err instanceof OpenAI.APIError) {
    const s = err.status;
    if (s === undefined) return true;
    if (s === 429) return true;
    if (s >= 400 && s < 500) return false;
    return s >= 500;
  }
  // Anthropic SDK 结构化错误
  if (err instanceof Anthropic.APIError) {
    const s = err.status;
    if (s === undefined) return true;
    if (s === 429) return true;
    if (s >= 400 && s < 500) return false;
    return s >= 500;
  }
  if (!(err instanceof Error)) return true;

  // 网络超时 / 连接异常
  const msg = err.message.toLowerCase();
  if (msg.includes("timeout") || msg.includes("econnreset") || msg.includes("econnrefused")) return true;
  // 安全过滤，不重试
  if (msg.includes("安全过滤")) return false;

  return true;
}
