import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";

const siteUrl = "https://abishekpriyan.dev";
const defaultTitle = "Abishek Priyan M | AI Engineer & Full-Stack Developer";
const defaultDescription = "Explore Abishek Priyan M’s work building AI systems, full-stack applications, and practical software products.";

function setMeta(attribute: "name" | "property", key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

export default function Seo() {
  const { pathname } = useLocation();
  const { content } = usePortfolio();
  const project = pathname.startsWith("/projects/")
    ? content.projects.find((item) => item.visible && `/projects/${item.slug}` === pathname)
    : undefined;

  useEffect(() => {
    const title = project ? (project.seo.title || `${project.title} | Abishek Priyan M`)
      : pathname === "/myworks" ? "Projects | Abishek Priyan M"
      : pathname === "/play" ? "Chess | Abishek Priyan M" : defaultTitle;
    const description = project ? (project.seo.description || project.summary)
      : pathname === "/myworks" ? "Explore AI systems, full-stack applications, and other projects by Abishek Priyan M."
      : pathname === "/play" ? "Play chess on Abishek Priyan M’s portfolio." : defaultDescription;
    const url = `${siteUrl}${pathname === "/" ? "/" : pathname.replace(/\/$/, "")}`;

    document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }, [pathname, project]);

  return null;
}
