import { PropsWithChildren, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./styles/Landing.css";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";

gsap.registerPlugin(ScrollTrigger);

const Landing = ({ children }: PropsWithChildren) => {
  const { content } = usePortfolio();
  const sectionRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const portraitFrameRef = useRef<HTMLDivElement>(null);
  const portraitRef = useRef<HTMLImageElement>(null);
  const portraitShadeRef = useRef<HTMLDivElement>(null);
  const portraitNameRef = useRef<SVGSVGElement>(null);
  const portraitNameUpperRef = useRef<SVGTextElement>(null);
  const portraitNameLowerRef = useRef<SVGTextElement>(null);
  const nameParts = content.about.name.split(" ");
  const firstName = nameParts[0] || "Abishek";
  const portraitLastName = nameParts[1] || "";

  useLayoutEffect(() => {
    const media = gsap.matchMedia();

    media.add(
      "(max-width: 1024px) and (prefers-reduced-motion: no-preference)",
      () => {
        const section = sectionRef.current;
        const stage = stageRef.current;
        const intro = introRef.current;
        const portraitFrame = portraitFrameRef.current;
        const portrait = portraitRef.current;
        const portraitShade = portraitShadeRef.current;
        const portraitName = portraitNameRef.current;
        const portraitNameUpper = portraitNameUpperRef.current;
        const portraitNameLower = portraitNameLowerRef.current;

        if (
          !section ||
          !stage ||
          !intro ||
          !portraitFrame ||
          !portrait ||
          !portraitShade ||
          !portraitName ||
          !portraitNameUpper ||
          !portraitNameLower
        ) {
          return;
        }

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${Math.round(window.innerHeight * 0.7)}`,
            scrub: 0.65,
            pin: stage,
            pinSpacing: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        timeline
          .fromTo(
            portrait,
            { scale: 1.18, yPercent: -2 },
            { scale: 0.88, yPercent: -2, duration: 1, ease: "none" },
            0
          )
          .fromTo(
            portraitFrame,
            { "--portrait-fade-start": "78%" },
            {
              "--portrait-fade-start": "94%",
              duration: 1,
              ease: "none",
            },
            0
          )
          .to(
            intro,
            {
              autoAlpha: 0,
              y: -18,
              duration: 0.28,
              ease: "power2.in",
            },
            0.2
          )
          .fromTo(
            portraitName,
            {
              autoAlpha: 0,
              filter: "blur(5px)",
            },
            {
              autoAlpha: 1,
              filter: "blur(0px)",
              duration: 0.08,
              ease: "none",
            },
            0.24
          )
          .fromTo(
            portraitNameUpper,
            {
              strokeDasharray: "900 900",
              strokeDashoffset: 900,
            },
            {
              strokeDashoffset: 0,
              duration: 0.62,
              ease: "power1.inOut",
            },
            0.24
          )
          .fromTo(
            portraitNameLower,
            {
              strokeDasharray: "700 700",
              strokeDashoffset: 700,
            },
            {
              strokeDashoffset: 0,
              duration: 0.62,
              ease: "power1.inOut",
            },
            0.24
          )
          .fromTo(
            portraitShade,
            { opacity: 0 },
            {
              opacity: 0.42,
              duration: 0.72,
              ease: "none",
            },
            0.2
          );

        const refresh = () => ScrollTrigger.refresh();
        if (portrait.complete) {
          requestAnimationFrame(refresh);
        } else {
          portrait.addEventListener("load", refresh, { once: true });
        }

        return () => {
          portrait.removeEventListener("load", refresh);
          timeline.scrollTrigger?.kill();
          timeline.kill();
        };
      }
    );

    return () => media.revert();
  }, []);

  return (
    <>
      <div className="landing-section" id="landingDiv" ref={sectionRef}>
        <div className="landing-container" ref={stageRef}>
          <div className="landing-intro" ref={introRef}>
            <h2>Hello! I'm</h2>
            <h1>{content.about.name.toUpperCase()}</h1>
          </div>
          <div className="landing-info">
            <h3>An</h3>
            <h2 className="landing-info-h2">
              <div className="landing-h2-1">{content.about.roles[0] ?? "AI Engineer"}</div>
            </h2>
            <h2>
              <div className="landing-h2-info">{content.about.roles[1] ?? "Full-Stack Developer"}</div>
            </h2>
          </div>
          {/* Mobile and Tablet photo - shown when 3D character is hidden */}
          <div className="mobile-photo" ref={portraitFrameRef}>
            <img
              ref={portraitRef}
              src="/images/abishek-priyan-profile.webp"
              alt={content.about.name}
              width="1200"
              height="1659"
              loading="eager"
              decoding="async"
            />
            <div
              className="portrait-blackout"
              ref={portraitShadeRef}
              aria-hidden="true"
            />
            <svg
              className="portrait-name"
              ref={portraitNameRef}
              viewBox="0 0 520 160"
              aria-hidden="true"
            >
              <text
                ref={portraitNameUpperRef}
                className="portrait-name-stroke portrait-name-stroke-upper"
                x="260"
                y="68"
                textAnchor="middle"
              >
                {firstName.toUpperCase()}
              </text>
              <text
                ref={portraitNameLowerRef}
                className="portrait-name-stroke portrait-name-stroke-lower"
                x="260"
                y="126"
                textAnchor="middle"
              >
                {portraitLastName.toUpperCase()}
              </text>
            </svg>
          </div>
        </div>
        {children}
      </div>
    </>
  );
};

export default Landing;
