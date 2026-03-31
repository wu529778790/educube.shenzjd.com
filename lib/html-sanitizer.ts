/**
 * AI 生成 HTML 的后处理：清洗 + 验证
 */

/** 禁止出现在 <script> 中的关键字（防止网络请求） */
const FORBIDDEN_SCRIPT_PATTERNS = [
  /\bfetch\s*\(/,
  /\bXMLHttpRequest\b/,
  /\bWebSocket\b/,
  /\bimport\s*\(/,
  /\brequire\s*\(/,
  /\.onmessage\b/,
  /\beval\s*\(/,
  /\bFunction\s*\(/,
];

/** 清洗 AI 输出的 HTML，返回处理后的 HTML 或抛出错误 */
export function sanitizeHtml(raw: string): string {
  let html = raw.trim();

  // 1. 去除 markdown 代码围栏
  html = html.replace(/^```(?:html)?\s*\n?/i, "");
  html = html.replace(/\n?```\s*$/i, "");

  // 2. 验证基本结构
  if (!html.startsWith("<!DOCTYPE html>") && !html.startsWith("<!doctype html>")) {
    // 尝试找到 HTML 起始位置
    const idx = html.toLowerCase().indexOf("<!doctype html>");
    if (idx !== -1) {
      html = html.slice(idx);
    } else {
      throw new Error("AI 输出不是有效的 HTML 文件（缺少 <!DOCTYPE html>）");
    }
  }

  // 3. 验证 edu-tool 结构
  if (!html.includes('class="edu-tool"')) {
    throw new Error("AI 输出未使用 edu-tool 结构");
  }

  // 4. 检查禁止的脚本模式
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptRegex.exec(html)) !== null) {
    const scriptContent = match[1];
    for (const pattern of FORBIDDEN_SCRIPT_PATTERNS) {
      if (pattern.test(scriptContent)) {
        throw new Error(`AI 输出包含禁止的代码模式：${pattern.source}`);
      }
    }
  }

  // 5. 移除外部引用（仅允许 edu-base.css）
  html = html.replace(
    /<link\s+[^>]*href=["'](?!.*edu-lib\/edu-base\.css)[^"']*["'][^>]*\/?>/gi,
    "",
  );
  html = html.replace(
    /<script\s+[^>]*src=["'](?!.*edu-lib\/)[^"']*["'][^>]*><\/script>/gi,
    "",
  );

  // 6. 验证闭合
  if (!html.includes("</html>")) {
    throw new Error("AI 输出缺少 </html> 闭合标签");
  }

  return html;
}
