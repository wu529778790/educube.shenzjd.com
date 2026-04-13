import type { MetadataRoute } from "next";
import { tools } from "@/data/tools";
import { loadGeneratedTools } from "@/data/generated-tools";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://educube.cn";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const generated = await loadGeneratedTools();
  const allTools = [...tools, ...generated];

  const toolPages = allTools
    .filter((tool) => !tool.id.startsWith("gen-"))
    .map((tool) => ({
      url: `${BASE_URL}/tools/${tool.id}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...toolPages,
  ];
}
