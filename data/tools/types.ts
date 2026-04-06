export type Semester = "上册" | "下册";
export type SemesterFilter = "all" | Semester;

export interface Tool {
  id: string;
  name: string;
  subtitle: string;
  /** 显示用章节字符串，如 "上册 · 第三单元" */
  chapter: string;
  /** 学期，用于首页筛选 */
  semester: Semester;
  /** 单元序号，用于组内排序；数学广角统一用 99 */
  unitNum: number;
  /** 年级 id，如 p4 */
  gradeId: string;
  /** 学科 id，如 math */
  subjectId: string;
  description: string;
  tags: string[];
  gradient: [string, string];
  icon: string;
}
