"use client";

import type { Tool } from "@/data/tools";
import HomeCatalogState from "@/components/home/HomeCatalogState";
import { useHomeCatalog } from "@/components/home/useHomeCatalog";
import { defaultCatalogPath } from "@/data/curriculum";
import Header from "./Header";
import FilterPanel from "./FilterPanel";

export default function HomePageContent({ tools }: { tools: Tool[] }) {
  const {
    gradeId,
    searchInput,
    searchQuery,
    displayCount,
    catalogTools,
    displayTools,
    handleGradeChange,
    handleSearchChange,
  } = useHomeCatalog(tools);

  return (
    <div
      className="flex min-h-screen flex-col"
      style={{ background: "var(--edu-bg)" }}
    >
      <Header searchInput={searchInput} onSearchChange={handleSearchChange} />

      {/* ── 筛选 ── */}
      <FilterPanel
        tools={tools}
        gradeId={gradeId}
        subjectId={defaultCatalogPath.subjectId}
        displayCount={displayCount}
        onGradeChange={handleGradeChange}
      />

      <main className="flex w-full min-h-0 flex-1 flex-col">
        <h2 id="main-content" className="sr-only">
          教具列表
        </h2>
        <section
          id="tools"
          className="mx-auto w-full max-w-[95.5rem] scroll-mt-20 px-4 pb-20 sm:px-6"
        >
          <HomeCatalogState
            catalogTools={catalogTools}
            displayTools={displayTools}
            searchQuery={searchQuery}
          />
        </section>
      </main>

      {/* ── 页脚 ── */}
      <footer
        className="shrink-0 border-t"
        style={{ borderColor: "var(--edu-border)", background: "var(--edu-surface)" }}
      >
        <div
          className="max-w-[95.5rem] mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm"
          style={{ color: "var(--edu-text-muted)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
              style={{ background: "var(--edu-primary)" }}
            >
              教
            </div>
            <span>教立方 EduCube</span>
          </div>
          <span>多年级 · 数学 · 交互教具持续扩充</span>
        </div>
      </footer>
    </div>
  );
}
