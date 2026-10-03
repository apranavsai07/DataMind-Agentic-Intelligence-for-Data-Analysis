import { useState } from "react";
import LineSidebar from "./LineSidebar";
import FeatureCard from "./FeatureCard";
import "./FeaturesSection.css";

const FEATURES = [
  {
    id: "profile",
    number: "01",
    label: "Profile",
  },
  {
    id: "clean",
    number: "02",
    label: "Clean",
  },
  {
    id: "analyze",
    number: "03",
    label: "Analyze",
  },
  {
    id: "visualize",
    number: "04",
    label: "Visualize",
  },
  {
    id: "insights",
    number: "05",
    label: "Insights",
  },
  {
    id: "report",
    number: "06",
    label: "Report",
  },
];

export default function FeaturesSection() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <section id="features" className="features-section bg-transparent">
      <div className="features-container">
        {/* Section heading */}
        <div className="features-heading">
          <span>FEATURES</span>

          <h2>
            One workspace.
            <br />
            Every step of analysis.
          </h2>

          <p>
            From understanding your dataset to discovering
            insights, DataMind helps you move through the
            entire analytical workflow.
          </p>
        </div>

        {/* Feature selector + preview */}
        <div className="features-showcase">
          <div className="features-sidebar">
            <LineSidebar
              items={FEATURES}
              activeIndex={activeFeature}
              onChange={setActiveFeature}
            />
          </div>

          <div className="features-card">
            <FeatureCard feature={FEATURES[activeFeature]} />
          </div>
        </div>
      </div>
    </section>
  );
}