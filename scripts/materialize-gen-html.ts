/**
 * 根据 data/generated-tools.json 为每条生成教具写入 public/tools/gen/{id}.html
 * 用法：npx tsx scripts/materialize-gen-html.ts
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { buildGeneratedToolFallbackHtml } from "../data/gen-tool-fallback-html";
import type { Tool } from "../data/tools/types";

interface Record {
  tool: Tool;
  createdAt: string;
}

const root = join(__dirname, "..");
const raw = JSON.parse(
  readFileSync(join(root, "data", "generated-tools.json"), "utf-8"),
) as Record[];
const dir = join(root, "public", "tools", "gen");
mkdirSync(dir, { recursive: true });

for (const rec of raw) {
  const t = rec.tool;
  const html = buildGeneratedToolFallbackHtml(t);
  writeFileSync(join(dir, `${t.id}.html`), html, "utf-8");
  console.log("wrote", t.id);
}
