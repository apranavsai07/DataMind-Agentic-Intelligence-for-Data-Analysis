import WorkflowStepper from "./WorkflowStepper";
import "./WorkflowSection.css";

export default function WorkflowSection() {
  return (
    <section id="workflow" className="workflow-section bg-transparent">
      <div className="workflow-container">
        <div className="workflow-heading">
          <span>HOW DataMind WORKS</span>

          <h2>
            From raw data
            <br />
            to clear decisions.
          </h2>

          <p>
            DataMind turns your dataset and your question into
            structured analysis, visualizations, and actionable insights.
          </p>
        </div>

        <WorkflowStepper />
      </div>
    </section>
  );
}