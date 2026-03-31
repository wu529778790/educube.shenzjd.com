import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type Provider = "openai" | "anthropic";

function getProvider(): Provider {
  return (process.env.AI_PROVIDER as Provider) || "openai";
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
  const client = new OpenAI({
    apiKey: process.env.AI_API_KEY,
    baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1",
  });

  const res = await client.chat.completions.create({
    model: process.env.AI_MODEL || "gpt-4o",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "16000"),
    temperature: 0.3,
  });

  return res.choices[0]?.message?.content ?? "";
}

async function callAnthropic(sys: string, user: string): Promise<string> {
  const client = new Anthropic({
    apiKey: process.env.AI_API_KEY,
  });

  const res = await client.messages.create({
    model: process.env.AI_MODEL || "claude-sonnet-4-20250514",
    max_tokens: parseInt(process.env.AI_MAX_TOKENS || "16000"),
    system: sys,
    messages: [{ role: "user", content: user }],
  });

  if (res.content[0].type === "text") return res.content[0].text;
  return "";
}
