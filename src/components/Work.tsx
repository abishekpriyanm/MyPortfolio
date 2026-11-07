import "./styles/Work.css";
import WorkImage from "./WorkImage";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef } from "react";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";
import { Link } from "react-router-dom";

gsap.registerPlugin(ScrollTrigger);

const Work = () => {
  const { content } = usePortfolio();
  const sectionRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const projects = content.projects
    .filter((project) => project.visible)
    .sort((left, right) => left.order - right.order)
    .slice(0, 5);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const rail = railRef.current;
    if (!section || !rail) return;

    let active = true;
    let refreshFrame = 0;
    const refresh = () => {
      if (!active || refreshFrame) return;
      refreshFrame = requestAnimationFrame(() => {
        refreshFrame = requestAnimationFrame(() => {
          refreshFrame = 0;
          if (active) ScrollTrigger.refresh();
        });
      });
    };
    const travel = () => Math.max(0, rail.scrollWidth - rail.clientWidth);
    const media = gsap.matchMedia();
    media.add("(min-width: 769px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.fromTo(rail, { x: 0 }, {
        x: () => -travel(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${Math.max(1, travel())}`,
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          id: "work",
          invalidateOnRefresh: true,
        },
      });
      refresh();
    });

    // Published content can change the height of any preceding story section.
    const observer = new ResizeObserver(refresh);
    observer.observe(rail);
    let previous = section.parentElement?.classList.contains("pin-spacer")
      ? section.parentElement.previousElementSibling
      : section.previousElementSibling;
    while (previous) {
      observer.observe(previous);
      previous = previous.previousElementSibling;
    }
    const images = [...section.querySelectorAll("img")];
    images.forEach((image) => {
      image.addEventListener("load", refresh);
      image.addEventListener("error", refresh);
    });
    void document.fonts?.ready.then(refresh);
    refresh();

    // Clean up
    return () => {
      active = false;
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      images.forEach((image) => {
        image.removeEventListener("load", refresh);
        image.removeEventListener("error", refresh);
      });
      media.revert();
    };
  }, [content]);
  return (
    <div className="work-section" id="work" ref={sectionRef}>
      <div className="work-container section-container">
        <h2>
          My <span>Work</span>
        </h2>
        <div className="work-flex" ref={railRef}>
          {projects.map((project, index) => (
            <div className="work-box" key={project.id}>
              <div className="work-info">
                <div className="work-title">
                  <h3>0{index + 1}</h3>

                  <div>
                    <h4>{project.title}</h4>
                    <p>{project.category}</p>
                  </div>
                </div>
                <h4>Tools and features</h4>
                <p>{project.technologies.join(", ")}</p>
              </div>
              <WorkImage image={project.cover.path} alt={project.cover.alt} link={`/projects/${project.slug}`} />
            </div>
          ))}
          {/* See All Works Button */}
          <div className="work-box work-box-cta">
            <div className="see-all-works">
              <h3>Want to see more?</h3>
              <p>Explore all of my projects and creations</p>
              <Link to="/myworks" className="see-all-btn" data-cursor="disable">
                See All Works →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Work;
