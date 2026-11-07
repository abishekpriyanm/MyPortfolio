import { MdCopyright } from "react-icons/md";
import { ArrowUpRight } from "lucide-react";
import { FaGithub, FaInstagram, FaLinkedinIn, FaXTwitter } from "react-icons/fa6";
import socialLinksConfig from "../data/social-links.json";
import "./styles/Contact.css";
import { usePortfolio } from "../features/portfolio-content/PortfolioProvider";
import { config } from "../config";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

const configuredLink = (url: string, publishedUrl: string) => {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) && parsed.hostname !== "example.com" ? url : publishedUrl;
  } catch {
    return publishedUrl;
  }
};

const Contact = () => {
  const { content } = usePortfolio();
  const socialLinks = [
    { label: "GitHub", url: content.about.social.github, icon: FaGithub },
    { label: "LinkedIn", url: configuredLink(socialLinksConfig.linkedin, content.about.social.linkedin), icon: FaLinkedinIn },
    { label: "X", url: configuredLink(socialLinksConfig.twitter, content.about.social.twitter), icon: FaXTwitter },
    { label: "Instagram", url: configuredLink(socialLinksConfig.instagram, content.about.social.instagram), icon: FaInstagram },
  ];

  useEffect(() => {
    const contactTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: ".contact-section",
        start: "top 80%",
        end: "bottom center",
        toggleActions: "play none none none",
      },
    });

    // Animate title from bottom
    contactTimeline.fromTo(
      ".contact-section h3",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
      }
    );

    // Animate contact boxes with stagger from bottom
    contactTimeline.fromTo(
      ".contact-box",
      {
        opacity: 0,
        y: 50,
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: "power3.out",
      },
      "-=0.4"
    );

    // Clean up
    return () => {
      contactTimeline.kill();
    };
  }, []);

  return (
    <div className="contact-section section-container" id="contact">
      <div className="contact-container">
        <h3>{content.about.name}</h3>
        <div className="contact-flex">
          <div className="contact-box">
            <h4>Email</h4>
            <p>
              <a href={`mailto:${config.contact.email}`} data-cursor="disable">
                {config.contact.email}
              </a>
            </p>
            <h4>Location</h4>
            <p>
              <span>{content.about.location}</span>
            </p>
          </div>
          <div className="contact-box contact-social-box">
            <h4>Social</h4>
            {socialLinks.filter(({ label, url }) => label !== "GitHub" || url).map(({ label, url, icon: Icon }) => (
              url ? (
                <a key={label} href={url} target="_blank" rel="noopener noreferrer" data-cursor="disable" className="contact-social">
                  <span className="contact-social-icon"><Icon aria-hidden="true" /></span>
                  <span>{label}</span> <ArrowUpRight className="contact-social-arrow" aria-hidden="true" />
                </a>
              ) : (
                <span key={label} className="contact-social contact-social-placeholder" aria-label={`${label} link not configured`}>
                  <span className="contact-social-icon"><Icon aria-hidden="true" /></span>
                  <span>{label}</span>
                </span>
              )
            ))}
          </div>
          <div className="contact-box">
            <h2>
              Designed and Developed <br /> by <span>{content.about.name}</span>
            </h2>
            <h5>
              <MdCopyright /> {new Date().getFullYear()}
            </h5>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
