import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

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
    _anthropicClient = new Anthropic({
      apiKey: process.env.AI_API_KEY,
    });
  }
  return _anthropicClient;
}

export async function generateToolHtml(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const provider = getProvider();
  if (provider === "anthropic") return callAnthropic(systemPrompt, userPrompt);
  return callOpenAI(systemPrompt, userPrompt);
}

async function callOpenAI(sys: string, user: string): Promise<string> {
  const res = await getOpenAI().chat.completions.create({
    model: process.env.AI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "16000"),
    temperature: 0.3,
  });

  const content = res.choices[0]?.message?.content;
  if (!content) throw new Error("AI 未生成内容（可能被安全过滤或内容为空）");
  return content;
}

async function callAnthropic(sys: string, user: string): Promise<string> {
  const res = await getAnthropicClient().messages.create({
    model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "16000"),
    system: sys,
    messages: [{ role: "user", content: user }],
  });

  if (!res.content || res.content.length === 0) {
    throw new Error("AI 未生成内容（可能被安全过滤或内容为空）");
  }
  const block = res.content[0];
  if (block.type === "text") return block.text;
  throw new Error("AI 返回了非文本内容");
}
