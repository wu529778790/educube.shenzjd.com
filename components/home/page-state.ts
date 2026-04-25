export interface GetHomePageDisplayStateOptions {
  searchQuery: string;
  catalogCount: number;
  displayCount: number;
}

export interface HomePageDisplayState {
  kind: "ready" | "search-empty" | "catalog-empty" | "grade-empty";
  query: string;
}

export function getHomePageDisplayState({
  searchQuery,
  catalogCount,
  displayCount,
}: GetHomePageDisplayStateOptions): HomePageDisplayState {
  const query = searchQuery.trim();

  if (query && catalogCount > 0 && displayCount === 0) {
    return { kind: "search-empty", query };
  }

  if (catalogCount === 0) {
    return { kind: "catalog-empty", query };
  }

  if (displayCount === 0) {
    return { kind: "grade-empty", query };
  }

  return { kind: "ready", query };
}
