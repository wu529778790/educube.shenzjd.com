export type { Semester, SemesterFilter } from "./types";
export type { Tool } from "./types";

import type { Tool } from "./types";
import { p3Tools } from "./p3";
import { p4Tools } from "./p4";
import { p5Tools } from "./p5";
import { p6Tools } from "./p6";

export const tools: Tool[] = [...p3Tools, ...p4Tools, ...p5Tools, ...p6Tools];

export function filterToolsByCatalog(
  list: Tool[],
  gradeId: string,
  subjectId: string,
): Tool[] {
  return list.filter(
    (t) =>
      (gradeId === "all" || t.gradeId === gradeId) &&
      t.subjectId === subjectId,
  );
}

export function getToolById(id: string): Tool | undefined {
  return tools.find((t) => t.id === id);
}
