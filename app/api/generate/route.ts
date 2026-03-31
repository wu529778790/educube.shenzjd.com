import { NextResponse } from "next/server";
import { generateToolHtml, generateRefinedSpec } from "@/lib/ai-client";
import { sanitizeHtml } from "@/lib/html-sanitizer";
import { saveGeneratedTool } from "@/data/generated-tools";
import {
  REFINE_SYSTEM,
  buildRefineUserPrompt,
  buildSystemPrompt,
  buildUserPrompt,
  parseRefinedSpecOutput,
} from "@/data/prompt-template";
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
 * 输入校验（仅年级、学科、口语化需求）
 * ================================================================ */
const VALID_GRADES = new Set(grades.map((g) => g.id));
const VALID_SUBJECTS = new Set(subjects.map((s) => s.id));

interface GenerateRequest {
  grade: string;
  subject: string;
  /** 用户对教具的口语描述，将先经 AI 整理再生成 HTML */
  description: string;
}

const DEFAULT_GRADIENT: [string, string] = ["#3B82F6", "#2563EB"];
const DEFAULT_ICON = "📐";
const DEFAULT_CHAPTER = "综合实践";

function validateInput(body: Partial<GenerateRequest>): string | null {
  if (!body.description?.trim()) return "请填写需求描述";
  if (body.description.trim().length < 8)
    return "需求描述请至少写 8 个字，便于生成可用教具";
  if (body.description.length > 800) return "需求描述过长（最多 800 字）";
  if (body.grade && !VALID_GRADES.has(body.grade))
    return `无效的年级 ID: ${body.grade}`;
  if (body.subject && !VALID_SUBJECTS.has(body.subject))
    return `无效的学科 ID: ${body.subject}`;
  return null;
}

/* ================================================================
 * POST /api/generate
 * ================================================================ */
export async function POST(request: Request): Promise<Response> {
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

  let body: Partial<GenerateRequest>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const validationError = validateInput(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const gradeId = body.grade || "p5";
  const subjectId = body.subject || "math";
  const userIntent = body.description!.trim();

  const gradeLabel = grades.find((g) => g.id === gradeId)?.name ?? gradeId;
  const subjectLabel =
    subjects.find((s) => s.id === subjectId)?.name ?? subjectId;

  let refinedRaw: string;
  try {
    refinedRaw = await generateRefinedSpec(
      REFINE_SYSTEM,
      buildRefineUserPrompt({
        gradeLabel,
        subjectLabel,
        userIntent,
      }),
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI 服务暂时不可用";
    return NextResponse.json(
      { error: `整理需求失败：${message}` },
      { status: 502 },
    );
  }

  const { name, spec } = parseRefinedSpecOutput(refinedRaw, userIntent);

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    name,
    gradeLabel,
    subjectLabel,
    chapter: DEFAULT_CHAPTER,
    description: spec,
  });

  let html: string;
  try {
    const raw = await generateToolHtml(systemPrompt, userPrompt);
    html = sanitizeHtml(raw, { preserveInlineEventHandlers: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "AI 服务暂时不可用";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const id = `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tool = await saveGeneratedTool(id, html, {
    name,
    grade: gradeId,
    subject: subjectId,
    chapter: DEFAULT_CHAPTER,
    description: spec,
    gradient: DEFAULT_GRADIENT,
    icon: DEFAULT_ICON,
  });

  return NextResponse.json({
    tool,
    html,
    refinedName: name,
    refinedSpec: spec,
  });
}
