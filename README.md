# 教立方 EduCube

中小学**交互式课堂教具**平台：按**教材版本 → 年级 → 学科**浏览，每个教具为独立 HTML，浏览器打开即可演示。

**品牌：** 对外统一称「教立方」，技术文档可写作「教立方（EduCube）」。

---

## 当前内容

| 年级 | 上册 | 下册 | 合计 |
|------|------|------|------|
| 三年级 | 9 | 8 | **17** |
| 四年级 | 8 | 17 | **25** |
| 五年级 | 10 | 12 | **22** |
| 六年级 | 14 | 11 | **25** |
| **合计** | **41** | **48** | **89** |

当前以**人教版 · 小学数学**为主，默认首页展示全部年级。课程体系框架已覆盖 8 种教材版本、小学至初中 9 个年级、5 门学科，其余目录可持续补充。

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
  tools.ts                 # 教具元数据数组 + 筛选函数
public/
  edu-lib/
    edu-base.css           # 教具公共样式变量与组件类
    edu-tools.js           # 教具公共工具函数
  tools/
    *.html                 # 各教具入口页面（89 个）
```

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
npx tsc --noEmit # 类型检查
```

---

## Docker 部署

```bash
docker build -t educube .
docker run -p 3000:3000 educube
```

---

## 如何新增一个教具

1. 在 `public/tools/` 新增 `{id}.html`（建议引入 `../edu-lib/edu-base.css`）。
2. 在 [`data/tools/`](data/tools/) 对应年级文件（如 `p5.ts`）的数组中增加一条记录，字段包括：`id`、`gradeId`、`subjectId`、`semester`、`unitNum`、`chapter`、`name`、`subtitle`、`description`、`tags`、`gradient`、`icon` 等。
3. 构建后自动生成静态路由 `/tools/{id}`（由 `generateStaticParams` 驱动）。

---

## 许可证

见仓库根目录 [`LICENSE`](LICENSE)。
