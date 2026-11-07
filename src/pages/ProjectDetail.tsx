import { Link, useParams } from "react-router-dom";
import { usePortfolio } from "@/features/portfolio-content/PortfolioProvider";
import "./ProjectDetail.css";

const caseStudySections = [
  ["Problem", "problem"],
  ["Constraints", "constraints"],
  ["System", "system"],
  ["Role", "role"],
  ["Engineering", "engineering"],
  ["Outcome", "outcome"],
  ["Status", "status"],
  ["Limitations", "limitations"],
] as const;

const ProjectDetail = () => {
  const { slug } = useParams();
  const { content } = usePortfolio();
  const project = content.projects.find((item) => item.visible && item.slug === slug);

  if (!project) {
    return (
      <main className="project-detail-page project-detail-empty">
        <Link to="/myworks" className="back-button">← Back to Works</Link>
        <h1>Project not found</h1>
      </main>
    );
  }

  const externalLinks = [
    ["Live project", project.links.live],
    ["Repository", project.links.repository],
    ["Evidence", project.links.evidence],
  ].filter(([, url]) => Boolean(url));

  return (
    <main className="project-detail-page">
      <header className="project-detail-header">
        <Link to="/myworks" className="back-button">← Back to Works</Link>
        <p className="project-detail-category">{project.category}</p>
        <h1>{project.title}</h1>
        <p className="project-detail-summary">{project.summary}</p>
        <ul className="project-detail-technologies" aria-label="Technologies">
          {project.technologies.map((technology) => <li key={technology}>{technology}</li>)}
        </ul>
      </header>

      <figure className="project-detail-cover">
        <img src={project.cover.path} alt={project.cover.alt} decoding="async" />
        {project.cover.caption && <figcaption>{project.cover.caption}</figcaption>}
      </figure>

      {externalLinks.length > 0 && (
        <nav className="project-detail-links" aria-label="Project links">
          {externalLinks.map(([label, url]) => (
            <a key={label} href={url} target="_blank" rel="noopener noreferrer">{label} ↗</a>
          ))}
        </nav>
      )}

      {project.caseStudyEnabled && (
        <section className="project-detail-case-study" aria-labelledby="case-study-title">
          <h2 id="case-study-title">Case study</h2>
          <div className="project-detail-case-study-grid">
            {caseStudySections.map(([label, key]) => project.caseStudy[key] && (
              <article key={key}>
                <h3>{label}</h3>
                <p>{project.caseStudy[key]}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {project.gallery.length > 0 && (
        <section className="project-detail-gallery" aria-labelledby="gallery-title">
          <h2 id="gallery-title">Gallery</h2>
          <div>
            {project.gallery.map((media) => (
              <figure key={media.assetId ?? media.path}>
                <img src={media.path} alt={media.alt} loading="lazy" decoding="async" />
                {media.caption && <figcaption>{media.caption}</figcaption>}
              </figure>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ProjectDetail;
