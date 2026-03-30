import type { NextConfig } from "next";

/**
 * 部署模式：Docker 容器（参见 Dockerfile 和 .github/workflows/docker.yml）
 *
 * standalone 模式会生成独立的 Node.js 服务器（.next/standalone/server.js），
 * 适合容器化部署，不依赖宿主机的 node_modules。
 *
 * 若改为 Vercel 部署，删除 output 配置即可（Vercel 会自动处理构建方式）。
 */
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
