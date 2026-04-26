import { getGrade } from "@/data/curriculum";
import type { Tool } from "@/data/tools";

export interface ToolCardViewModel {
  animationDelay: string;
  chapter: string;
  description: string;
  gradientBorder: string;
  gradientTopBar: string;
  gradeLabel: string;
  hoverTitleColor: string;
  icon: string;
  iconBackground: string;
  iconBorder: string;
  name: string;
  semester: string;
  subtitle: string;
  subtitleMeta: string;
  tagBackground: string;
  tagBorder: string;
  tagColor: string;
  tags: string[];
}

export function getToolCardViewModel(
  tool: Tool,
  index: number,
): ToolCardViewModel {
  const accentColor = tool.gradient[0];
  const gradeLabel = getGrade(tool.gradeId)?.name ?? tool.gradeId;

  return {
    animationDelay: `${Math.min(index * 80, 800)}ms`,
    chapter: tool.chapter,
    description: tool.description,
    gradientBorder: `1px solid ${accentColor}18`,
    gradientTopBar: `linear-gradient(135deg, ${tool.gradient[0]}, ${tool.gradient[1]})`,
    gradeLabel,
    hoverTitleColor: accentColor,
    icon: tool.icon,
    iconBackground: `linear-gradient(135deg, ${tool.gradient[0]}14, ${tool.gradient[1]}22)`,
    iconBorder: `1px solid ${accentColor}18`,
    name: tool.name,
    semester: tool.semester,
    subtitle: tool.subtitle,
    subtitleMeta: `${tool.subtitle} · ${gradeLabel} · ${tool.semester}`,
    tagBackground: `${accentColor}10`,
    tagBorder: `1px solid ${accentColor}18`,
    tagColor: accentColor,
    tags: tool.tags,
  };
}
