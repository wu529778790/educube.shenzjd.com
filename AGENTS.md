# EduCube (教立方) 开发指南

中国小学数学交互教具平台，基于 Next.js 16 App Router 构建。

> **注意**：本项目使用 Next.js 16.2.1，存在破坏性变更。API、约定和文件结构可能与你训练数据不同。
> 请先查阅 `node_modules/next/dist/docs/` 中的相关文档。

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

## 核心依赖

- `next` 16.2.1
- `react` / `react-dom` 19.2.4
- `tailwindcss` ^4（通过 `@tailwindcss/postcss`）
- `typescript` ^5
