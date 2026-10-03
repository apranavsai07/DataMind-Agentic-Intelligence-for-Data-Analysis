import { useEffect, useState } from "react";
import PillNav from "./PillNav";

const sections = ["home", "features", "workflow"];

export default function LandingNavbar() {
  const [activeSection, setActiveSection] = useState("home");

  const scrollToSection = (id) => {
    const element = document.getElementById(id);

    if (!element) return;

    const navbarOffset = 100;
    const elementPosition =
      element.getBoundingClientRect().top + window.scrollY;

    window.scrollTo({
      top: elementPosition - navbarOffset,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visibleSections = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              b.intersectionRatio - a.intersectionRatio
          );

        if (visibleSections.length > 0) {
          setActiveSection(visibleSections[0].target.id);
        }
      },
      {
        root: null,
        rootMargin: "-20% 0px -45% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75],
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);

      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing-navbar">
      <div className="landing-navbar-inner">
        <PillNav
          logo="/datamind-logo.png"
          logoAlt="DataMind"
          items={[
            {
              label: "Home",
              href: "#home",
              onClick: (e) => {
                e.preventDefault();
                scrollToSection("home");
              },
            },
            {
              label: "Features",
              href: "#features",
              onClick: (e) => {
                e.preventDefault();
                scrollToSection("features");
              },
            },
            {
              label: "Workflow",
              href: "#workflow",
              onClick: (e) => {
                e.preventDefault();
                scrollToSection("workflow");
              },
            },
          ]}
          activeHref={`#${activeSection}`}
          baseColor="#ffffff"
          pillColor="#120e1a"
          hoveredPillTextColor="#0a0710"
          pillTextColor="#ffffff"
        />

        <button
          type="button"
          onClick={() => scrollToSection("get-started")}
          className="landing-navbar-cta"
        >
          Get started
        </button>
      </div>
    </div>
  );
}

const scrollToSection = (id) => {
  const element = document.getElementById(id);

  if (!element) {
    console.log(`Section "${id}" not found`);
    return;
  }

  const navbarOffset = 100;

  const top =
    element.getBoundingClientRect().top +
    window.scrollY -
    navbarOffset;

  window.scrollTo({
    top,
    behavior: "smooth",
  });
};