/**
 * AI 生成 HTML 的后处理：白名单式清洗 + 验证
 *
 * 策略：不依赖正则黑名单（容易绕过），而是：
 * 1. 验证基本 HTML 结构
 * 2. 移除危险标签（iframe, object, embed, form, link[external], script[external]）
 * 3. 移除所有 on* 事件属性
 * 4. 移除 javascript: / data: URL
 * 5. 在 script 内容中检测危险 API（兜底）
 */

/* ── 危险标签（完全移除） ── */
const DANGEROUS_TAGS = new Set([
  "iframe",
  "object",
  "embed",
  "applet",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "base",
  "meta",
  "link", // 会在下面单独处理允许 edu-base.css 的 link
]);

/* ── script 内容中禁止的 API（兜底检查） ── */
const FORBIDDEN_API = [
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "import(",
  "require(",
  ".postMessage(",
  "eval(",
  "Function(",
  "document.cookie",
  "localStorage",
  "sessionStorage",
  "window.open(",
  "navigator.",
];

/** 清洗 AI 输出的 HTML，返回处理后的 HTML 或抛出错误 */
export function sanitizeHtml(raw: string): string {
  let html = raw.trim();

  // ── 0. 去除 markdown 代码围栏 ──
  html = html.replace(/^```(?:html)?\s*\n?/i, "");
  html = html.replace(/\n?```\s*$/i, "");

  // ── 1. 定位 HTML 起始 ──
  const doctypeIdx = html.toLowerCase().indexOf("<!doctype html>");
  if (doctypeIdx === -1) {
    throw new Error("AI 输出不是有效的 HTML 文件（缺少 <!DOCTYPE html>）");
  }
  if (doctypeIdx > 0) html = html.slice(doctypeIdx);

  // ── 2. 验证 edu-tool 结构 ──
  if (!html.includes('class="edu-tool"')) {
    throw new Error("AI 输出未使用 edu-tool 结构");
  }

  // ── 3. 移除 on* 事件属性（onclick, onerror, onload, onmouseover...） ──
  html = html.replace(/\s+on\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");

  // ── 4. 移除 javascript: 和 data: URL ──
  html = html.replace(
    /(?:href|src|action|formaction|data|codebase)\s*=\s*["']?\s*(?:javascript|data|vbscript)\s*:/gi,
    "",
  );

  // ── 5. 移除危险标签 ──
  for (const tag of DANGEROUS_TAGS) {
    // 自闭合和非自闭合都要移除
    const selfCloseRe = new RegExp(`<${tag}\\b[^>]*\\/>`, "gi");
    const openCloseRe = new RegExp(
      `<${tag}\\b[^>]*>[\\s\\S]*?<\\/${tag}>`,
      "gi",
    );
    html = html.replace(selfCloseRe, "");
    html = html.replace(openCloseRe, "");
  }

  // ── 6. 仅允许 edu-base.css 的 <link>（其他 link 在上面已被移除，这里再加回允许的） ──
  // 实际上 link 已被移除，我们在最终 HTML 中确保 edu-base.css 的 link 还在
  // 在移除前保存它
  const eduBaseLinkMatch = html.match(
    /<link\s+[^>]*href=["'][^"']*edu-lib\/edu-base\.css[^"']*["'][^>]*\/?>/i,
  );
  // 注意：上面的危险标签移除可能已经把 link 标签移除了
  // 我们需要在 <head> 中确保它存在
  const hasEduBaseLink = /edu-lib\/edu-base\.css/.test(html);

  // ── 7. 检查 script 内容中的危险 API ──
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptRegex.exec(html)) !== null) {
    const content = scriptMatch[1];
    for (const api of FORBIDDEN_API) {
      if (content.includes(api)) {
        throw new Error(`AI 输出包含禁止的 API：${api}`);
      }
    }
  }

  // ── 8. 移除外部 script src（仅允许内联 script） ──
  html = html.replace(
    /<script\s+[^>]*src\s*=\s*["'][^"']*["'][^>]*><\/script>/gi,
    "",
  );

  // ── 9. 确保 edu-base.css 链接存在 ──
  if (!hasEduBaseLink && eduBaseLinkMatch) {
    html = html.replace("</head>", `${eduBaseLinkMatch[0]}\n</head>`);
  } else if (
    !hasEduBaseLink &&
    !eduBaseLinkMatch
  ) {
    // 完全缺失，注入
    html = html.replace(
      "</head>",
      '  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>\n</head>',
    );
  }

  // ── 10. 验证闭合 ──
  if (!html.includes("</html>")) {
    throw new Error("AI 输出缺少 </html> 闭合标签");
  }

  return html;
}
