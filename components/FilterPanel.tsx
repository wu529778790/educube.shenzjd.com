"use client";

import { useMemo } from "react";
import FilterButton from "@/components/home/FilterButton";
import {
  getFilterGradeCounts,
  getFilterPanelSections,
} from "@/components/home/filter-panel";
import type { Tool } from "@/data/tools";

interface FilterPanelProps {
  tools: Tool[];
  gradeId: string;
  subjectId: string;
  displayCount: number;
  onGradeChange: (gradeId: string) => void;
}

export default function FilterPanel({
  tools,
  gradeId,
  subjectId,
  displayCount,
  onGradeChange,
}: FilterPanelProps) {
  const counts = useMemo(
    () => getFilterGradeCounts(tools, subjectId),
    [tools, subjectId],
  );
  const sections = useMemo(
    () => getFilterPanelSections(gradeId, counts),
    [counts, gradeId],
  );

  return (
    <section
      id="catalog"
      className="max-w-[95.5rem] mx-auto px-4 sm:px-6 py-4 sm:py-5 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        <FilterButton
          active={sections.allOption.active}
          count={sections.allOption.count}
          label={sections.allOption.name}
          onClick={() => onGradeChange(sections.allOption.id)}
        />
        {sections.primaryOptions.map((grade) => (
          <FilterButton
            key={grade.id}
            active={grade.active}
            count={grade.count}
            label={grade.name}
            onClick={() => onGradeChange(grade.id)}
          />
        ))}
        <span className="px-1 text-sm leading-none" style={{ color: "var(--edu-border)" }} aria-hidden>|</span>
        {sections.juniorOptions.map((grade) => (
          <FilterButton
            key={grade.id}
            active={grade.active}
            count={grade.count}
            label={grade.name}
            onClick={() => onGradeChange(grade.id)}
          />
        ))}
        <span className="ml-auto text-sm" style={{ color: "var(--edu-text-muted)" }}>
          共 {displayCount} 个教具
        </span>
      </div>
    </section>
  );
}
