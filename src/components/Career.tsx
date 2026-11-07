import "./styles/Career.css";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";

const Career = () => {
  const { content } = usePortfolio();
  const entries = content.career
    .filter((entry) => entry.visible)
    .sort((left, right) => left.order - right.order);

  return (
    <div className="career-section section-container">
      <div className="career-container">
        <h2>
          My career <span>&</span>
          <br /> experience
        </h2>
        <div className="career-info">
          <div className="career-timeline" aria-hidden="true">
            <div className="career-dot"></div>
          </div>
          {entries.map((exp) => (
            <div key={exp.id} className="career-info-box">
              <div className="career-info-in">
                <div className="career-role">
                  <h4>{exp.position}</h4>
                  <h5>{exp.company}</h5>
                </div>
                <span className="career-period">
                  {exp.period.replace(/\b([A-Z][a-z]{2}) (\d{4})\b/g, "$1\u00a0$2")}
                </span>
              </div>
              <p>{exp.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Career;
