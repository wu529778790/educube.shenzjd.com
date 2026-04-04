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

/* ── script 内容安全 API 白名单（预留，用于未来更精细的静态分析） ── */

/**
 * 验证 script 内容是否安全。
 * 采用正则启发式检测：拦截已知的危险 API 调用模式，包括字符串拼接绕过。
 */
function validateScriptContent(content: string): void {
  const DANGEROUS_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
    { pattern: /\bfetch\s*\(/, label: "fetch()" },
    { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
    { pattern: /\bWebSocket\b/, label: "WebSocket" },
    { pattern: /\beval\s*\(/, label: "eval()" },
    { pattern: /\bnew\s+Function\s*\(/, label: "new Function()" },
    { pattern: /\bimport\s*\(/, label: "import()" },
    { pattern: /\brequire\s*\(/, label: "require()" },
    { pattern: /\.postMessage\s*\(/, label: "postMessage()" },
    { pattern: /\bdocument\.cookie\b/, label: "document.cookie" },
    { pattern: /\blocalStorage\b/, label: "localStorage" },
    { pattern: /\bsessionStorage\b/, label: "sessionStorage" },
    { pattern: /\bwindow\.open\s*\(/, label: "window.open()" },
    { pattern: /\bnavigator\b/, label: "navigator" },
    { pattern: /\bimportScripts\s*\(/, label: "importScripts()" },
    { pattern: /\bWorker\b/, label: "Worker" },
    { pattern: /\bSharedWorker\b/, label: "SharedWorker" },
    { pattern: /\bServiceWorker\b/, label: "ServiceWorker" },
    // 检测字符串拼接绕过尝试：window['fetch'], obj["eval"] 等
    { pattern: /\[[\s"']*["'](?:fetch|eval|Function|import|require|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|navigator)["'][\s"']*\]/, label: "动态属性访问（绕过检测）" },
    // 检测全局对象动态属性访问：window['...'], self["..."]
    { pattern: /(?:window|self|globalThis)\s*\[\s*["']/, label: "全局对象动态属性访问" },
    // 检测 atob/btoa 可能用于编码绕过
    { pattern: /\batob\s*\(/, label: "atob()" },
    { pattern: /\bbtoa\s*\(/, label: "btoa()" },
  ];

  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(content)) {
      throw new Error(`AI 输出包含禁止的 API：${label}`);
    }
  }
}

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

  // ── 6. 验证 script 内容安全性（白名单 + 正则启发式） ──
  const scriptContentRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptContentRe.exec(html)) !== null) {
    validateScriptContent(match[1]);
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
