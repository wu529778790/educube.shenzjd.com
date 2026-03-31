import { NextResponse } from "next/server";
import { generateToolHtml } from "@/lib/ai-client";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { saveGeneratedTool } from "@/data/generated-tools";
import { buildSystemPrompt, buildUserPrompt } from "@/data/prompt-template";
import { grades, subjects } from "@/data/curriculum";

/* ================================================================
 * IP 限流：5 次/小时，自动清理过期条目
 * ================================================================ */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60 * 60 * 1000; // 1 小时
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 分钟清理一次
let lastCleanup = Date.now();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();

  // 定期清理过期条目，防止 Map 无限增长
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key);
    }
    lastCleanup = now;
  }

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/* ================================================================
 * 输入校验
 * ================================================================ */
const VALID_GRADES = new Set(grades.map((g) => g.id));
const VALID_SUBJECTS = new Set(subjects.map((s) => s.id));
const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

interface GenerateRequest {
  name: string;
  grade: string;
  subject: string;
  chapter: string;
  description: string;
  gradient: [string, string];
  icon: string;
}

function validateInput(body: Partial<GenerateRequest>): string | null {
  if (!body.name?.trim()) return "请填写教具名称";
  if (body.name.length > 50) return "教具名称过长（最多 50 字）";
  if (!body.description?.trim()) return "请填写功能描述";
  if (body.description.length > 500) return "功能描述过长（最多 500 字）";
  if (body.grade && !VALID_GRADES.has(body.grade))
    return `无效的年级 ID: ${body.grade}`;
  if (body.subject && !VALID_SUBJECTS.has(body.subject))
    return `无效的学科 ID: ${body.subject}`;
  if (body.chapter && body.chapter.length > 30)
    return "章节名称过长（最多 30 字）";
  if (body.gradient) {
    if (
      !Array.isArray(body.gradient) ||
      body.gradient.length !== 2 ||
      !HEX_COLOR_RE.test(body.gradient[0]) ||
      !HEX_COLOR_RE.test(body.gradient[1])
    )
      return "配色格式无效";
  }
  if (body.icon && body.icon.length > 4) return "图标无效";
  return null;
}

/* ================================================================
 * POST /api/generate
 * ================================================================ */
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

  // 2. 解析输入
  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  // 3. 校验
  const validationError = validateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const { name, grade, subject, chapter, description, gradient, icon } = body;

  // 4. 构建提示词并调用 AI
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    name: name!.trim(),
    grade: grade || "p5",
    subject: subject || "math",
    chapter: chapter?.trim() || "自定义",
    description: description!.trim(),
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

  // 5. 生成唯一 ID 并保存
  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tool = await saveGeneratedTool(id, html, {
    name: name!.trim(),
    grade: grade || "p5",
    subject: subject || "math",
    chapter: chapter?.trim() || "自定义",
    description: description!.trim(),
    gradient: gradient || ["#3B82F6", "#2563EB"],
    icon: icon || "📐",
  });

  return NextResponse.json({ tool, html });
}
