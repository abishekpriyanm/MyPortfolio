import { parsePortfolioSnapshot, type PortfolioSnapshot } from "./schema";

const CACHE_KEY = "portfolio:published:v1";

export type CachedPortfolio = {
  version: number;
  content: PortfolioSnapshot;
};

export const loadCachedPortfolio = (): CachedPortfolio | null => {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return null;

  try {
    const candidate = JSON.parse(raw) as { version?: unknown; content?: unknown };
    if (!Number.isSafeInteger(candidate.version) || Number(candidate.version) < 1) {
      throw new Error("Invalid cached portfolio version");
    }

    return {
      version: Number(candidate.version),
      content: parsePortfolioSnapshot(candidate.content),
    };
  } catch {
    window.localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

export const saveCachedPortfolio = (next: CachedPortfolio): void => {
  if (typeof window === "undefined") return;

  const content = parsePortfolioSnapshot(next.content);
  const current = loadCachedPortfolio();
  if (current && current.version > next.version) return;

  window.localStorage.setItem(CACHE_KEY, JSON.stringify({ version: next.version, content }));
};
