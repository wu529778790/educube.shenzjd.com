import {
  fileSystemGeneratedToolsRepository,
} from "@/lib/generated-tools/file-system-repository";
import type { GeneratedToolsRepository } from "@/lib/generated-tools/repository";
import { GENERATED_TOOLS_BACKEND } from "@/lib/runtime-config";

export function getDefaultGeneratedToolsRepository(): GeneratedToolsRepository {
  if (GENERATED_TOOLS_BACKEND === "filesystem") {
    return fileSystemGeneratedToolsRepository;
  }

  throw new Error(
    `Unsupported GENERATED_TOOLS_BACKEND backend: ${GENERATED_TOOLS_BACKEND}`,
  );
}
