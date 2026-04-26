import { grades, subjects } from "@/data/curriculum";

const VALID_GRADES = new Set(grades.map((grade) => grade.id));
const VALID_SUBJECTS = new Set(subjects.map((subject) => subject.id));

export interface GenerateRequestBody {
  grade?: string;
  subject?: string;
  description?: string;
}

export async function readGenerateRequestBody(
  request: Request,
): Promise<Partial<GenerateRequestBody> | Response> {
  try {
    const rawBody = await request.text();

    if (rawBody.length > 10_000) {
      return jsonError("请求体过大", 413);
    }

    return JSON.parse(rawBody) as Partial<GenerateRequestBody>;
  } catch {
    return jsonError("请求格式错误", 400);
  }
}

export function validateGenerateRequestBody(
  body: Partial<GenerateRequestBody>,
): Response | null {
  if (!body.description?.trim()) {
    return jsonError("请填写需求描述", 400);
  }

  if (body.description.trim().length < 8) {
    return jsonError("需求描述请至少写 8 个字，便于生成可用教具", 400);
  }

  if (body.description.length > 800) {
    return jsonError("需求描述过长（最多 800 字）", 400);
  }

  if (body.grade && !VALID_GRADES.has(body.grade)) {
    return jsonError("无效的年级", 400);
  }

  if (body.subject && !VALID_SUBJECTS.has(body.subject)) {
    return jsonError("无效的学科", 400);
  }

  return null;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}
