import { config } from "../../config";
import { parsePortfolioSnapshot } from "./schema";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export const fallbackPortfolioSnapshot = parsePortfolioSnapshot({
  schemaVersion: 1,
  about: {
    name: config.developer.fullName,
    title: config.about.title,
    description: config.about.description,
    roles: [config.developer.title, "Full-Stack Developer", "Freelancer"],
    location: config.social.location,
    email: config.contact.email,
    social: {
      github: config.contact.github,
      linkedin: config.contact.linkedin,
      twitter: config.contact.twitter,
      instagram: config.contact.instagram,
    },
  },
  career: config.experiences.map((experience, index) => ({
    id: `career-${slugify(`${experience.company}-${experience.position}`)}`,
    position: experience.position,
    company: experience.company,
    period: experience.period,
    location: experience.location,
    description: experience.description,
    responsibilities: experience.responsibilities,
    technologies: experience.technologies,
    visible: true,
    order: index,
  })),
  projects: config.projects.map((project, index) => ({
    id: `project-${slugify(project.title)}`,
    slug: slugify(project.title),
    title: project.title,
    category: project.category,
    summary: project.description,
    technologies: project.technologies
      .split(",")
      .map((technology) => technology.trim())
      .filter(Boolean),
    featured: index < 5,
    visible: true,
    order: index,
    cover: {
      assetId: null,
      path: project.image || "/images/placeholder.webp",
      alt: `${project.title} project preview`,
      caption: "",
    },
    gallery: [],
    links: {
      repository: "",
      live: project.link,
      evidence: "",
    },
    caseStudy: {
      problem: "",
      constraints: "",
      system: project.description,
      role: "",
      engineering: "",
      outcome: "",
      status: "Current portfolio entry",
      limitations: "Detailed evidence has not been added yet.",
    },
    seo: {
      title: `${project.title} — Abishek Priyan`,
      description: project.description.slice(0, 180),
    },
  })),
});
