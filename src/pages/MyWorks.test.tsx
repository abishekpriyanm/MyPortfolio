import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackPortfolioSnapshot } from "@/features/portfolio-content/fallback";
import MyWorks from "./MyWorks";

let content = fallbackPortfolioSnapshot;

vi.mock("@/features/portfolio-content/PortfolioProvider", () => ({
  usePortfolio: () => ({ content, source: "live" }),
}));

describe("MyWorks", () => {
  beforeEach(() => {
    content = {
      ...structuredClone(fallbackPortfolioSnapshot),
      projects: [
        {
          ...fallbackPortfolioSnapshot.projects[0],
          id: "published-project",
          title: "Published project from the CMS",
          category: "Published category",
          summary: "This summary came from the published portfolio snapshot.",
          technologies: ["React", "Supabase"],
          visible: true,
          order: 1,
        },
        {
          ...fallbackPortfolioSnapshot.projects[1],
          id: "hidden-project",
          title: "Hidden CMS project",
          visible: false,
          order: 0,
        },
      ],
    };
  });

  it("renders only visible projects from the published portfolio in their configured order", () => {
    render(
      <MemoryRouter>
        <MyWorks />
      </MemoryRouter>
    );

    expect(screen.getByText("Published project from the CMS")).toBeInTheDocument();
    expect(screen.getByText("Published category")).toBeInTheDocument();
    expect(screen.getByText("This summary came from the published portfolio snapshot.")).toBeInTheDocument();
    expect(screen.getByText("React, Supabase")).toBeInTheDocument();
    expect(screen.queryByText("Hidden CMS project")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /published project from the cms/i })).toHaveAttribute(
      "href",
      `/projects/${content.projects[0].slug}`
    );
  });
});
