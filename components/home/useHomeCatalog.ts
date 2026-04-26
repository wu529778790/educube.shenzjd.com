"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  buildCatalogSearchParams,
  getCatalogGradeId,
  getCatalogSearchInput,
  getCatalogTools,
  getDisplayTools,
} from "@/components/home/catalog";
import type { Tool } from "@/data/tools";

interface UpdateCatalogUrlOptions {
  grade?: string;
  q?: string;
}

interface UseHomeCatalogResult {
  gradeId: string;
  searchInput: string;
  searchQuery: string;
  displayCount: number;
  catalogTools: Tool[];
  displayTools: Tool[];
  handleGradeChange: (id: string) => void;
  handleSearchChange: (value: string) => void;
}

export function useHomeCatalog(tools: Tool[]): UseHomeCatalogResult {
  const router = useRouter();
  const searchParams = useSearchParams();

  const gradeId = getCatalogGradeId(searchParams);
  const [searchInput, setSearchInput] = useState(getCatalogSearchInput(searchParams));
  const searchQuery = useDeferredValue(searchInput);

  const updateUrl = useCallback(
    (overrides: UpdateCatalogUrlOptions) => {
      const next = buildCatalogSearchParams({
        current: searchParams,
        gradeId: overrides.grade ?? gradeId,
        query: overrides.q ?? searchQuery,
      });
      const qs = next.toString();
      router.replace(qs ? `?${qs}` : "/", { scroll: false });
    },
    [gradeId, router, searchParams, searchQuery],
  );

  useEffect(() => {
    const currentQ = searchParams.get("q") ?? "";

    if (currentQ !== searchQuery) {
      updateUrl({ q: searchQuery });
    }
  }, [searchParams, searchQuery, updateUrl]);

  const handleGradeChange = useCallback(
    (id: string) => {
      updateUrl({ grade: id });
    },
    [updateUrl],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const catalogTools = useMemo(() => getCatalogTools(tools, gradeId), [gradeId, tools]);
  const displayTools = useMemo(
    () => getDisplayTools(catalogTools, searchQuery),
    [catalogTools, searchQuery],
  );

  return {
    gradeId,
    searchInput,
    searchQuery,
    displayCount: displayTools.length,
    catalogTools,
    displayTools,
    handleGradeChange,
    handleSearchChange,
  };
}
