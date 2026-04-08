"use client";

import { useMemo } from "react";
import type { Tool } from "@/data/tools";
import { grades } from "@/data/curriculum";

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
  const counts = useMemo(() => {
    const grade = new Map<string, number>();
    for (const t of tools) {
      if (t.subjectId === subjectId) {
        grade.set(t.gradeId, (grade.get(t.gradeId) ?? 0) + 1);
      }
    }
    grade.set("all", grade.size > 0 ? [...grade.values()].reduce((a, b) => a + b, 0) : 0);
    return grade;
  }, [tools, subjectId]);

  const countForGrade = (gid: string) => counts.get(gid) ?? 0;

  const primaryGrades = grades.filter((g) => g.stage === "primary");
  const juniorGrades = grades.filter((g) => g.stage === "junior");

  return (
    <section
      id="catalog"
      className="max-w-6xl mx-auto px-4 sm:px-6 py-3 scroll-mt-20"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <FilterButton
          active={gradeId === "all"}
          onClick={() => onGradeChange("all")}
          count={countForGrade("all")}
        >
          全部
        </FilterButton>
        {primaryGrades.map((g) => (
          <FilterButton
            key={g.id}
            active={gradeId === g.id}
            onClick={() => onGradeChange(g.id)}
            count={countForGrade(g.id)}
          >
            {g.name}
          </FilterButton>
        ))}
        <span className="px-1" style={{ color: "var(--edu-border)" }} aria-hidden>|</span>
        {juniorGrades.map((g) => (
          <FilterButton
            key={g.id}
            active={gradeId === g.id}
            onClick={() => onGradeChange(g.id)}
            count={countForGrade(g.id)}
          >
            {g.name}
          </FilterButton>
        ))}
        <span className="ml-auto text-xs" style={{ color: "var(--edu-text-muted)" }}>
          共 {displayCount} 个教具
        </span>
      </div>

      {/* ── 其他学科即将上线 ── */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: "var(--edu-text-muted)" }}>
          即将上线
        </span>
        {["语文", "英语", "科学", "道德与法治"].map((subject) => (
          <span
            key={subject}
            className="inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-medium opacity-40 line-through select-none"
            style={{
              borderColor: "var(--edu-border)",
              background: "var(--edu-surface)",
              color: "var(--edu-text-muted)",
            }}
          >
            {subject}
          </span>
        ))}
      </div>
    </section>
  );
}

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  count: number;
  children: React.ReactNode;
}

function FilterButton({
  active,
  onClick,
  count,
  children,
}: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className="inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all"
      style={{
        borderColor: active ? "var(--edu-primary)" : "var(--edu-border)",
        background: active ? "var(--edu-primary)" : "var(--edu-surface)",
        color: active ? "white" : "var(--edu-text-secondary)",
      }}
    >
      {children}
      <span style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--edu-text-muted)" }}>
        {count}
      </span>
    </button>
  );
}
