import { describe, expect, it } from "vitest";
import { getHomePageDisplayState } from "@/components/home/page-state";

describe("home page display state", () => {
  it("在搜索有结果池但无匹配项时返回搜索空态", () => {
    expect(
      getHomePageDisplayState({
        searchQuery: "  分数  ",
        catalogCount: 3,
        displayCount: 0,
      }),
    ).toEqual({
      kind: "search-empty",
      query: "分数",
    });
  });

  it("在目录本身为空时返回目录空态", () => {
    expect(
      getHomePageDisplayState({
        searchQuery: "",
        catalogCount: 0,
        displayCount: 0,
      }),
    ).toEqual({
      kind: "catalog-empty",
      query: "",
    });
  });

  it("在当前年级无教具时返回年级空态", () => {
    expect(
      getHomePageDisplayState({
        searchQuery: "",
        catalogCount: 2,
        displayCount: 0,
      }),
    ).toEqual({
      kind: "grade-empty",
      query: "",
    });
  });

  it("在有可展示教具时返回 ready", () => {
    expect(
      getHomePageDisplayState({
        searchQuery: "面积",
        catalogCount: 2,
        displayCount: 1,
      }),
    ).toEqual({
      kind: "ready",
      query: "面积",
    });
  });
});
