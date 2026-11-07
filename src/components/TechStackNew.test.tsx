import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import TechStackNew from "./TechStackNew";

describe("Tech Stack", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });
  it("opens with all tools and lets visitors switch to AI skills and back", async () => {
    const user = userEvent.setup();
    render(<TechStackNew />);

    expect(screen.getByRole("tab", { name: "All tools" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("link", { name: "React" })).toBeVisible();
    await user.click(screen.getByRole("tab", { name: "By domain" }));

    const panel = screen.getByRole("tabpanel", { name: "AI & Agents" });
    expect(within(panel).getByRole("link", { name: "LangChain" })).toBeVisible();
    expect(within(panel).getByText("RAG")).toBeVisible();
    expect(within(panel).queryByRole("link", { name: "React" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "All tools" }));
    expect(screen.getByRole("link", { name: "React" })).toBeVisible();
    expect(screen.queryByRole("tab", { name: "AI & Agents" })).not.toBeInTheDocument();
  });

  it("supports arrow, Home, and End keys for both tab groups", async () => {
    const user = userEvent.setup();
    render(<TechStackNew />);
    await user.tab();
    expect(screen.getByRole("tab", { name: "All tools" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "By domain" })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole("tab", { name: "AI & Agents" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Backend" })).toHaveFocus();
    const panel = screen.getByRole("tabpanel", { name: "Backend" });
    expect(within(panel).getByRole("link", { name: "FastAPI" })).toBeVisible();
    expect(within(panel).getByRole("link", { name: "Flask" })).toBeVisible();
    expect(within(panel).getByRole("link", { name: "Express" })).toBeVisible();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Cloud & Delivery" })).toHaveFocus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "AI & Agents" })).toHaveFocus();
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByRole("tab", { name: "Cloud & Delivery" })).toHaveFocus();
    await user.keyboard("{Home}");
    expect(screen.getByRole("tab", { name: "AI & Agents" })).toHaveFocus();
  });

  it("shows each domain and remembers the chosen domain when returning", async () => {
    const user = userEvent.setup();
    render(<TechStackNew />);
    await user.click(screen.getByRole("tab", { name: "By domain" }));
    for (const [domain, skill] of [["Frontend", "React"], ["Data & Databases", "PostgreSQL"], ["Cloud & Delivery", "Docker"]]) {
      await user.click(screen.getByRole("tab", { name: domain }));
      expect(within(screen.getByRole("tabpanel", { name: domain })).getByRole("link", { name: skill })).toBeVisible();
    }
    await user.click(screen.getByRole("tab", { name: "All tools" }));
    await user.click(screen.getByRole("tab", { name: "By domain" }));
    expect(screen.getByRole("tab", { name: "Cloud & Delivery" })).toHaveAttribute("aria-selected", "true");
  });

  it("pauses decorative video for reduced motion and responds to preference changes", () => {
    let matches = true;
    let onChange = () => {};
    const removeEventListener = vi.fn();
    vi.stubGlobal("matchMedia", () => ({
      get matches() { return matches; },
      addEventListener: (_event: string, listener: () => void) => { onChange = listener; },
      removeEventListener,
    }));
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue();
    const { unmount } = render(<TechStackNew />);
    expect(pause).toHaveBeenCalledOnce();
    expect(play).not.toHaveBeenCalled();
    matches = false;
    onChange();
    expect(play).toHaveBeenCalledOnce();
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
  });
});
