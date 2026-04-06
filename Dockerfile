FROM node:20-alpine AS base

# --- 依赖层 ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# --- 构建层 ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- 生产层 ---
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 创建生成工具的持久化目录，并赋予 nextjs 用户写入权限
RUN mkdir -p /app/data /app/public/tools/gen && \
    chown -R nextjs:nodejs /app/data /app/public/tools/gen

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# 使用 Node.js 进行健康检查（Alpine 不一定有 wget）
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http = require('http'); const req = http.get('http://localhost:3000/', (res) => { process.exit(res.statusCode < 500 ? 0 : 1); }); req.on('error', () => process.exit(1)); req.setTimeout(3000, () => { req.destroy(); process.exit(1); })"

# 持久化生成工具的卷（容器重启后数据不丢失）
# 启动时挂载：docker run -v educube-data:/app/data -v educube-gen:/app/public/tools/gen educube
VOLUME ["/app/data", "/app/public/tools/gen"]

CMD ["node", "server.js"]
