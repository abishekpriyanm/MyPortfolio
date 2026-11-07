import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import "./styles/TechStackNew.css";

interface TechItem {
  name: string;
  icon?: string;
  url: string;
}

// All tech stack items with their icons and official URLs
// Keep the original rows, with the newly requested frameworks included.
const techStack: TechItem[][] = [
  // Row 1 - 12 items (largest)
  [
    { name: "Python", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg", url: "https://python.org" },
    { name: "JavaScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript" },
    { name: "TypeScript", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg", url: "https://typescriptlang.org" },
    { name: "C", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg", url: "https://en.cppreference.com/w/c" },
    { name: "C++", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg", url: "https://isocpp.org" },
    { name: "Kotlin", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/kotlin/kotlin-original.svg", url: "https://kotlinlang.org" },
    { name: "HTML", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/html5/html5-original.svg", url: "https://developer.mozilla.org/en-US/docs/Web/HTML" },
    { name: "CSS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/css3/css3-original.svg", url: "https://developer.mozilla.org/en-US/docs/Web/CSS" },
    { name: "Bash", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg", url: "https://www.gnu.org/software/bash/" },
    { name: "React", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg", url: "https://react.dev" },
    { name: "Next.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg", url: "https://nextjs.org" },
    { name: "Bootstrap", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bootstrap/bootstrap-original.svg", url: "https://getbootstrap.com" },
  ],
  // Backend, AI, and frontend frameworks
  [
    { name: "Node.js", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg", url: "https://nodejs.org" },
    { name: "Django", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg", url: "https://djangoproject.com" },
    { name: "Flask", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flask/flask-original.svg", url: "https://flask.palletsprojects.com" },
    { name: "FastAPI", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/fastapi/fastapi-original.svg", url: "https://fastapi.tiangolo.com" },
    { name: "Express", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg", url: "https://expressjs.com" },
    { name: "TensorFlow", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg", url: "https://tensorflow.org" },
    { name: "PyTorch", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pytorch/pytorch-original.svg", url: "https://pytorch.org" },
    { name: "Scikit-learn", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/scikitlearn/scikitlearn-original.svg", url: "https://scikit-learn.org" },
    { name: "OpenCV", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/opencv/opencv-original.svg", url: "https://opencv.org" },
    { name: "NumPy", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg", url: "https://numpy.org" },
    { name: "Tailwind", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg", url: "https://tailwindcss.com" },
  ],
  // Row 3 - 8 items
  [
    { name: "Pandas", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg", url: "https://pandas.pydata.org" },
    { name: "MySQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mysql/mysql-original.svg", url: "https://mysql.com" },
    { name: "PostgreSQL", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg", url: "https://postgresql.org" },
    { name: "MongoDB", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mongodb/mongodb-original.svg", url: "https://mongodb.com" },
    { name: "Firebase", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg", url: "https://firebase.google.com" },
    { name: "Redis", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg", url: "https://redis.io" },
    { name: "Docker", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg", url: "https://docker.com" },
    { name: "Azure", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/azure/azure-original.svg", url: "https://azure.microsoft.com" },
  ],
  // Row 4 - 6 items
  [
    { name: "Git", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg", url: "https://git-scm.com" },
    { name: "GitHub", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/github/github-original.svg", url: "https://github.com" },
    { name: "Linux", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg", url: "https://linux.org" },
    { name: "AWS", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/amazonwebservices/amazonwebservices-original-wordmark.svg", url: "https://aws.amazon.com" },
    { name: "VS Code", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vscode/vscode-original.svg", url: "https://code.visualstudio.com" },
    { name: "Vercel", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/vercel/vercel-original.svg", url: "https://vercel.com" },
  ],
  // Row 5 - 4 items
  [
    { name: "Jupyter", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/jupyter/jupyter-original.svg", url: "https://jupyter.org" },
    { name: "Figma", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg", url: "https://figma.com" },
    { name: "Postman", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postman/postman-original.svg", url: "https://postman.com" },
    { name: "Photoshop", icon: "https://cdn.jsdelivr.net/gh/devicons/devicon/icons/photoshop/photoshop-original.svg", url: "https://adobe.com/products/photoshop" },
  ],
  // Final row
  [
    { name: "Hugging Face", icon: "https://huggingface.co/front/assets/huggingface_logo-noborder.svg", url: "https://huggingface.co" },
    { name: "MS Office", icon: "https://img.icons8.com/color/48/microsoft-office-2019.png", url: "https://www.microsoft.com/microsoft-365" },
    { name: "LangChain", url: "https://www.langchain.com" },
  ],
];

const domains = [
  {
    id: "ai", name: "AI & Agents",
    description: "Tools for AI workflows, retrieval, and machine learning.",
    tools: ["LangChain", "Python", "Hugging Face", "PyTorch", "TensorFlow", "Scikit-learn", "OpenCV", "Jupyter"],
    capabilities: ["RAG"],
  },
  {
    id: "backend", name: "Backend",
    description: "Frameworks for application services and web APIs.",
    tools: ["FastAPI", "Flask", "Express", "Node.js", "Django"],
    capabilities: [],
  },
  {
    id: "frontend", name: "Frontend",
    description: "Tools for web interfaces and responsive layouts.",
    tools: ["React", "Next.js", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind", "Bootstrap", "Figma"],
    capabilities: [],
  },
  {
    id: "data", name: "Data & Databases",
    description: "Databases, caching, and data processing tools.",
    tools: ["PostgreSQL", "MongoDB", "Redis", "MySQL", "Firebase", "NumPy", "Pandas"],
    capabilities: [],
  },
  {
    id: "cloud", name: "Cloud & Delivery",
    description: "Tools for shipping, hosting, and maintaining applications.",
    tools: ["Docker", "AWS", "Vercel", "Git", "GitHub", "Linux", "Azure", "Bash", "Postman"],
    capabilities: [],
  },
];

const toolsByName = new Map(techStack.flat().map((tool) => [tool.name, tool]));

function handleTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>("button[role='tab']") ?? []);
  const current = tabs.indexOf(event.currentTarget);
  const next = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1
    : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next]?.focus();
  tabs[next]?.click();
}

function TechTile({ tech }: { tech: TechItem }) {
  return (
    <a href={tech.url} target="_blank" rel="noopener noreferrer"
      className="techstack-item" title={tech.name} data-cursor="disable">
      {tech.icon ? (
        <img src={tech.icon} alt="" loading="lazy" decoding="async" width="30" height="30" />
      ) : (
        <span className="techstack-monogram" aria-hidden="true">LC</span>
      )}
      <span className="techstack-item-label">{tech.name}</span>
    </a>
  );
}

const TechStackNew = () => {
  const [view, setView] = useState("all");
  const [domainId, setDomainId] = useState("ai");
  const id = useId();
  const videoRef = useRef<HTMLVideoElement>(null);
  const domain = domains.find((item) => item.id === domainId) ?? domains[0];

  useEffect(() => {
    if (!window.matchMedia) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => {
      if (preference.matches) videoRef.current?.pause();
      else void videoRef.current?.play()?.catch(() => undefined);
    };
    syncMotion();
    preference.addEventListener("change", syncMotion);
    return () => preference.removeEventListener("change", syncMotion);
  }, []);

  return (
    <section className="techstack-new" aria-labelledby={`${id}-heading`}>
      {/* Video Background */}
      <div className="techstack-video-container" aria-hidden="true">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="techstack-video"
        >
          <source src="/video/video.webm" type="video/webm" />
        </video>
        {/* Dark Overlay */}
        <div className="techstack-overlay"></div>
      </div>

      {/* Content */}
      <div className="techstack-content">
        <h2 id={`${id}-heading`}>Tech Stack</h2>
        <div className="techstack-view-switch" role="tablist" aria-label="Skill view" data-view={view}>
          <span className="techstack-switch-indicator" aria-hidden="true" />
          {[["all", "All tools"], ["domain", "By domain"]].map(([value, label]) => (
            <button key={value} type="button" role="tab" id={`${id}-${value}-tab`}
              aria-selected={view === value} aria-controls={`${id}-view-panel`}
              tabIndex={view === value ? 0 : -1} data-cursor="disable"
              onKeyDown={handleTabKeyDown} onClick={() => setView(value)}>{label}</button>
          ))}
        </div>
        <div className="techstack-panels">
          {view === "all" ? (
            <div id={`${id}-view-panel`} role="tabpanel" aria-labelledby={`${id}-all-tab`}
              tabIndex={0} className="techstack-pyramid techstack-panel-enter">
              {techStack.map((row, rowIndex) => (
                <div key={rowIndex} className="techstack-row">
                  {row.map((tech) => <TechTile key={tech.name} tech={tech} />)}
                </div>
              ))}
            </div>
          ) : (
            <div id={`${id}-view-panel`} role="tabpanel" aria-labelledby={`${id}-domain-tab`}
              className="techstack-domain-view techstack-panel-enter">
              <div className="techstack-domain-tabs" role="tablist" aria-label="Skill domains">
                {domains.map((item) => (
                  <button key={item.id} type="button" role="tab" id={`${id}-${item.id}-tab`}
                    aria-selected={domainId === item.id} aria-controls={`${id}-skills-panel`}
                    tabIndex={domainId === item.id ? 0 : -1} data-cursor="disable"
                    onKeyDown={handleTabKeyDown} onClick={() => setDomainId(item.id)}>{item.name}</button>
                ))}
              </div>
              <div key={domain.id} role="tabpanel" id={`${id}-skills-panel`}
                aria-labelledby={`${id}-${domain.id}-tab`} tabIndex={0}
                className="techstack-domain-panel techstack-panel-enter">
                <p className="techstack-domain-caption">{domain.name}</p>
                <p className="techstack-domain-description">{domain.description}</p>
                <div className="techstack-domain-grid">
                  {domain.tools.map((name) => {
                    const tech = toolsByName.get(name);
                    return tech ? <TechTile key={name} tech={tech} /> : null;
                  })}
                </div>
                {domain.capabilities.length > 0 && (
                  <div className="techstack-capabilities" aria-label="Capabilities">
                    <span>Capabilities</span>
                    {domain.capabilities.map((capability) => <span key={capability} className="techstack-capability">{capability}</span>)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default TechStackNew;
