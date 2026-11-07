import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";
import { config } from "../config";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const { content } = usePortfolio();
  const hireLink = content.about.social.linkedin || `mailto:${config.contact.email}`;

  return (
    <div className="cta-section">
      <div className="cta-buttons">
        <a 
          href={hireLink}
          target="_blank" 
          rel="noopener noreferrer" 
          className="cta-btn cta-btn-hire"
          data-cursor="disable"
        >
          Hire Me →
        </a>
      </div>
    </div>
  );
};

export default CallToAction;
