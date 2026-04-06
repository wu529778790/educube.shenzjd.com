import { useMemo } from "react";
import type { SemesterFilter, Tool } from "@/data/tools";
import { getPathLabel, grades, subjects } from "@/data/curriculum";

interface FilterPanelProps {
  tools: Tool[];
  gradeId: string;
  subjectId: string;
  semesterFilter: SemesterFilter;
  catalogTools: Tool[];
  displayCount: number;
  onGradeChange: (gradeId: string) => void;
  onSubjectChange: (subjectId: string) => void;
  onSemesterChange: (semester: SemesterFilter) => void;
}

export default function FilterPanel({
  tools,
  gradeId,
  subjectId,
  semesterFilter,
  catalogTools,
  displayCount,
  onGradeChange,
  onSubjectChange,
  onSemesterChange,
}: FilterPanelProps) {
  const pathLabel = getPathLabel(gradeId, subjectId);
  const semesterSummary = semesterFilter === "all" ? "" : ` · ${semesterFilter}`;

  const { counts, semesterCounts, availableSubjects } = useMemo(() => {
    const grade = new Map<string, number>();
    const sub = new Map<string, number>();
    const subjectIds = new Set<string>();
    let upper = 0;
    let lower = 0;

    for (const t of tools) {
      if (t.subjectId === subjectId) {
        grade.set(t.gradeId, (grade.get(t.gradeId) ?? 0) + 1);
      }
      if (t.gradeId === gradeId) {
        sub.set(t.subjectId, (sub.get(t.subjectId) ?? 0) + 1);
      }
      subjectIds.add(t.subjectId);
    }
    grade.set("all", grade.size > 0 ? [...grade.values()].reduce((a, b) => a + b, 0) : 0);

    for (const t of catalogTools) {
      if (t.semester === "上册") upper++;
      else if (t.semester === "下册") lower++;
    }

    const available = subjects.filter((s) => subjectIds.has(s.id));

    return {
      counts: { grade, sub },
      semesterCounts: { all: catalogTools.length, upper, lower },
      availableSubjects: available,
    };
  }, [tools, catalogTools, gradeId, subjectId]);

  const countForGrade = (gid: string) => counts.grade.get(gid) ?? 0;
  const countForSubject = (sid: string) => counts.sub.get(sid) ?? 0;

  const primaryGrades = grades.filter((g) => g.stage === "primary");
  const juniorGrades = grades.filter((g) => g.stage === "junior");

  return (
    <section
      id="catalog"
      className="max-w-6xl mx-auto px-4 sm:px-6 pb-2 scroll-mt-20"
    >
      <details className="group rounded-xl border bg-white" style={{ borderColor: "var(--edu-border)" }}>
        <summary
          className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 [&::-webkit-details-marker]:hidden transition-colors hover:bg-white/50"
        >
          <div className="min-w-0 flex-1">
            <span
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--edu-text-muted)" }}
            >
              筛选条件
            </span>
            <p className="text-sm font-medium truncate" style={{ color: "var(--edu-text)" }}>
              {pathLabel}
              <span style={{ color: "var(--edu-text-secondary)" }}>{semesterSummary}</span>
              <span style={{ color: "var(--edu-text-muted)" }}>
                {" "}· 共 {displayCount} 个
              </span>
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-medium group-open:hidden"
            style={{ color: "var(--edu-accent)" }}
          >
            展开
          </span>
          <span
            className="hidden shrink-0 text-xs group-open:inline"
            style={{ color: "var(--edu-text-muted)" }}
          >
            收起
          </span>
        </summary>

        <div className="border-t px-4 pb-4 pt-3 space-y-3" style={{ borderColor: "var(--edu-border)" }}>
          <p className="text-[11px] leading-snug" style={{ color: "var(--edu-text-muted)" }}>
            选择年级与册别可快速定位对应教具。
          </p>

          {/* 年级 */}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
              年级
            </span>
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
                  {g.name.replace("年级", "")}
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
                  {g.name.replace("年级", "")}
                </FilterButton>
              ))}
            </div>
          </div>

          {/* 册别 */}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
              册别
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  { key: "all" as const, label: "全部", count: semesterCounts.all },
                  { key: "上册" as const, label: "上册", count: semesterCounts.upper },
                  { key: "下册" as const, label: "下册", count: semesterCounts.lower },
                ] satisfies { key: SemesterFilter; label: string; count: number }[]
              ).map((tab) => (
                <FilterButton
                  key={tab.key}
                  active={semesterFilter === tab.key}
                  onClick={() => onSemesterChange(tab.key)}
                  count={tab.count}
                >
                  {tab.label}
                </FilterButton>
              ))}
            </div>
          </div>

          {/* 学科 */}
          <div>
            <span className="mb-1.5 block text-[11px] font-bold" style={{ color: "var(--edu-text-muted)" }}>
              学科
            </span>
            <div className="flex flex-wrap gap-1.5">
              {availableSubjects.map((s) => (
                <FilterButton
                  key={s.id}
                  active={subjectId === s.id}
                  onClick={() => onSubjectChange(s.id)}
                  count={countForSubject(s.id)}
                >
                  {s.name}
                </FilterButton>
              ))}
            </div>
          </div>
        </div>
      </details>
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
