export type {
  CareerEntry,
  MediaReference,
  PortfolioProject,
  PortfolioSnapshot,
  PublicationIssue,
} from "./schema";

export type PortfolioVersionState = "draft" | "published" | "archived";

export type PortfolioVersion = {
  id: string;
  version: number;
  state: PortfolioVersionState;
  content: import("./schema").PortfolioSnapshot;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};
