import { Link } from "react-router-dom";
import { usePortfolio } from "@/features/portfolio-content/PortfolioProvider";
import "./MyWorks.css";

const MyWorks = () => {
  const { content } = usePortfolio();
  const projects = content.projects
    .filter((project) => project.visible)
    .sort((left, right) => left.order - right.order);

  return (
    <div className="myworks-page">
      <div className="myworks-header">
        <Link to="/" className="back-button" data-cursor="disable">
          ← Back to Home
        </Link>
        <h1>
          All <span>Works</span>
        </h1>
        <p>A collection of all my projects and creations</p>
      </div>

      <div className="myworks-grid">
        {projects.map((project, index) => {
          const detailLink = `/projects/${project.slug}`;
          const cardContent = (
            <>
              <div className="myworks-card-number">0{index + 1}</div>
              <div className="myworks-card-image">
                <img src={project.cover.path} alt={project.cover.alt} loading="lazy" decoding="async" />
              </div>
              <div className="myworks-card-info">
                <h3>{project.title}</h3>
                <p className="myworks-card-category">{project.category}</p>
                <p className="myworks-card-description">{project.summary}</p>
                <p className="myworks-card-tech">{project.technologies.join(", ")}</p>
              </div>
            </>
          );

          return (
            <Link className="myworks-card" key={project.id} data-cursor="disable" to={detailLink}>
              {cardContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MyWorks;
