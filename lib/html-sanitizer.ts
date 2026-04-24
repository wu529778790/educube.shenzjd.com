/**
 * AI 生成 HTML 的后处理：基于 sanitize-html 的白名单式清洗 + 验证
 *
 * 策略：
 * 1. 前置验证（DOCTYPE、edu-tool 结构）
 * 2. 使用 sanitize-html（基于 htmlparser2 真正的 HTML 解析器）白名单清洗
 * 3. 后置验证（script src 白名单、script 内容危险 API 检测）
 * 4. 确保 edu-base.css 链接存在
 *
 * 注意：正则检测是纵深防御的一层，不是安全边界。
 * 线上教具壳与生成页预览都使用仅脚本沙箱（不授予 same-origin）
 * 以及为生成的 HTML 文件设置的 CSP sandbox 头。
 */
import sanitize from "sanitize-html";

/* ── 允许的 script src 路径前缀（仅允许本地 edu-lib 资源） ── */
const ALLOWED_SCRIPT_SRC_PREFIXES = [
  "/edu-lib/",
  "../edu-lib/",
  "../../edu-lib/",
];

/**
 * 验证 script 内容是否安全。
 * 采用正则启发式检测：拦截已知的危险 API 调用模式。
 * 这不是完美的安全边界（JS 有无穷种编码方式），而是最佳努力过滤。
 * 真正的安全边界是 iframe sandbox + CSP sandbox 头。
 */
export function validateGeneratedJavaScript(content: string): void {
  // 先去除注释，防止注释混淆绕过：eval/*comment*/(payload)
  const stripped = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

  const DANGEROUS_PATTERNS: ReadonlyArray<{ pattern: RegExp; label: string }> = [
    // 网络请求
    { pattern: /\bfetch\s*\(/, label: "fetch()" },
    { pattern: /\bXMLHttpRequest\b/, label: "XMLHttpRequest" },
    { pattern: /\bWebSocket\b/, label: "WebSocket" },

    // 动态代码执行
    { pattern: /\beval\s*\(/, label: "eval()" },
    { pattern: /\bnew\s+Function\s*\(/, label: "new Function()" },
    { pattern: /\bimport\s*\(/, label: "import()" },
    { pattern: /\brequire\s*\(/, label: "require()" },

    // 消息与窗口
    { pattern: /\.postMessage\s*\(/, label: "postMessage()" },
    { pattern: /\bwindow\.open\s*\(/, label: "window.open()" },

    // 存储
    { pattern: /\bdocument\.cookie\b/, label: "document.cookie" },
    { pattern: /\blocalStorage\b/, label: "localStorage" },
    { pattern: /\bsessionStorage\b/, label: "sessionStorage" },

    // 浏览器 API
    { pattern: /\bnavigator\b/, label: "navigator" },

    // Web Workers
    { pattern: /\bimportScripts\s*\(/, label: "importScripts()" },
    { pattern: /\bWorker\b/, label: "Worker" },
    { pattern: /\bSharedWorker\b/, label: "SharedWorker" },
    { pattern: /\bServiceWorker\b/, label: "ServiceWorker" },

    // setTimeout/setInterval 字符串参数（经典代码执行向量）
    { pattern: /\bsetTimeout\s*\(\s*["']/, label: "setTimeout(string)" },
    { pattern: /\bsetInterval\s*\(\s*["']/, label: "setInterval(string)" },

    // Reflect.apply 间接调用
    { pattern: /\bReflect\.apply\s*\(/, label: "Reflect.apply()" },

    // 检测字符串拼接绕过尝试：window['fetch'], obj["eval"] 等
    { pattern: /\[[\s"']*["'](?:fetch|eval|Function|import|require|XMLHttpRequest|localStorage|sessionStorage|document\.cookie|navigator)["'][\s"']*\]/, label: "动态属性访问（绕过检测）" },

    // 检测全局对象动态属性访问：window['...'], self["..."], globalThis['...']
    { pattern: /(?:window|self|globalThis)\s*\[\s*["']/, label: "全局对象动态属性访问" },

    // 检测间接调用：(0, eval)(payload)
    { pattern: /\(\s*\d+\s*,\s*(?:eval|Function|fetch)\s*\)/, label: "间接调用绕过" },

    // 编码绕过
    { pattern: /\batob\s*\(/, label: "atob()" },
    { pattern: /\bbtoa\s*\(/, label: "btoa()" },
    { pattern: /\bString\.fromCharCode\b/, label: "String.fromCharCode()" },

    // 字符串拼接绕过：`fetch` → window[`fet`+`ch`]、模板字面量拼接
    { pattern: /[`']\s*\+\s*[`']/, label: "字符串拼接绕过" },
    // 模板字面量内插值绕过：window[`fet${x}ch`]
    { pattern: /[`'][^`']*\$\{[^}]*\}[^`']*[`']/, label: "模板字面量注入" },

    // 十六进制/Unicode 转义绕过：\x66\x65\x74\x63\x68 = fetch
    { pattern: /\\x[0-9a-fA-F]{2}.*\\x[0-9a-fA-F]{2}/, label: "十六进制转义绕过" },
    { pattern: /\\u[0-9a-fA-F]{4}.*\\u[0-9a-fA-F]{4}/, label: "Unicode 转义绕过" },

    // DOM 操作
    { pattern: /\bdocument\.write\s*\(/, label: "document.write()" },
    { pattern: /\blocation\s*(?:\.href\s*)?=/, label: "location 赋值" },

    // 高级绕过
    { pattern: /\bWebAssembly\b/, label: "WebAssembly" },
    { pattern: /\bnew\s+Proxy\s*\(/, label: "Proxy()" },

    // 原型链污染
    { pattern: /__proto__/, label: "__proto__" },
    { pattern: /\.constructor\s*\[/, label: "constructor 括号访问" },
    { pattern: /\.constructor\s*\.\s*constructor/, label: "constructor.constructor 绕过" },
    { pattern: /Object\.defineProperty\s*\(/, label: "Object.defineProperty()" },

    // 动态创建 script 元素
    { pattern: /createElement\s*\(\s*["']script["']\s*\)/, label: "动态创建 script 元素" },

    // DOM 篡改
    { pattern: /\bMutationObserver\b/, label: "MutationObserver" },

    // with 语句（可改变作用域，用于绕过检测）
    { pattern: /\bwith\s*\(/, label: "with 语句" },

    // 解构别名绕过：const {fetch: f} = window / self / globalThis
    { pattern: /\{\s*(?:fetch|eval|Function|XMLHttpRequest|localStorage|sessionStorage)\s*:/, label: "解构别名绕过" },

    // getter/setter 滥用：{get fetch() { ... }}
    { pattern: /\bget\s+(?:fetch|eval|Function)\s*\(/, label: "getter 滥用" },

    // Generator/Iterator 滥用
    { pattern: /\bGenerator(?:Function)?\b/, label: "Generator" },

    // AsyncFunction 构造器
    { pattern: /\bAsyncFunction\b/, label: "AsyncFunction" },
  ];

  for (const { pattern, label } of DANGEROUS_PATTERNS) {
    if (pattern.test(stripped)) {
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
    // 教具需要 script/style 标签——通过后续正则验证确保内容安全
    allowVulnerableTags: true,
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

  // ── 6. 验证 script 内容安全性 ──
  const scriptContentRe = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  while ((match = scriptContentRe.exec(html)) !== null) {
    validateGeneratedJavaScript(match[1]);
  }

  // ── 7. 验证 style 内容（防止 CSS 注入外泄数据） ──
  const styleContentRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleContentRe.exec(html)) !== null) {
    validateStyleContent(match[1]);
  }

  // ── 8. 确保 edu-base.css 链接存在 ──
  const hasEduBaseLink = /edu-lib\/edu-base\.css/.test(html);
  if (!hasEduBaseLink) {
    html = html.replace(
      "</head>",
      '  <link rel="stylesheet" href="/edu-lib/edu-base.css"/>\n</head>',
    );
  }

  // ── 9. 验证闭合 ──
  if (!html.includes("</html>")) {
    throw new Error("AI 输出缺少 </html> 闭合标签");
  }

  return html;
}

/** 检测 CSS 中的数据外泄向量（url() 指向外部） */
function validateStyleContent(content: string): void {
  // 检测 url() 中引用外部资源
  const urlPattern = /url\s*\(\s*["']?\s*(https?:|\/\/)/gi;
  if (urlPattern.test(content)) {
    throw new Error("AI 输出的 CSS 包含不允许的外部 URL 引用");
  }
}
