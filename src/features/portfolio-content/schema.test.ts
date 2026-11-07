import { describe, expect, it } from "vitest";
import { getPublicationIssues, parsePortfolioSnapshot } from "./schema";

const validSnapshot = {
  schemaVersion: 1,
  about: {
    name: "Abishek Priyan M",
    title: "About me",
    description: "I build reliable AI and web systems.",
    roles: ["AI Engineer", "Full-Stack Developer"],
    location: "Chennai, India",
    email: "abishek@example.com",
    social: {
      github: "https://github.com/example",
      linkedin: "",
      twitter: "",
      instagram: "",
    },
  },
  career: [
    {
      id: "career-freelance",
      position: "Freelance Full Stack Developer",
      company: "Self-Employed",
      period: "Dec 2025 - Present",
      location: "Chennai, India",
      description: "Leading full-stack product delivery.",
      responsibilities: ["Designed and delivered business platforms."],
      technologies: ["React", "FastAPI"],
      visible: true,
      order: 0,
    },
  ],
  projects: [
    {
      id: "project-revenueguard",
      slug: "revenueguard",
      title: "RevenueGuard",
      category: "AI payment operations",
      summary: "Decision support for failed-payment recovery.",
      technologies: ["Python", "React"],
      featured: true,
      visible: true,
      order: 0,
      cover: {
        assetId: null,
        path: "/images/placeholder.webp",
        alt: "RevenueGuard case overview",
      },
      gallery: [],
      links: {
        repository: "",
        live: "",
        evidence: "",
      },
      caseStudy: {
        problem: "Recovery decisions can cause duplicate charges.",
        constraints: "Only authoritative provider success counts.",
        system: "A recommendation and deterministic authorization workflow.",
        role: "Architecture and implementation.",
        engineering: "Idempotent workflows and conservative unknown states.",
        outcome: "Validated with test and synthetic data.",
        status: "Prototype",
        limitations: "Production recovery impact remains unproven.",
      },
      seo: {
        title: "RevenueGuard case study",
        description: "How RevenueGuard handles failed-payment recovery decisions.",
      },
    },
  ],
};

describe("parsePortfolioSnapshot", () => {
  it("accepts a complete version-one portfolio snapshot", () => {
    const result = parsePortfolioSnapshot(validSnapshot);

    expect(result.projects[0].slug).toBe("revenueguard");
    expect(result.career[0].visible).toBe(true);
  });

  it("keeps case studies disabled for older saved snapshots", () => {
    const result = parsePortfolioSnapshot(validSnapshot);

    expect(result.projects[0].caseStudyEnabled).toBe(false);
  });

  it("requires case-study fields only when the case study is enabled", () => {
    const incompleteProject = {
      ...validSnapshot.projects[0],
      caseStudy: { ...validSnapshot.projects[0].caseStudy, problem: "" },
    };
    const disabled = parsePortfolioSnapshot({ ...validSnapshot, projects: [incompleteProject] });
    const enabled = parsePortfolioSnapshot({
      ...validSnapshot,
      projects: [{ ...incompleteProject, caseStudyEnabled: true }],
    });

    expect(getPublicationIssues(disabled)).toEqual([]);
    expect(getPublicationIssues(enabled)).toEqual([
      {
        path: "projects.0.caseStudy.problem",
        message: "RevenueGuard: problem is required before publishing",
      },
    ]);
  });

  it("rejects duplicate project slugs", () => {
    const duplicate = {
      ...validSnapshot,
      projects: [validSnapshot.projects[0], { ...validSnapshot.projects[0], id: "project-two" }],
    };

    expect(() => parsePortfolioSnapshot(duplicate)).toThrow(/slug/i);
  });

  it("rejects unsafe project URLs", () => {
    const unsafe = structuredClone(validSnapshot);
    unsafe.projects[0].links.live = "javascript:alert(1)";

    expect(() => parsePortfolioSnapshot(unsafe)).toThrow();
  });

  it("rejects media without useful alternative text", () => {
    const missingAlt = structuredClone(validSnapshot);
    missingAlt.projects[0].cover.alt = "";

    expect(() => parsePortfolioSnapshot(missingAlt)).toThrow(/alt/i);
  });

  it("rejects unsupported future schema versions", () => {
    expect(() => parsePortfolioSnapshot({ ...validSnapshot, schemaVersion: 2 })).toThrow();
  });
});
