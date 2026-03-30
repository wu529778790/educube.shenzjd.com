/**
 * 教立方 — 课程体系分类（教材版本 / 年级 / 学科）
 * 与具体教具通过 publisherId + gradeId + subjectId 关联
 */

export interface Publisher {
  id: string;
  name: string;
  shortName: string;
}

export interface GradeLevel {
  id: string;
  name: string;
  stage: "primary" | "junior";
}

export interface Subject {
  id: string;
  name: string;
  shortName: string;
}

/** 主流小学数学教材版本（可继续扩展） */
export const publishers: Publisher[] = [
  { id: "pep", name: "人教版", shortName: "人教" },
  { id: "bsd", name: "北师大版", shortName: "北师大" },
  { id: "sue", name: "苏教版", shortName: "苏教" },
  { id: "xsw", name: "西师大版", shortName: "西师大" },
  { id: "jje", name: "冀教版", shortName: "冀教" },
  { id: "hue", name: "沪教版", shortName: "沪教" },
  { id: "qd", name: "青岛版", shortName: "青岛" },
  { id: "bj", name: "北京版", shortName: "北京" },
];

/** 小学 + 初中年级 */
export const grades: GradeLevel[] = [
  { id: "p1", name: "一年级", stage: "primary" },
  { id: "p2", name: "二年级", stage: "primary" },
  { id: "p3", name: "三年级", stage: "primary" },
  { id: "p4", name: "四年级", stage: "primary" },
  { id: "p5", name: "五年级", stage: "primary" },
  { id: "p6", name: "六年级", stage: "primary" },
  { id: "j7", name: "七年级", stage: "junior" },
  { id: "j8", name: "八年级", stage: "junior" },
  { id: "j9", name: "九年级", stage: "junior" },
];

/** 学科（当前以数学为主，其余为占位，便于后续扩展） */
export const subjects: Subject[] = [
  { id: "math", name: "数学", shortName: "数" },
  { id: "chinese", name: "语文", shortName: "语" },
  { id: "english", name: "英语", shortName: "英" },
  { id: "science", name: "科学", shortName: "科" },
  { id: "moral", name: "道德与法治", shortName: "道法" },
];

export function getPublisher(id: string): Publisher | undefined {
  return publishers.find((p) => p.id === id);
}

export function getGrade(id: string): GradeLevel | undefined {
  return grades.find((g) => g.id === id);
}

export function getSubject(id: string): Subject | undefined {
  return subjects.find((s) => s.id === id);
}

/** 面包屑文案，如「人教版 · 四年级 · 数学」 */
export function getPathLabel(
  publisherId: string,
  gradeId: string,
  subjectId: string,
): string {
  const pub = getPublisher(publisherId)?.name ?? publisherId;
  const gr = getGrade(gradeId)?.name ?? gradeId;
  const sub = getSubject(subjectId)?.name ?? subjectId;
  return `${pub} · ${gr} · ${sub}`;
}

/** 默认进入页时的路径（当前仅有教具的目录） */
export const defaultCatalogPath = {
  publisherId: "pep",
  gradeId: "p4",
  subjectId: "math",
} as const;
