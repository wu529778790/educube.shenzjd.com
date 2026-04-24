import {
  fileSystemGeneratedToolsRepository,
} from "@/lib/generated-tools/file-system-repository";
import type { GeneratedToolsRepository } from "@/lib/generated-tools/repository";

export function getDefaultGeneratedToolsRepository(): GeneratedToolsRepository {
  return fileSystemGeneratedToolsRepository;
}
