# EduCube (教立方) 开发指南

中国小学数学交互教具平台，基于 Next.js 16 App Router 构建。

> **注意**：本项目使用 Next.js 16.2.1，存在破坏性变更。API、约定和文件结构可能与你训练数据不同。
> 请先查阅 `node_modules/next/dist/docs/` 中的相关文档。

## 语言要求

- 默认使用中文回复用户。
- 解释代码、执行结果、报错分析时也使用中文。
- 仅在用户明确要求英文或其他语言时切换。

## 命令

| 命令            | 说明                          |
|-----------------|-------------------------------|
| `npm run dev`   | 启动开发服务器（Turbopack）   |
| `npm run build` | 生产构建                      |
| `npm run start` | 运行生产构建                  |
| `npm run lint`  | ESLint（core-web-vitals + TypeScript）|

项目**没有测试框架**，也**没有 `typecheck` 脚本**——需要时手动运行 `npx tsc --noEmit`。

## 项目结构

```
app/                  # Next.js App Router（页面、布局、元数据）
  tools/[id]/page.tsx # 各教具的动态路由
components/           # 共享 React 组件（PascalCase 文件名）
data/                 # 静态数据和类型定义（camelCase 文件名）
public/tools/         # 通过 iframe 加载的独立 HTML 文件
```

- 路径别名：`@/*` 映射到项目根目录（用 `@/components/ToolCard`，不要用 `../../components/ToolCard`）
- `public/tools/*.html` 是独立的 HTML/CSS/JS 文件，**不经** Next.js 打包，作为静态资源直接提供。

## 代码规范

### TypeScript

- **严格模式**已开启。禁止使用 `any`。
- 组件 Props 用 `interface` 定义，不用 `type`：
  ```ts
  interface ToolCardProps {
    tool: Tool;
    index: number;
  }
  ```
- 仅用于类型的导入使用 `import type { ... }`（如 `import type { Metadata } from "next"`）。
- 接口/类型用 `export` 命名导出。组件用 `export default` 默认导出。

### 组件

- 文件名：PascalCase（如 `ToolCard.tsx`）。每个文件一个组件。
- Props 接口命名：`<组件名>Props`。
- 只用函数组件，不用类组件。
- 允许异步服务端组件（页面直接获取数据）。
- 缺失资源使用 `next/navigation` 的 `notFound()`，不要手动重定向。

### 路由与数据

- 动态路由：`app/[param]/page.tsx`。通过 `const { id } = await params` 获取参数（Next.js 16 中 `params` 是 `Promise`）。
- 使用 `generateStaticParams()` 实现静态生成。
- 使用 `generateMetadata()` 设置页面级元数据。

### 样式

- **Tailwind CSS v4** + PostCSS（`@tailwindcss/postcss`）。
- CSS 中导入 Tailwind：`@import "tailwindcss"`（不要用 v3 的指令）。
- 设计令牌定义在 `app/globals.css` 中作为 CSS 自定义属性（如 `--edu-navy`、`--edu-cream`）。
- 通过 `style={{ background: "var(--edu-navy)" }}` 使用自定义属性。
- 布局和间距使用 Tailwind 工具类。能用 Tailwind 解决的不要写自定义 CSS 类。
- 界面文字为中文——不要翻译。

### 命名

| 项目           | 约定               | 示例                 |
|----------------|---------------------|----------------------|
| 组件文件       | PascalCase          | `ToolCard.tsx`       |
| Props 类型     | PascalCase + Props  | `ToolCardProps`      |
| 数据文件       | camelCase           | `tools.ts`           |
| 数据接口       | PascalCase          | `Tool`               |
| 路由片段       | kebab-case          | `[id]/page.tsx`      |
| CSS 变量       | kebab-case 带前缀   | `--edu-navy`         |

### 错误处理

- 404：调用 `next/navigation` 的 `notFound()`。
- 数据缺失：用 `notFound()` 提前返回，不要抛异常。
- 优先用类型收窄，不用类型断言。

### ESLint

配置：`eslint-config-next`，启用 `core-web-vitals` + `typescript` 预设。
忽略：`.next/`、`out/`、`build/`、`next-env.d.ts`。

## AI 教具生成架构

### 整体架构

```
┌──────────────────────────────────────────────────────┐
│  Layer 3: Agent 对话层                                │
│  app/api/agent/route.ts  ←→  components/AgentPageContent.tsx
│  意图识别 → 多轮对话 → SSE 流式响应 → 实时预览          │
├──────────────────────────────────────────────────────┤
│  Layer 2: 声明式规格层                                │
│  data/spec-prompt.ts                                  │
│  AI 生成 JSON Spec → wrapSpecAsHtml() 包装为页面      │
│  parseSpecOutput() 容错解析 + 自动 fallback            │
├──────────────────────────────────────────────────────┤
│  Layer 1: 组件框架层                                  │
│  public/edu-lib/edu-components.js  骨架+控件+绘图函数  │
│  public/edu-lib/edu-renderer.js    JSON Spec → 渲染   │
│  public/edu-lib/edu-base.css       设计系统+大屏适配   │
│  public/edu-lib/edu-tools.js       公共工具+拖拽+大屏  │
└──────────────────────────────────────────────────────┘
```

### 生成流程（两种模式）

#### 模式 A：Spec-based（优先）

```
用户描述
   │
   ▼
┌───────────┐    ┌─────────────────┐    ┌──────────────────┐
│ 需求整理   │───▶│ Spec 生成       │───▶│ HTML 包装         │
│ refine    │    │ AI 输出 JSON    │    │ wrapSpecAsHtml()  │
│           │    │ ~500 token      │    │ 引入组件框架渲染   │
└───────────┘    └───────┬─────────┘    └──────────────────┘
                         │
                   有效? │── 否 ──▶ fallback 到模式 B
                         ▼
                   JSON Spec 持久化
                   （支持后续字段级修改）
```

AI 生成的是 JSON Spec 而非原始 HTML：

```jsonc
{
  "title": "分数的初步认识",
  "subtitle": "上册 · 第八单元",
  "icon": "½",
  "bgGradient": "#fdf2f8,#fce7f3",
  "themeColor": "#EC4899",
  "render": {
    "type": "tabs",
    "tabs": [
      { "id": "explore", "label": "认识分数",
        "canvas": { "width": 400, "height": 250 },
        "draw": "// JS 函数体，参数 (ctx, w, h, state)" }
    ]
  },
  "controls": [
    { "type": "slider", "id": "den", "label": "分母", "min": 2, "max": 8, "value": 4 },
    { "type": "presets", "items": [{"label": "½", "values": {"den":2,"num":1}}] },
    { "type": "info", "title": "知识点", "points": ["要点1", "要点2"] }
  ]
}
```

#### 模式 B：Raw HTML（Fallback）

当 Spec 解析失败时，回退到直接生成 HTML：

```
用户描述 → 大 Prompt (prompt-template.ts) → AI 输出完整 HTML
```

### 修改流程

```
已有 Spec?
  ├── 是 → 修改 JSON Spec 字段（精确、不影响其他部分）
  └── 否 → 修改原始 HTML（整文件重写）
```

### 文件职责

| 文件 | 职责 |
|------|------|
| `data/spec-prompt.ts` | Spec 生成 prompt、示例、`wrapSpecAsHtml()` 包装器、`parseSpecOutput()` 解析器 |
| `data/prompt-template.ts` | Raw HTML 生成的 prompt（fallback 用）、CSS 模板、refine prompt |
| `data/generated-tools.ts` | 生成教具的持久化（原子写入、缓存、去重、上限 500 条） |
| `lib/agent/orchestrator.ts` | Agent 编排器：意图识别、Spec/HTML 双模式生成、修改、审查 |
| `lib/ai-client.ts` | AI 客户端抽象：OpenAI/Anthropic 双 provider、重试、超时 |
| `app/api/agent/route.ts` | SSE 流式 API 端点：对话、保存、重置 |
| `app/api/generate/route.ts` | 原始生成 API（单次管道，保留兼容） |
| `components/AgentPageContent.tsx` | Agent 对话 UI：消息列表、iframe 预览、操作按钮 |

### 组件框架 API（edu-components.js）

```js
EduComp.create(spec)              // 创建教具骨架，返回 { el, state, canvasArea, panel, onDraw, redraw }
EduComp.addSlider(container, opts, onChange, state)  // 滑块（支持动态上限 maxExpr）
EduComp.addPresets(container, opts, onSelect, state, sliderRefs)  // 预设按钮组
EduComp.addTabs(container, opts, onChange, state)     // 标签页
EduComp.addToggle(container, opts, onChange, state)   // 互斥切换
EduComp.addToolbarButton(actionsEl, opts)              // 工具栏按钮
EduComp.addDivider(container)                          // 分隔线
EduComp.addInfoBox(container, opts)                    // 知识点卡片

// Canvas 绘图辅助
EduComp.draw.setup(canvas, w, h)                       // 高清 Canvas 初始化
EduComp.draw.fractionCircle(ctx, cx, cy, r, den, num, color, bgColor)
EduComp.draw.fractionBar(ctx, x, y, w, h, den, num, color, bgColor)
EduComp.draw.numberLine(ctx, x, y, w, from, to, step, marks, opts)
EduComp.draw.grid(ctx, x, y, cols, rows, cellSize, opts)
EduComp.draw.barChart(ctx, x, y, w, h, data, opts)
EduComp.draw.angleArc(ctx, cx, cy, r, degrees, opts)
EduComp.draw.labeledRect(ctx, x, y, w, h, opts)
```

### 渲染器 API（edu-renderer.js）

```js
EduRender.run(spec, customDraw?)
// spec: JSON 对象或 JSON 字符串
// customDraw: 可选自定义绘制函数 (ctx, w, h, state)
//
// 支持 render.type:
//   "canvas2d" — 单 Canvas + draw 函数 / drawSteps
//   "tabs"     — 多标签页，每页独立 Canvas
//   "threejs"  — Three.js 3D 场景（需额外加载 three.min.js + edu-3d.js）
```

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `AI_PROVIDER` | AI 提供商（`openai` / `anthropic`） | `openai` |
| `AI_API_KEY` | API Key | — |
| `AI_BASE_URL` | 自定义 API 端点 | 官方端点 |
| `AI_MODEL` | 模型名 | `gpt-4o` / `claude-sonnet-4-20250514` |
| `AI_MAX_TOKENS` | 最大生成 token | `16000` |
| `GENERATE_SECRET` | 生成 API 认证密钥（可选） | — |
| `GENERATED_TOOLS_BACKEND` | 生成教具存储后端 | `filesystem` |
| `AGENT_SESSION_STORE` | Agent 会话存储后端 | `memory` |

## 核心依赖

- `next` 16.2.1
- `react` / `react-dom` 19.2.4
- `tailwindcss` ^4（通过 `@tailwindcss/postcss`）
- `typescript` ^5
