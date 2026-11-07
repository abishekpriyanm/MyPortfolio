import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fallbackPortfolioSnapshot } from "@/features/portfolio-content/fallback";
import { ProjectsPage } from "./ProjectsPage";

const setContent = vi.fn();
let content = fallbackPortfolioSnapshot;

vi.mock("@/admin/features/content/DraftProvider", () => ({
  useDraft: () => ({
    content,
    setContent,
  }),
}));

describe("ProjectsPage case-study guidance", () => {
  beforeEach(() => {
    content = structuredClone(fallbackPortfolioSnapshot);
    setContent.mockClear();
  });

  it("lets the administrator enable an optional case study", () => {
    render(<ProjectsPage />);

    const toggle = screen.getByRole("checkbox", { name: /enable case study/i });
    expect(toggle).not.toBeChecked();
    expect(screen.getByText(/case study disabled.*will not block publishing/i)).toBeInTheDocument();

    fireEvent.click(toggle);

    const update = setContent.mock.calls[0][0] as (current: typeof content) => typeof content;
    expect(update(content).projects[0].caseStudyEnabled).toBe(true);
  });

  it("identifies publish-required fields and gives an example for each case-study field", () => {
    content = {
      ...content,
      projects: content.projects.map((project, index) => index === 0 ? { ...project, caseStudyEnabled: true } : project),
    };
    render(<ProjectsPage />);

    expect(screen.getByText(/required to publish when this project is visible/i)).toBeInTheDocument();

    const problem = screen.getByRole("textbox", { name: /problem.*required to publish/i });
    expect(problem).toHaveAttribute("aria-required", "true");
    expect(problem).toHaveAttribute("placeholder", expect.stringMatching(/^Example:/));

    const constraints = screen.getByRole("textbox", { name: "Constraints" });
    expect(constraints).not.toHaveAttribute("aria-required", "true");
    expect(constraints).toHaveAttribute("placeholder", expect.stringMatching(/^Example:/));

    for (const label of ["System", "Role", "Engineering", "Outcome", "Status", "Limitations"]) {
      const field = screen.getByRole("textbox", {
        name: new RegExp(`${label}.*required to publish`, "i"),
      });
      expect(field).toHaveAttribute("aria-required", "true");
      expect(field).toHaveAttribute("placeholder", expect.stringMatching(/^Example:/));
    }
  });
});
