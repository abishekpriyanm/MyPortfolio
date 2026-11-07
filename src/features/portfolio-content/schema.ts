import { z } from "zod";

const optionalHttpUrl = z
  .string()
  .trim()
  .refine(
    (value) => value === "" || /^https?:\/\//i.test(value),
    "Links must be empty or use http/https"
  );

const stableId = z
  .string()
  .trim()
  .min(3)
  .max(120)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "IDs must use lowercase letters, numbers, and hyphens");

export const MediaReferenceSchema = z.object({
  assetId: z.string().uuid().nullable(),
  path: z.string().trim().min(1).max(500),
  alt: z.string().trim().min(3, "Media alt text is required").max(220),
  caption: z.string().trim().max(300).optional().default(""),
});

export const CareerEntrySchema = z.object({
  id: stableId,
  position: z.string().trim().min(1).max(120),
  company: z.string().trim().min(1).max(120),
  period: z.string().trim().min(1).max(80),
  location: z.string().trim().max(120).default(""),
  description: z.string().trim().min(1).max(600),
  responsibilities: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  technologies: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  visible: z.boolean(),
  order: z.number().int().nonnegative(),
});

export const ProjectSchema = z.object({
  id: stableId,
  slug: stableId.max(80),
  title: z.string().trim().min(1).max(140),
  category: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(700),
  technologies: z.array(z.string().trim().min(1).max(60)).max(40).default([]),
  featured: z.boolean(),
  visible: z.boolean(),
  caseStudyEnabled: z.boolean().default(false),
  order: z.number().int().nonnegative(),
  cover: MediaReferenceSchema,
  gallery: z.array(MediaReferenceSchema).max(20).default([]),
  links: z.object({
    repository: optionalHttpUrl.default(""),
    live: optionalHttpUrl.default(""),
    evidence: optionalHttpUrl.default(""),
  }),
  caseStudy: z.object({
    problem: z.string().trim().max(3000).default(""),
    constraints: z.string().trim().max(3000).default(""),
    system: z.string().trim().max(4000).default(""),
    role: z.string().trim().max(2000).default(""),
    engineering: z.string().trim().max(5000).default(""),
    outcome: z.string().trim().max(3000).default(""),
    status: z.string().trim().max(100).default(""),
    limitations: z.string().trim().max(3000).default(""),
  }),
  seo: z.object({
    title: z.string().trim().max(70).default(""),
    description: z.string().trim().max(180).default(""),
  }),
});

export const PortfolioSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    about: z.object({
      name: z.string().trim().min(1).max(120),
      title: z.string().trim().min(1).max(100),
      description: z.string().trim().min(1).max(6000),
      roles: z.array(z.string().trim().min(1).max(100)).max(10).default([]),
      location: z.string().trim().max(120).default(""),
      email: z.string().trim().email(),
      social: z.object({
        github: optionalHttpUrl.default(""),
        linkedin: optionalHttpUrl.default(""),
        twitter: optionalHttpUrl.default(""),
        instagram: optionalHttpUrl.default(""),
      }),
    }),
    career: z.array(CareerEntrySchema).max(30),
    projects: z.array(ProjectSchema).max(50),
  })
  .superRefine((snapshot, context) => {
    const slugs = new Set<string>();

    snapshot.projects.forEach((project, index) => {
      if (slugs.has(project.slug)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate project slug: ${project.slug}`,
          path: ["projects", index, "slug"],
        });
      }
      slugs.add(project.slug);
    });
  });

export type PortfolioSnapshot = z.infer<typeof PortfolioSnapshotSchema>;
export type CareerEntry = z.infer<typeof CareerEntrySchema>;
export type PortfolioProject = z.infer<typeof ProjectSchema>;
export type MediaReference = z.infer<typeof MediaReferenceSchema>;

export const parsePortfolioSnapshot = (value: unknown): PortfolioSnapshot =>
  PortfolioSnapshotSchema.parse(value);

export type PublicationIssue = {
  path: string;
  message: string;
};

export const getPublicationIssues = (snapshot: PortfolioSnapshot): PublicationIssue[] => {
  const issues: PublicationIssue[] = [];

  snapshot.projects.forEach((project, index) => {
    if (!project.visible || !project.caseStudyEnabled) return;

    const requiredCaseStudyFields = [
      ["problem", project.caseStudy.problem],
      ["system", project.caseStudy.system],
      ["role", project.caseStudy.role],
      ["engineering", project.caseStudy.engineering],
      ["outcome", project.caseStudy.outcome],
      ["status", project.caseStudy.status],
      ["limitations", project.caseStudy.limitations],
    ] as const;

    requiredCaseStudyFields.forEach(([field, value]) => {
      if (!value.trim()) {
        issues.push({
          path: `projects.${index}.caseStudy.${field}`,
          message: `${project.title}: ${field} is required before publishing`,
        });
      }
    });
  });

  return issues;
};
