import { beforeEach, describe, expect, it } from "vitest";
import { fallbackPortfolioSnapshot } from "./fallback";
import { loadCachedPortfolio, saveCachedPortfolio } from "./cache";

describe("portfolio snapshot cache", () => {
  beforeEach(() => localStorage.clear());

  it("returns a saved schema-valid snapshot", () => {
    saveCachedPortfolio({ version: 4, content: fallbackPortfolioSnapshot });

    expect(loadCachedPortfolio()?.version).toBe(4);
  });

  it("does not replace a newer cached version with an older response", () => {
    saveCachedPortfolio({ version: 8, content: fallbackPortfolioSnapshot });
    saveCachedPortfolio({ version: 7, content: fallbackPortfolioSnapshot });

    expect(loadCachedPortfolio()?.version).toBe(8);
  });

  it("removes malformed cached data", () => {
    localStorage.setItem("portfolio:published:v1", JSON.stringify({ version: 2, content: {} }));

    expect(loadCachedPortfolio()).toBeNull();
    expect(localStorage.getItem("portfolio:published:v1")).toBeNull();
  });
});
