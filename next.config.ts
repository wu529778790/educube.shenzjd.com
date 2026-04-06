import type { NextConfig } from "next";

/**
 * 部署模式：Docker 容器（参见 Dockerfile 和 .github/workflows/docker.yml）
 *
 * standalone 模式会生成独立的 Node.js 服务器（.next/standalone/server.js），
 * 适合容器化部署，不依赖宿主机的 node_modules。
 *
 * 若改为 Vercel 部署，删除 output 配置即可（Vercel 会自动处理构建方式） */
const securityHeaders: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    /* Cloudflare Web Analytics 会注入 static.cloudflareinsights.com；不加入则控制台报 CSP 拦截 */
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://cloudflareinsights.com",
    "frame-src 'self' blob:",
    "worker-src 'self' blob:",
  ].join("; "),
};

/**
 * 生成的教具 HTML 文件的 CSP 沙箱头。
 * 当用户通过"新窗口"直接打开 HTML 时，这些头提供浏览器级别的沙箱：
 * - sandbox allow-scripts：仅允许脚本执行，禁止同源访问
 * - default-src 'self' 'unsafe-inline' 'unsafe-eval'：允许内联脚本
 * - 禁止外部网络请求 (connect-src 'none')
 */
const generatedToolHeaders: Record<string, string> = {
  "Content-Security-Policy": [
    "sandbox allow-scripts",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'none'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
  ].join("; "),
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
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
        source: "/tools/gen/(.*).html",
        headers: Object.entries(generatedToolHeaders).map(([key, value]) => ({
          key,
          value,
        })),
      },
      {
        source: "/tools/(.*).html",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
