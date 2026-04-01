/**
 * AI 生成 HTML 的后处理：基于 sanitize-html 的白名单式清洗 + 验证
 *
 * 策略：
 * 1. 前置验证（DOCTYPE、edu-tool 结构）
 * 2. 使用 sanitize-html（基于 htmlparser2 真正的 HTML 解析器）白名单清洗
 * 3. 后置验证（script src 白名单、script 内容危险 API 检测）
 * 4. 确保 edu-base.css 链接存在
 */
import sanitize from "sanitize-html";

/* ── 允许的 script src 路径前缀（仅允许本地 edu-lib 资源） ── */
const ALLOWED_SCRIPT_SRC_PREFIXES = ["../edu-lib/"];

/* ── 允许的 link href（仅允许 edu-base.css） ── */
const ALLOWED_LINK_HREF = "../edu-lib/edu-base.css";

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
  "atob(",
  "importScripts(",
];

/* ── 内联事件属性白名单 ── */
const INLINE_EVENT_ATTRS = [
  "onclick",
  "oninput",
  "onchange",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmouseout",
  "onkeydown",
  "onkeyup",
  "onfocus",
  "onblur",
];

export interface SanitizeHtmlOptions {
  /** 为 true 时不剥离 onclick 等属性（教立方教具依赖内联事件） */
  preserveInlineEventHandlers?: boolean;
}

/**
 * 构建 sanitize-html 的白名单配置
 */
function buildSanitizeConfig(
  preserveInlineEvents: boolean,
): sanitize.IOptions {
  const eventAttrs = preserveInlineEvents ? INLINE_EVENT_ATTRS : [];

  return {
    allowedTags: [
      // 文档结构
      "html",
      "head",
      "body",
      "meta",
      "title",
      "link",
      "style",
      "script",
      // 布局
      "div",
      "span",
      "section",
      "header",
      "footer",
      "main",
      "nav",
      "article",
      // 文本
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "br",
      "hr",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "sub",
      "sup",
      "small",
      "pre",
      "code",
      // 列表
      "ul",
      "ol",
      "li",
      // 表格
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "caption",
      "colgroup",
      "col",
      // 媒体 / Canvas
      "img",
      "canvas",
      // SVG
      "svg",
      "path",
      "circle",
      "rect",
      "line",
      "polygon",
      "polyline",
      "ellipse",
      "g",
      "text",
      "defs",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "clipPath",
      "pattern",
      "filter",
      "feGaussianBlur",
      "feOffset",
      "feMerge",
      "feMergeNode",
      "feColorMatrix",
      // 表单元素（教具需要）
      "input",
      "button",
      "select",
      "option",
      "textarea",
      "label",
      "fieldset",
      "legend",
    ],
    allowedAttributes: {
      "*": ["class", "id", "style", "title", "role", "data-*"],
      html: ["lang"],
      meta: ["charset", "name", "content"],
      link: ["rel", "href", "type"],
      script: ["src"],
      canvas: ["width", "height"],
      img: ["src", "alt", "width", "height"],
      input: [
        "type",
        "min",
        "max",
        "step",
        "value",
        "name",
        "placeholder",
        "disabled",
        "checked",
        ...eventAttrs,
      ],
      button: ["disabled", ...eventAttrs],
      select: ["name", ...eventAttrs],
      option: ["value", "selected"],
      textarea: ["name", "placeholder", "rows", ...eventAttrs],
      div: [...eventAttrs],
      span: [...eventAttrs],
      svg: ["viewBox", "xmlns", "width", "height", "id"],
      path: ["d", "fill", "stroke", "stroke-width", "transform", "id"],
      circle: ["cx", "cy", "r", "fill", "stroke", "stroke-width"],
      rect: [
        "x",
        "y",
        "width",
        "height",
        "fill",
        "stroke",
        "stroke-width",
        "rx",
        "ry",
        "transform",
      ],
      line: ["x1", "y1", "x2", "y2", "stroke", "stroke-width"],
      polygon: ["points", "fill", "stroke"],
      polyline: ["points", "fill", "stroke", "stroke-width"],
      ellipse: ["cx", "cy", "rx", "ry", "fill", "stroke"],
      g: ["transform", "fill", "stroke", "id"],
      text: ["x", "y", "fill", "font-size", "text-anchor", "dominant-baseline"],
      stop: ["offset", "stop-color", "stop-opacity"],
      use: ["href", "x", "y", "width", "height"],
      td: ["colspan", "rowspan"],
      th: ["colspan", "rowspan"],
    },
    allowedSchemes: ["http", "https"],
    // 不允许 sanitize-html 自动过滤 script 内容——我们需要保留它来做后续检查
    // 但要禁止不安全的 selfClosingTags 行为
    disallowedTagsMode: "discard",
  };
}

/** 清洗 AI 输出的 HTML，返回处理后的 HTML 或抛出错误 */
export function sanitizeHtml(
  raw: string,
  options?: SanitizeHtmlOptions,
): string {
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

  // ── 3. 使用 sanitize-html 白名单清洗 ──
  const preserveInlineEvents = options?.preserveInlineEventHandlers ?? false;
  const config = buildSanitizeConfig(preserveInlineEvents);
  html = sanitize(html, config);

  // ── 4. 验证 script src 白名单（仅允许本地 edu-lib 资源） ──
  const scriptSrcRe = /<script\s+[^>]*src\s*=\s*["']([^"']*?)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = scriptSrcRe.exec(html)) !== null) {
    const src = match[1];
    const allowed = ALLOWED_SCRIPT_SRC_PREFIXES.some((prefix) =>
      src.startsWith(prefix),
    );
    if (!allowed) {
      throw new Error(`AI 输出包含不允许的外部脚本引用：${src}`);
    }
  }

  // ── 5. 验证 link href 白名单（仅允许 edu-base.css） ──
  const linkHrefRe = /<link\s+[^>]*href\s*=\s*["']([^"']*?)["'][^>]*>/gi;
  while ((match = linkHrefRe.exec(html)) !== null) {
    const href = match[1];
    if (!href.endsWith("edu-lib/edu-base.css") && !href.endsWith("edu-lib\\edu-base.css")) {
      throw new Error(`AI 输出包含不允许的外部样式引用：${href}`);
    }
  }

  // ── 6. 检查 script 内容中的危险 API（兜底） ──
  const scriptContentRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptContentRe.exec(html)) !== null) {
    const content = match[1];
    for (const api of FORBIDDEN_API) {
      if (content.includes(api)) {
        throw new Error(`AI 输出包含禁止的 API：${api}`);
      }
    }
  }

  // ── 7. 确保 edu-base.css 链接存在 ──
  const hasEduBaseLink = /edu-lib\/edu-base\.css/.test(html);
  if (!hasEduBaseLink) {
    html = html.replace(
      "</head>",
      '  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>\n</head>',
    );
  }

  // ── 8. 验证闭合 ──
  if (!html.includes("</html>")) {
    throw new Error("AI 输出缺少 </html> 闭合标签");
  }

  return html;
}
