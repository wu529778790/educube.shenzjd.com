# 教立方 EduCube

中小学**交互式课堂教具**平台：按**教材版本 → 年级 → 学科**浏览，每个教具为独立 HTML，浏览器打开即可演示。当前以**人教版 · 四年级 · 数学**内容为主，课程体系框架已覆盖多版本、多年级、多学科，其余目录可持续补充。

**品牌：** 对外统一称「教立方」，技术文档可写作「教立方（EduCube）」。

---

## 当前能力（MVP）

| 能力 | 说明 |
|------|------|
| 课程体系导航 | 8 种教材版本、小学一至六年级与初中七至九年级、5 门学科；按钮旁显示当前筛选下的教具数量 |
| 教具列表 | 卡片展示名称、章节、知识点与简介；支持按上册 / 下册筛选 |
| 教具演示 | 路由页 `/tools/[id]` 内嵌 iframe；顶栏可「新窗口」打开裸 HTML，便于投影全屏 |
| 静态教具 | `public/tools/*.html` 独立页面，可引用 `public/edu-lib/` 公共样式与脚本 |
| 部署 | Next.js `standalone` 输出，配套 **Docker** 镜像（见 `Dockerfile`、`.github/workflows/docker.yml`） |

**暂未包含：** 用户系统、数据库、AI 生成、作品广场与积分（可作为后续阶段）。

---

## 技术栈

| 项目 | 版本 / 说明 |
|------|-------------|
| Next.js | 16（App Router） |
| React | 19 |
| TypeScript | 5（严格模式） |
| 样式 | Tailwind CSS v4 |
| 教具内 3D | 部分 HTML 通过 CDN 引入 Three.js |

更细的工程约定见仓库根目录 [`AGENTS.md`](AGENTS.md)。

---

## 仓库结构

```
app/
  page.tsx                 # 首页（委托给 HomePageContent）
  layout.tsx               # 根布局与站点元数据
  globals.css              # 全局样式与设计变量
  tools/[id]/page.tsx      # 教具详情（顶栏 + iframe）
components/
  HomePageContent.tsx      # 首页：课程体系 + 教具区 + 页脚
  ToolGrid.tsx             # 上册/下册 Tab + 卡片网格
  ToolCard.tsx             # 单个教具卡片
data/
  curriculum.ts            # 教材版本、年级、学科定义与路径文案
  tools.ts                 # 教具元数据数组 + filterToolsByCatalog
public/
  edu-lib/
    edu-base.css           # 教具公共样式变量与组件类
    edu-tools.js           # 教具公共工具函数
  tools/
    *.html                 # 各教具入口页面
```

**数据关联：** 每条教具在 `data/tools.ts` 中需填写 `publisherId`、`gradeId`、`subjectId`，与 [`data/curriculum.ts`](data/curriculum.ts) 中的 id 一致；详情页 iframe 地址为 `/tools/{id}.html`。

---

## 本地开发

```bash
npm install
npm run dev
```

浏览器访问 <http://localhost:3000>。

```bash
npm run build    # 生产构建
npm run start    # 启动生产服务器（需先 build）
npm run lint     # ESLint
```

类型检查（无独立脚本时）：

```bash
npx tsc --noEmit
```

---

## Docker 部署

```bash
docker build -t educube .
docker run -p 3000:3000 educube
```

`next.config.ts` 中 `output: "standalone"` 与多阶段 `Dockerfile` 配合，将 `public/` 与 standalone 服务端一并打入镜像。若改为 **Vercel** 等平台托管，可按注释调整 `next.config.ts`（通常去掉 `standalone` 由平台接管构建）。

---

## 如何新增一个教具

1. 在 `public/tools/` 新增 `{id}.html`（建议引入 `../edu-lib/edu-base.css` 与 `../edu-lib/edu-tools.js`）。
2. 在 [`data/tools.ts`](data/tools.ts) 的 `tools` 数组中增加一条记录，字段需包含：`id`（与文件名一致）、`publisherId` / `gradeId` / `subjectId`、`semester`、`unitNum`、`chapter`、`name`、`description` 等。
3. 构建后自动生成静态路由 `/tools/{id}`（由 `generateStaticParams` 驱动）。

无对应元数据的 HTML 文件不会出现在导航中；有元数据但缺少 HTML 时，进入详情页会加载失败，发布前请自检。

---

## 后续方向（产品）

以下为规划参考，与当前代码未必一致：

- 按版本 / 年级继续补全数学 HTML 教具，并为人教版以外版本挂载同主题教具。
- 语文、英语等学科占位已就绪，可按 `subjectId` 逐条扩展。
- 可选：AI 辅助生成 HTML、用户作品库、社区与积分、后端与对象存储。

---

## 竞品与差异（简述）

| 对比对象 | 教立方侧重 |
|----------|------------|
| GeoGebra 等通用数学软件 | 面向课堂片段演示，按教材目录组织，上手成本更低 |
| 静态资源站 / 课件网 | 强调交互与可操控，非单纯文档或 PPT 模板 |

---

## 许可证

见仓库根目录 [`LICENSE`](LICENSE)。
