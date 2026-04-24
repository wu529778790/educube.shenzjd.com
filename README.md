# 教立方 EduCube

中小学**交互式课堂教具**平台：按**教材版本 → 年级 → 学科**浏览，每个教具为独立 HTML，浏览器打开即可演示。内置 **AI 教具助手**，用自然语言即可生成和修改教具。

**品牌：** 对外统一称「教立方」，技术文档可写作「教立方（EduCube）」。

---

## 技术栈

| 项目 | 版本 / 说明 |
|------|-------------|
| Next.js | 16（App Router） |
| React | 19 |
| TypeScript | 5（严格模式） |
| 样式 | Tailwind CSS v4 |
| AI 生成 | OpenAI / Anthropic 双 provider |
| 教具内 3D | Three.js（本地引入） |

更细的工程约定见仓库根目录 [`AGENTS.md`](AGENTS.md)。

---

## 仓库结构

```
app/
  page.tsx                 # 首页
  layout.tsx               # 根布局与站点元数据
  globals.css              # 全局样式与设计变量
  tools/[id]/page.tsx      # 教具详情（顶栏 + iframe）
  agent/page.tsx           # AI 教具助手页面
  api/
    agent/route.ts         # Agent SSE 流式 API
    generate/route.ts      # 单次生成 API（兼容）
components/
  HomePageContent.tsx      # 首页：课程体系 + 教具区 + 页脚
  ToolGrid.tsx             # 上册/下册 Tab + 卡片网格
  ToolCard.tsx             # 单个教具卡片
  AgentPageContent.tsx     # AI 对话面板 + 实时预览
data/
  curriculum.ts            # 教材版本、年级、学科定义
  tools/                   # 各年级教具元数据
  prompt-template.ts       # HTML 生成 prompt
  spec-prompt.ts           # JSON Spec 生成 prompt + 包装器
  generated-tools.ts       # AI 生成教具的持久化管理
lib/
  ai-client.ts             # AI 客户端（OpenAI / Anthropic）
  agent/orchestrator.ts    # Agent 编排器（意图识别 + 多轮对话）
public/
  edu-lib/
    edu-base.css           # 教具设计系统 + 大屏触屏适配
    edu-components.js      # 组件框架（控件工厂 + 绘图函数）
    edu-renderer.js        # JSON Spec → 教具页面渲染器
    edu-tools.js           # 公共工具（拖拽、大屏初始化）
    edu-3d.js              # 3D 教具 API 封装
  tools/
    *.html                 # 各教具入口页面（89 个）
```

---

## AI 教具生成架构

### 三层架构

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

### 生成流程

```
用户描述 "做一个分数乘法工具"
   │
   ▼
┌───────────┐    ┌─────────────────┐    ┌──────────────────┐
│ 需求整理   │───▶│ Spec 生成       │───▶│ HTML 包装         │
│ AI 提炼   │    │ AI 输出 JSON    │    │ 组件框架渲染      │
│ 教学需求   │    │ (~500 token)    │    │                  │
└───────────┘    └───────┬─────────┘    └──────────────────┘
                         │
                   解析失败? ──▶ fallback 直接生成 HTML
                         │
                         ▼
                  用户预览 → "把颜色改成蓝色"
                         │
                         ▼
                  修改 JSON Spec 字段 → 重新渲染
```

**核心优势：**
- AI 生成 JSON Spec 而非原始 HTML，token 消耗降低 ~10x
- 组件框架保证交互一致性和视觉规范
- 多轮对话支持字段级精确修改，无需重写整个文件
- Spec 解析失败自动 fallback，保证可用性

详细架构文档见 [`AGENTS.md`](AGENTS.md)。

---

## 本地开发

```bash
npm install
npm run dev
```

浏览器访问 <http://localhost:3000>。

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器（Turbopack） |
| `npm run build` | 生产构建 |
| `npm run start` | 启动生产服务器（需先 build） |
| `npm run lint` | ESLint |
| `npm run test` | 单元测试（Vitest） |

## 运行配置

| 环境变量 | 说明 | 默认值 |
|------|------|------|
| `AI_PROVIDER` | AI 提供商 | `openai` |
| `AI_API_KEY` | AI API 密钥 | — |
| `AI_BASE_URL` | 自定义 AI 端点 | 官方端点 |
| `AI_MODEL` | 模型名 | provider 默认值 |
| `AI_MAX_TOKENS` | 最大生成 token | `16000` |
| `AI_TIMEOUT` | AI 请求超时（毫秒） | `120000` |
| `GENERATE_SECRET` | `/api/generate` 共享密钥 | 未设置时关闭 |
| `GENERATED_TOOLS_BACKEND` | 生成教具存储后端 | `filesystem` |
| `AGENT_SESSION_STORE` | Agent 会话存储后端 | `memory` |

当前仅内置两种默认实现：
- `GENERATED_TOOLS_BACKEND=filesystem`
- `AGENT_SESSION_STORE=memory`

如果配置成未支持的值，应用会在服务端初始化阶段直接报错，而不是等到首次请求时才失败。

---

## Docker 部署

```bash
docker build -t educube .
docker run -p 3000:3000 educube
```

---

## 如何新增一个教具

### 方式一：AI 生成

访问 `/agent`，用自然语言描述需求，AI 自动生成教具。支持多轮对话修改。

### 方式二：手工编写

1. 在 `public/tools/` 新增 `{id}.html`（建议引入 `../edu-lib/edu-base.css`）。
2. 在 [`data/tools/`](data/tools/) 对应年级文件（如 `p5.ts`）的数组中增加一条记录，字段包括：`id`、`gradeId`、`subjectId`、`semester`、`unitNum`、`chapter`、`name`、`subtitle`、`description`、`tags`、`gradient`、`icon` 等。
3. 构建后自动生成静态路由 `/tools/{id}`（由 `generateStaticParams` 驱动）。

### 方式三：组件框架（推荐）

使用组件框架 API，声明式构建教具：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8"/>
  <link rel="stylesheet" href="../edu-lib/edu-base.css"/>
  <script src="../edu-lib/edu-tools.js"></script>
  <script src="../edu-lib/edu-components.js"></script>
  <script src="../edu-lib/edu-renderer.js"></script>
</head>
<body>
<script>
EduRender.run({
  title: "长方形的面积",
  subtitle: "三上 · 第六单元",
  icon: "📐",
  bgGradient: "#eff6ff,#dbeafe",
  themeColor: "#2563EB",
  render: {
    type: "canvas2d",
    canvas: { width: 400, height: 320 },
    draw: function(ctx, w, h, state) {
      var l = state.length, w2 = state.width;
      EduComp.draw.labeledRect(ctx, 50, 50, l*30, w2*30, {
        fill: '#eff6ff', stroke: '#3b82f6',
        labels: { bottom: '长='+l, right: '宽='+w2, center: l*w2+'cm²' }
      });
    }
  },
  controls: [
    { type: "slider", id: "length", label: "长(cm)", min: 1, max: 10, value: 5 },
    { type: "slider", id: "width", label: "宽(cm)", min: 1, max: 8, value: 3 },
    { type: "info", title: "长方形面积", points: ["面积=长×宽", "对边相等"] }
  ]
});
</script>
</body>
</html>
```

---

## 许可证

见仓库根目录 [`LICENSE`](LICENSE)。
