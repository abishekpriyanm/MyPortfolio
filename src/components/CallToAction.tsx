import { Link } from "react-router-dom";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";
import "./styles/CallToAction.css";

const CallToAction = () => {
  const { content } = usePortfolio();
  const hireLink = content.about.social.linkedin || `mailto:${content.about.email}`;

  return (
    <div className="cta-section">
      <div className="cta-buttons">
        <Link to="/play" className="cta-btn cta-btn-play" data-cursor="disable">
          Play With Me →
        </Link>
        
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
