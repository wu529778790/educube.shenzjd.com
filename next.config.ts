import type { NextConfig } from "next";

/**
 * 部署模式：Docker 容器（参见 Dockerfile 和 .github/workflows/docker.yml）
 *
 * standalone 模式会生成独立的 Node.js 服务器（.next/standalone/server.js），
 * 适合容器化部署，不依赖宿主机的 node_modules。
 *
 * 若改为 Vercel 部署，删除 output 配置即可（Vercel 会自动处理构建方式）。
 */
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self'",
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
  ].join("; "),
};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: Object.entries(securityHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        source: "/tools/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
