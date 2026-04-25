import { revalidatePath } from "next/cache";
import { saveGeneratedTool } from "@/data/generated-tools";
import type { Tool } from "@/data/tools";
import type { SaveGeneratedToolMeta } from "@/lib/generated-tools/repository";

export interface PublishGeneratedToolInput {
  id: string;
  html: string;
  meta: SaveGeneratedToolMeta;
}

export async function publishGeneratedTool(
  input: PublishGeneratedToolInput,
): Promise<Tool> {
  const tool = await saveGeneratedTool(input.id, input.html, input.meta);
  revalidatePath("/");
  return tool;
}
