import { getGeneratedToolById, readGeneratedToolHtml } from "@/data/generated-tools";

interface RouteProps {
  params: Promise<{ id: string }>;
}

const GENERATED_HTML_HEADERS: HeadersInit = {
  "Content-Type": "text/html; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
  "Content-Security-Policy": [
    "sandbox allow-scripts",
    "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "connect-src https://cloudflareinsights.com",
    "img-src 'self' data: blob:",
    "font-src 'self'",
  ].join("; "),
};

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: RouteProps) {
  const { id } = await params;
  const tool = await getGeneratedToolById(id);
  if (!tool) {
    return new Response("Not Found", { status: 404 });
  }

  const html = await readGeneratedToolHtml(tool);
  return new Response(html, {
    headers: GENERATED_HTML_HEADERS,
  });
}
