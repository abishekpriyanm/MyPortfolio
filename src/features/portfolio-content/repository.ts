import type { PortfolioSnapshot } from "./schema";
import type { PortfolioVersion } from "./types";

export type PortfolioRepository = {
  getPublished(): Promise<PortfolioVersion | null>;
  getDraft(): Promise<PortfolioVersion>;
  createDraft(content: PortfolioSnapshot): Promise<PortfolioVersion>;
  saveDraft(
    id: string,
    content: PortfolioSnapshot,
    expectedUpdatedAt: string
  ): Promise<PortfolioVersion>;
  publish(id: string, expectedUpdatedAt: string): Promise<PortfolioVersion>;
  listHistory(): Promise<PortfolioVersion[]>;
  rollback(id: string): Promise<PortfolioVersion>;
};

export type PortfolioRepositoryErrorCode =
  | "not-configured"
  | "not-found"
  | "unauthorized"
  | "stale"
  | "invalid-content"
  | "unavailable";

export class PortfolioRepositoryError extends Error {
  readonly code: PortfolioRepositoryErrorCode;
  readonly cause?: unknown;

  constructor(code: PortfolioRepositoryErrorCode, message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "PortfolioRepositoryError";
    this.code = code;
    this.cause = options?.cause;
  }
}
