import "./styles/About.css";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";

const About = () => {
  const { content } = usePortfolio();
  return (
    <div className="about-section" id="about">
      <div className="about-me">
        <h3 className="title">{content.about.title}</h3>
        <p className="para">
          {content.about.description}
        </p>
      </div>
    </div>
  );
};

export default About;
