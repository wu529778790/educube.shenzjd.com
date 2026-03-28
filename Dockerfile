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
RUN npm run build

# --- 生产层 ---
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# standalone 输出路径随环境不同，找到 server.js 所在目录并展平
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/.next/standalone /tmp/standalone
RUN SERVER_DIR=$(dirname $(find /tmp/standalone -name server.js | head -1)) && \
    cp -r "$SERVER_DIR"/.next ./.next && \
    cp "$SERVER_DIR"/server.js ./server.js && \
    cp -r "$SERVER_DIR"/node_modules ./node_modules 2>/dev/null || true && \
    rm -rf /tmp/standalone

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
