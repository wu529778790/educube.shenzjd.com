import { defaultCatalogPath } from "@/data/curriculum";
import { filterToolsByCatalog } from "@/data/tools";
import type { Tool } from "@/data/tools";

export function getCatalogGradeId(searchParams: URLSearchParams): string {
  return searchParams.get("grade") ?? defaultCatalogPath.gradeId;
}

export function getCatalogSearchInput(searchParams: URLSearchParams): string {
  return searchParams.get("q") ?? "";
}

export function buildCatalogSearchParams(input: {
  current: URLSearchParams;
  gradeId: string;
  query: string;
}): URLSearchParams {
  const next = new URLSearchParams(input.current);

  if (input.gradeId && input.gradeId !== defaultCatalogPath.gradeId) {
    next.set("grade", input.gradeId);
  } else {
    next.delete("grade");
  }

  if (input.query) {
    next.set("q", input.query);
  } else {
    next.delete("q");
  }

  return next;
}

export function getCatalogTools(tools: Tool[], gradeId: string): Tool[] {
  return filterToolsByCatalog(tools, gradeId, defaultCatalogPath.subjectId);
}

export function getDisplayTools(
  tools: Tool[],
  searchQuery: string,
): Tool[] {
  let list = tools;

  if (searchQuery.trim()) {
    const query = searchQuery.trim().toLowerCase();
    list = list.filter(
      (tool) =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.chapter.toLowerCase().includes(query) ||
        tool.tags.some((tag) => tag.toLowerCase().includes(query)),
    );
  }

  return sortToolsForDisplay(list);
}

function sortToolsForDisplay(list: Tool[]): Tool[] {
  return [...list].sort((left, right) => {
    if (left.semester !== right.semester) {
      return left.semester === "上册" ? -1 : 1;
    }

    if (left.unitNum !== right.unitNum) {
      return left.unitNum - right.unitNum;
    }

    return left.id.localeCompare(right.id);
  });
}
