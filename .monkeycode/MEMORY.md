# 用户指令记忆

本文件记录了用户的指令、偏好和教导，用于在未来的交互中提供参考。

## 格式

### 用户指令条目
用户指令条目应遵循以下格式：

[用户指令摘要]
- Date: [YYYY-MM-DD]
- Context: [提及的场景或时间]
- Instructions:
  - [用户教导或指示的内容，逐行描述]

### 项目知识条目
Agent 在任务执行过程中发现的条目应遵循以下格式：

[项目知识摘要]
- Date: [YYYY-MM-DD]
- Context: Agent 在执行 [具体任务描述] 时发现
- Category: [代码结构|代码模式|代码生成|构建方法|测试方法|依赖关系|环境配置]
- Instructions:
  - [具体的知识点，逐行描述]

## 去重策略
- 添加新条目前，检查是否存在相似或相同的指令
- 若发现重复，跳过新条目或与已有条目合并
- 合并时，更新上下文或日期信息
- 这有助于避免冗余条目，保持记忆文件整洁

## 条目

[AI 生成教具功能 - 架构问题总结（第二轮修复后）]
- Date: 2026-04-14
- Context: Agent 在执行用户"继续"任务时完成第二轮修复
- Category: 代码结构
- Instructions:
  - [第一轮已修复] Spec 解析验证增强、Spec 修复重试、保存元数据提取、Refine Prompt 去重、renderTabs bug、doReset bug、CSS 冲突
  - [第二轮已修复] 会话持久化：localStorage 保存 sessionState/messages/previewHtml，刷新不丢失
  - [第二轮已修复] Spec/HTML 双向保留：HTML fallback 修改时不再清空 currentSpec，新增 specOutOfSync 标记
  - [第二轮已修复] 意图识别升级：无 currentHtml 时默认创建；正则匹配颜色/标题/范围等修改意图；有 Spec 时默认修改
  - [第二轮已修复] Agent API 安全加固：提取 lib/api-security.ts 共享模块，添加 IP 限流(30次/时)+CSRF Origin 校验+并发限制(10)
  - [待优化] /api/generate 应迁移到使用共享的 api-security.ts 模块
  - [待优化] SSE 协议在两个 API 端点间不一致
  - [待优化] 课堂大屏模式在 edu-base.css 中强制激活，无设备适配
