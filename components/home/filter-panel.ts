import { grades } from "@/data/curriculum";
import type { Tool } from "@/data/tools";

export function getFilterGradeCounts(
  tools: Tool[],
  subjectId: string,
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const tool of tools) {
    if (tool.subjectId === subjectId) {
      counts.set(tool.gradeId, (counts.get(tool.gradeId) ?? 0) + 1);
    }
  }

  counts.set(
    "all",
    counts.size > 0 ? [...counts.values()].reduce((left, right) => left + right, 0) : 0,
  );

  return counts;
}

export function getPrimaryGrades() {
  return grades.filter((grade) => grade.stage === "primary");
}

export function getJuniorGrades() {
  return grades.filter((grade) => grade.stage === "junior");
}
