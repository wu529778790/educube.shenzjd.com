import { NextResponse } from "next/server";
import { generateToolHtml } from "@/lib/ai-client";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { saveGeneratedTool } from "@/data/generated-tools";
import { buildSystemPrompt, buildUserPrompt } from "@/data/prompt-template";

/* 简易 IP 限流：5 次/小时 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 小时

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

interface GenerateRequest {
  name: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  gradient: [string, string];
  icon: string;
}

export async function POST(request: Request): Promise<Response> {
  // 1. 限流
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "生成次数已达上限，请一小时后再试" },
      { status: 429 },
    );
  }

  // 2. 解析和验证输入
  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const { name, grade, subject, chapter, description, gradient, icon } = body;

  if (!name || !description) {
    return NextResponse.json(
      { error: "请填写教具名称和功能描述" },
      { status: 400 },
    );
  }
  if (name.length > 50 || description.length > 500) {
    return NextResponse.json({ error: "输入内容过长" }, { status: 400 });
  }

  // 3. 构建提示词并调用 AI
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    name,
    grade,
    subject,
    chapter,
    description,
  });

  let html: string;
  try {
    const raw = await generateToolHtml(systemPrompt, userPrompt);
    html = sanitizeHtml(raw);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI 服务暂时不可用";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // 4. 生成唯一 ID 并保存
  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tool = await saveGeneratedTool(id, html, {
    name,
    grade,
    subject,
    chapter,
    description,
    gradient: gradient || ["#3B82F6", "#2563EB"],
    icon: icon || "📐",
  });

  return NextResponse.json({ tool, html });
}
