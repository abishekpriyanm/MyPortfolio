import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackPortfolioSnapshot } from "./fallback";
import { PortfolioProvider, usePortfolio } from "./PortfolioProvider";

const getPublished = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({}),
}));

vi.mock("./supabaseRepository", () => ({
  createSupabasePortfolioRepository: () => ({ getPublished }),
}));

const VisitorContent = () => {
  const { content, source } = usePortfolio();
  return <p>{source}:{content.projects[0]?.title}</p>;
};

describe("PortfolioProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
    getPublished.mockResolvedValue({
      version: 2,
      content: {
        ...fallbackPortfolioSnapshot,
        projects: [{
          ...fallbackPortfolioSnapshot.projects[0],
          title: "Published database content",
        }],
      },
    });
  });

  it("replaces the build-time fallback with the published database snapshot", async () => {
    render(<PortfolioProvider><VisitorContent /></PortfolioProvider>);

    await waitFor(() => {
      expect(screen.getByText("live:Published database content")).toBeInTheDocument();
    });
    expect(getPublished).toHaveBeenCalledOnce();
  });
});
