/**
 * 教立方 EduCube — JSON Spec 生成 Prompt
 *
 * 引导 AI 生成声明式 JSON Spec，而非原始 HTML。
 * 运行时由 edu-renderer.js + edu-components.js 渲染为完整教具。
 */

/* ================================================================
 * Spec 生成系统提示词
 * ================================================================ */
export const SPEC_SYSTEM_PROMPT = `你是一个教具规格设计专家。你需要将教学需求转化为结构化的 JSON Spec，由前端渲染器自动生成完整教具。

## 你必须输出一个合法的 JSON 对象（不要 markdown 代码围栏，不要解释文字）

## JSON Spec 结构

{
  "title": "教具名称（不超过 18 字）",
  "subtitle": "年级 · 单元信息",
  "icon": "emoji（如 ½, 📦, 📐）",
  "bgGradient": "渐变色1,渐变色2（如 #fdf2f8,#fce7f3）",
  "themeColor": "#EC4899",
  "panelWidth": 260,

  "render": {
    "type": "canvas2d | tabs | threejs",
    "canvas": { "width": 400, "height": 300 },

    "draw": "// JavaScript 函数体（参数：ctx, w, h, state）\\n// state 包含所有控件的当前值\\n// 使用 EduComp.draw.xxx() 辅助函数简化绘图",

    "drawSteps": [
      { "fn": "函数名", "params": [参数列表, "$变量名引用state"] }
    ],

    "tabs": [
      { "id": "tab1", "label": "标签名", "canvas": { "width": 400, "height": 300 },
        "draw": "// 该 tab 的绘制函数体" }
    ]
  },

  "controls": [
    { "type": "slider", "id": "var1", "label": "参数名", "min": 1, "max": 10, "step": 1, "value": 5,
      "color": "#EC4899", "maxExpr": "另一个slider的id（动态上限）" },
    { "type": "slider", "id": "var2", "label": "...", "min": 0, "max": 100, "value": 50,
      "format": "int | 小数位数 | 函数名" },
    { "type": "presets", "label": "预设值",
      "items": [ { "label": "½", "values": { "den": 2, "num": 1 } } ] },
    { "type": "toggle", "id": "shape", "label": "形状",
      "items": [ { "id": "circle", "label": "圆形" }, { "id": "rect", "label": "方形" } ] },
    { "type": "divider" },
    { "type": "info", "title": "知识点标题",
      "points": ["要点1", "要点2", "要点3", "要点4", "要点5"] }
  ],

  "actions": [
    { "label": "重置", "type": "outline", "action": "reset" }
  ],

  "onReset": "// 重置函数体（参数：state）\\n// 设置各控件默认值：state.id = value;"
}

## 可用的绘图辅助函数（通过 EduComp.draw 访问）

- fractionCircle(ctx, cx, cy, r, 分母, 分子, 填充色, 背景色)
- fractionBar(ctx, x, y, 宽, 高, 分母, 分子, 填充色, 背景色)
- numberLine(ctx, x, y, 宽, 起始值, 终止值, 步长, 高亮点数组, {lineColor, textColor, fontSize})
- grid(ctx, x, y, 列数, 行数, 格子大小, {bg, lineColor, highlights: [{col, row, color}]})
- barChart(ctx, x, y, 宽, 高, [{label, value, color}], {maxVal, fontSize})
- angleArc(ctx, cx, cy, r, 角度值, {fillColor, strokeColor, textColor, lineColor})
- labeledRect(ctx, x, y, 宽, 高, {fill, stroke, textColor, labels: {bottom, right, center}})

## draw 函数规则
1. draw 函数签名为 function(ctx, w, h, state)
2. state 是所有控件的当前值，如 state.den, state.num
3. 优先使用 EduComp.draw 辅助函数
4. 辅助函数不够用时，直接用 Canvas API (ctx.fillRect, ctx.arc 等)
5. ctx 已设置高清缩放，直接用逻辑像素坐标
6. 不要调用 setup，渲染器已处理

## 设计质量标准

### 视觉
- canvas 区域必须有渐变背景（通过 bgGradient 设置）
- Canvas 画布自动有白色背景 + 圆角 + 轻阴影
- 整个教具主题色不超过 2 个
- 关键数值用大号加粗彩色字体突出

### 交互
- 至少 3 个交互控件（滑块 + 预设按钮组合）
- 必须有预设按钮（快速跳转到典型值）
- 滑块拖动时实时更新（渲染器自动处理）

### 教学
- info 卡片必须包含 4-6 个核心要点
- 可视化必须直接体现数学关系
- 参数变化时自动推导展示结论

## 关键约束
1. 所有界面文字使用中文
2. id 只用英文字母和数字
3. 数值范围要符合该年级学生认知水平
4. 直接输出纯 JSON，不要任何解释
5. draw 函数体是字符串，内部换行用 \\n`;

/* ================================================================
 * Spec 生成示例
 * ================================================================ */

export const SPEC_EXAMPLE_1 = `{
  "title": "分数的初步认识",
  "subtitle": "上册 · 第八单元",
  "icon": "½",
  "bgGradient": "#fdf2f8,#fce7f3",
  "themeColor": "#EC4899",
  "render": {
    "type": "tabs",
    "tabs": [
      {
        "id": "explore",
        "label": "认识分数",
        "canvas": { "width": 400, "height": 250 },
        "draw": "var cx = w/2, cy = h/2, r = 85;\\nvar den = state.den, num = Math.min(state.num, den);\\nEduComp.draw.fractionCircle(ctx, cx, cy, r, den, num, '#f9a8d4', '#f1f5f9');\\nctx.fillStyle = '#334155'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center';\\nctx.fillText(num + '/' + den, cx, cy + r + 24);"
      },
      {
        "id": "compare",
        "label": "比较大小",
        "canvas": { "width": 420, "height": 200 },
        "draw": "var den = state.den;\\nvar num1 = Math.min(state.num, den);\\nvar num2 = Math.min(state.num2 || 1, den);\\nEduComp.draw.fractionBar(ctx, 20, 30, 170, 40, den, num1, '#f9a8d4', '#f1f5f9');\\nEduComp.draw.fractionBar(ctx, 230, 30, 170, 40, den, num2, '#c4b5fd', '#f1f5f9');\\nctx.fillStyle = '#334155'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';\\nctx.fillText(num1+'/'+den, 105, 90);\\nctx.fillText(num2+'/'+den, 315, 90);\\nvar sym = num1 > num2 ? '>' : num1 < num2 ? '<' : '=';\\nctx.font = 'bold 28px sans-serif'; ctx.fillStyle = '#EC4899';\\nctx.fillText(sym, 210, 65);"
      }
    ]
  },
  "controls": [
    { "type": "slider", "id": "den", "label": "分母（分成几份）", "min": 2, "max": 8, "value": 4, "color": "#EC4899" },
    { "type": "slider", "id": "num", "label": "分子（涂色几份）", "min": 1, "max": 8, "value": 3, "color": "#EC4899", "maxExpr": "den" },
    { "type": "slider", "id": "num2", "label": "对比分子", "min": 1, "max": 8, "value": 1, "color": "#7c3aed", "maxExpr": "den" },
    { "type": "divider" },
    { "type": "presets", "label": "预设分数", "items": [
      { "label": "½", "values": { "den": 2, "num": 1 } },
      { "label": "⅓", "values": { "den": 3, "num": 1 } },
      { "label": "¾", "values": { "den": 4, "num": 3 } },
      { "label": "⅝", "values": { "den": 8, "num": 5 } }
    ]},
    { "type": "divider" },
    { "type": "info", "title": "分数的初步认识",
      "points": [
        "把物体平均分成几份",
        "分母：平均分成的总份数",
        "分子：取出的份数",
        "同分母比较：分子大的分数大",
        "分数值 = 分子 ÷ 分母"
      ]
    }
  ],
  "actions": [
    { "label": "重置", "type": "outline", "action": "reset" }
  ],
  "onReset": "state.den = 4; state.num = 3; state.num2 = 1;"
}`;

export const SPEC_EXAMPLE_2 = `{
  "title": "长方形的面积",
  "subtitle": "三上 · 第六单元",
  "icon": "📐",
  "bgGradient": "#eff6ff,#dbeafe",
  "themeColor": "#2563EB",
  "render": {
    "type": "canvas2d",
    "canvas": { "width": 400, "height": 320 },
    "draw": "var l = state.length, w2 = state.width;\\nvar scale = 30;\\nvar rw = l * scale, rh = w2 * scale;\\nvar ox = (400 - rw) / 2, oy = (320 - rh) / 2;\\nEduComp.draw.labeledRect(ctx, ox, oy, rw, rh, { fill: '#eff6ff', stroke: '#3b82f6', textColor: '#1e293b', labels: { bottom: '长 = ' + l + ' cm', right: '宽 = ' + w2 + ' cm', center: l * w2 + ' cm²' } });\\nctx.fillStyle = '#3b82f6'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';\\nctx.fillText('面积 = 长 × 宽 = ' + l + ' × ' + w2 + ' = ' + (l * w2) + ' cm²', 200, 300);"
  },
  "controls": [
    { "type": "slider", "id": "length", "label": "长 (cm)", "min": 1, "max": 10, "value": 5, "color": "#2563EB" },
    { "type": "slider", "id": "width", "label": "宽 (cm)", "min": 1, "max": 8, "value": 3, "color": "#2563EB" },
    { "type": "divider" },
    { "type": "presets", "label": "预设", "items": [
      { "label": "5×3", "values": { "length": 5, "width": 3 } },
      { "label": "6×4", "values": { "length": 6, "width": 4 } },
      { "label": "8×5", "values": { "length": 8, "width": 5 } },
      { "label": "10×6", "values": { "length": 10, "width": 6 } }
    ]},
    { "type": "divider" },
    { "type": "info", "title": "长方形的面积",
      "points": [
        "面积 = 长 × 宽",
        "长方形对边相等",
        "面积单位：cm²、dm²、m²",
        "正方形是特殊的长方形",
        "1 m² = 100 dm² = 10000 cm²"
      ]
    }
  ],
  "actions": [
    { "label": "重置", "type": "outline", "action": "reset" }
  ],
  "onReset": "state.length = 5; state.width = 3;"
}`;

/* ================================================================
 * 构建 spec 生成的 user prompt
 * ================================================================ */

export interface SpecGenerateParams {
  name: string;
  gradeLabel: string;
  subjectLabel: string;
  chapter: string;
  description: string;
}

export function buildSpecUserPrompt(params: SpecGenerateParams): string {
  return `请为以下教学需求生成 JSON Spec：

教具名称：${params.name}
适用年级：${params.gradeLabel}
学科：${params.subjectLabel}
章节：${params.chapter}

需求：
${params.description}

请输出合法 JSON，不要 markdown 代码围栏，不要解释文字。`;
}

/* ================================================================
 * 构建 spec 生成的完整 system prompt（含示例）
 * ================================================================ */

let _cachedSpecSystemPrompt: string | null = null;

export function buildSpecSystemPrompt(): string {
  if (!_cachedSpecSystemPrompt) {
    _cachedSpecSystemPrompt = `${SPEC_SYSTEM_PROMPT}

## 参考示例 1：分数教具

${SPEC_EXAMPLE_1}

## 参考示例 2：面积教具

${SPEC_EXAMPLE_2}`;
  }
  return _cachedSpecSystemPrompt;
}

/* ================================================================
 * Spec → HTML 包装模板
 *
 * 将 JSON Spec 包装为完整 HTML 页面，加载组件框架并渲染。
 * ================================================================ */

export function wrapSpecAsHtml(specJson: string): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>教具 — 教立方</title>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <script src="../edu-lib/edu-tools.js"></script>
  <script src="../edu-lib/edu-components.js"></script>
  <script src="../edu-lib/edu-renderer.js"></script>
</head>
<body>
<script>
// ── Spec 定义 ──
var spec = ${specJson};

// ── 反序列化字符串函数 ──
function reviveFn(code) {
  if (typeof code !== 'string') return code;
  try { return new Function('ctx', 'w', 'h', 'state', code); }
  catch(e) { console.error('[EduRender] draw function error:', e); return function(){}; }
}
function reviveReset(code) {
  if (typeof code !== 'string') return code;
  try { return new Function('state', code); }
  catch(e) { console.error('[EduRender] onReset error:', e); return function(){}; }
}

// ── 处理 render.draw / render.tabs[].draw ──
if (spec.render) {
  if (spec.render.draw && typeof spec.render.draw === 'string') {
    spec.render.draw = reviveFn(spec.render.draw);
  }
  if (spec.render.tabs) {
    spec.render.tabs.forEach(function(tab) {
      if (tab.draw && typeof tab.draw === 'string') {
        tab.draw = reviveFn(tab.draw);
      }
    });
  }
  if (spec.render.resultArea && typeof spec.render.resultArea === 'string') {
    try { spec.render.resultArea = new Function('state', spec.render.resultArea); }
    catch(e) { spec.render.resultArea = null; }
  }
  if (spec.render.setup && typeof spec.render.setup === 'string') {
    try { spec.render.setup = new Function('scene', 'camera', 'renderer', 'controls', 'state', spec.render.setup); }
    catch(e) { spec.render.setup = null; }
  }
  if (spec.render.update && typeof spec.render.update === 'string') {
    try { spec.render.update = new Function('scene', 'state', spec.render.update); }
    catch(e) { spec.render.update = null; }
  }
}
if (spec.onReset && typeof spec.onReset === 'string') {
  spec.onReset = reviveReset(spec.onReset);
}

// ── 渲染 ──
EduRender.run(spec);
</script>
</body>
</html>`;
}

/* ================================================================
 * 解析 AI 输出为 JSON Spec
 * ================================================================ */

export function parseSpecOutput(raw: string): { spec: Record<string, unknown>; valid: boolean } {
  let text = raw.trim();
  // 去掉可能的 markdown 代码围栏
  text = text.replace(/^```(?:json)?\s*\n?/i, '');
  text = text.replace(/\n?```\s*$/i, '');
  text = text.trim();

  // 尝试找到 JSON 对象（从第一个 { 到最后一个 }）
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return { spec: {}, valid: false };
  }

  const jsonStr = text.slice(start, end + 1);

  try {
    const spec = JSON.parse(jsonStr);
    if (typeof spec === 'object' && spec !== null && (spec.title || spec.render)) {
      return { spec, valid: true };
    }
    return { spec, valid: false };
  } catch {
    return { spec: {}, valid: false };
  }
}
