import { grades } from "@/data/curriculum";
import type { Tool } from "@/data/tools";

export interface FilterGradeOption {
  id: string;
  name: string;
  count: number;
  active: boolean;
}

export interface FilterPanelSections {
  allOption: FilterGradeOption;
  primaryOptions: FilterGradeOption[];
  juniorOptions: FilterGradeOption[];
}

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

export function getFilterPanelSections(
  gradeId: string,
  counts: Map<string, number>,
): FilterPanelSections {
  const createOption = (id: string, name: string): FilterGradeOption => ({
    id,
    name,
    count: counts.get(id) ?? 0,
    active: gradeId === id,
  });

  return {
    allOption: createOption("all", "全部"),
    primaryOptions: getPrimaryGrades().map((grade) =>
      createOption(grade.id, grade.name),
    ),
    juniorOptions: getJuniorGrades().map((grade) =>
      createOption(grade.id, grade.name),
    ),
  };
}
