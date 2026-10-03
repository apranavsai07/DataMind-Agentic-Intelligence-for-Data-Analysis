import React, {
  useState,
  Children,
  useRef,
  useLayoutEffect,
} from "react";

import {
  motion,
  AnimatePresence,
} from "motion/react";

import { Link } from "react-router-dom";

import "./WorkflowStepper.css";


const WORKFLOW_STEPS = [
  {
    number: "01",
    title: "Upload",
    shortTitle: "Upload",
  },
  {
    number: "02",
    title: "Understand",
    shortTitle: "Understand",
  },
  {
    number: "03",
    title: "Plan",
    shortTitle: "Plan",
  },
  {
    number: "04",
    title: "Execute",
    shortTitle: "Execute",
  },
  {
    number: "05",
    title: "Explain",
    shortTitle: "Explain",
  },
];

export default function WorkflowStepper() {
  const [currentStep, setCurrentStep] =
    useState(1);

  const [direction, setDirection] =
    useState(1);

  const totalSteps =
    WORKFLOW_STEPS.length;

  const isFirstStep =
    currentStep === 1;

  const isLastStep =
    currentStep === totalSteps;

  const goToStep = (step) => {
    if (
      step < 1 ||
      step > totalSteps ||
      step === currentStep
    ) {
      return;
    }

    setDirection(
      step > currentStep ? 1 : -1
    );

    setCurrentStep(step);
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setDirection(-1);
      setCurrentStep(
        currentStep - 1
      );
    }
  };

  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      setCurrentStep(
        currentStep + 1
      );
    }
  };

  return (
    <div className="workflow-stepper">

      {/* --------------------------------
          STEP INDICATORS
      -------------------------------- */}

      <div className="workflow-step-indicators">

        {WORKFLOW_STEPS.map(
          (step, index) => {

            const stepNumber =
              index + 1;

            const isActive =
              currentStep === stepNumber;

            const isComplete =
              currentStep > stepNumber;

            return (
              <React.Fragment
                key={step.number}
              >

                <button
                  type="button"
                  className={`
                    workflow-step-indicator
                    ${
                      isActive
                        ? "is-active"
                        : ""
                    }
                    ${
                      isComplete
                        ? "is-complete"
                        : ""
                    }
                  `}
                  onClick={() =>
                    goToStep(
                      stepNumber
                    )
                  }
                >

                  <span className="workflow-step-circle">

                    {isComplete ? (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M5 13l4 4L19 7"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      step.number
                    )}

                  </span>

                  <span className="workflow-step-label">
                    {step.shortTitle}
                  </span>

                </button>

                {index <
                  WORKFLOW_STEPS.length -
                    1 && (
                  <div className="workflow-connector">
                    <motion.div
                      className="workflow-connector-progress"
                      initial={{
                        width: 0,
                      }}
                      animate={{
                        width:
                          currentStep >
                          stepNumber
                            ? "100%"
                            : "0%",
                      }}
                      transition={{
                        duration: 0.45,
                        ease: [
                          0.16,
                          1,
                          0.3,
                          1,
                        ],
                      }}
                    />
                  </div>
                )}

              </React.Fragment>
            );
          }
        )}

      </div>

      {/* --------------------------------
          STEP CONTENT
      -------------------------------- */}

      <div className="workflow-content">

        <AnimatePresence
          mode="wait"
          custom={direction}
        >
          <motion.div
            key={currentStep}
            custom={direction}
            variants={{
              enter: (direction) => ({
                opacity: 0,
                x:
                  direction > 0
                    ? 35
                    : -35,
              }),

              center: {
                opacity: 1,
                x: 0,
              },

              exit: (direction) => ({
                opacity: 0,
                x:
                  direction > 0
                    ? -35
                    : 35,
              }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.35,
              ease: [
                0.16,
                1,
                0.3,
                1,
              ],
            }}
          >
            <WorkflowContent
              step={currentStep}
            />
          </motion.div>
        </AnimatePresence>

      </div>

      {/* --------------------------------
          NAVIGATION
      -------------------------------- */}

      <div className="workflow-navigation">

        <button
          type="button"
          className="workflow-back-button"
          onClick={handlePrevious}
          disabled={isFirstStep}
        >
          <span>←</span>
          Previous
        </button>

        <div className="workflow-progress-text">
          {String(currentStep).padStart(
            2,
            "0"
          )}{" "}
          /{" "}
          {String(totalSteps).padStart(
            2,
            "0"
          )}
        </div>

        {isLastStep ? (
          <Link
            to="/signup"
            className="workflow-next-button"
          >
            Start your analysis
            <span>→</span>
          </Link>
        ) : (
          <button
            type="button"
            className="workflow-next-button"
            onClick={handleNext}
          >
            Next
            <span>→</span>
          </button>
        )}

      </div>

    </div>
  );
}


/* =====================================================
   WORKFLOW CONTENT
===================================================== */

function WorkflowContent({
  step,
}) {
  switch (step) {

    case 1:
      return <UploadStep />;

    case 2:
      return <UnderstandStep />;

    case 3:
      return <PlanStep />;

    case 4:
      return <ExecuteStep />;

    case 5:
      return <ExplainStep />;

    default:
      return <UploadStep />;
  }
}


/* =====================================================
   STEP 01 — UPLOAD
===================================================== */

function UploadStep() {
  return (
    <div className="workflow-panel">

      <div className="workflow-panel-copy">

        <div className="workflow-panel-number">
          01
        </div>

        <h3>
          Start with your data.
        </h3>

        <p>
          Upload a CSV, Excel file, or dataset
          and give DataMind the context it
          needs to get started.
        </p>

      </div>

      <div className="workflow-visual upload-visual">

        <div className="upload-file">

          <div className="upload-file-icon">
            CSV
          </div>

          <div className="upload-file-info">
            <strong>
              sales_data.csv
            </strong>

            <span>
              2.4 MB · 12,450 rows
            </span>
          </div>

          <div className="upload-success">
            ✓
          </div>

        </div>

        <div className="upload-status">
          <span className="status-dot" />
          Dataset uploaded successfully
        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STEP 02 — UNDERSTAND
===================================================== */

function UnderstandStep() {
  return (
    <div className="workflow-panel">

      <div className="workflow-panel-copy">

        <div className="workflow-panel-number">
          02
        </div>

        <h3>
          Understand the dataset.
        </h3>

        <p>
          Before running analysis, DataMind
          automatically profiles the structure,
          types, quality, and characteristics
          of your data.
        </p>

      </div>

      <div className="workflow-visual">

        <div className="understand-grid">

          <div className="understand-item">
            <span>Rows</span>
            <strong>12,450</strong>
          </div>

          <div className="understand-item">
            <span>Columns</span>
            <strong>18</strong>
          </div>

          <div className="understand-item">
            <span>Numeric</span>
            <strong>11</strong>
          </div>

          <div className="understand-item">
            <span>Categorical</span>
            <strong>5</strong>
          </div>

        </div>

        <div className="understand-status">
          <span>✓</span>
          Dataset structure understood
        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STEP 03 — PLAN
===================================================== */

function PlanStep() {
  return (
    <div className="workflow-panel">

      <div className="workflow-panel-copy">

        <div className="workflow-panel-number">
          03
        </div>

        <h3>
          Turn questions into a plan.
        </h3>

        <p>
          Your analytical request drives the
          workflow. DataMind determines which
          operations and agents are actually
          needed to answer it.
        </p>

      </div>

      <div className="workflow-visual plan-visual">

        <div className="plan-question">
          <span>?</span>

          <p>
            What factors are affecting revenue?
          </p>
        </div>

        <div className="plan-flow">

          <div className="plan-node">
            Understand request
          </div>

          <div className="plan-arrow">
            ↓
          </div>

          <div className="plan-node">
            Select analysis
          </div>

          <div className="plan-arrow">
            ↓
          </div>

          <div className="plan-node plan-node-active">
            Create execution plan
          </div>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   STEP 04 — EXECUTE
===================================================== */

function ExecuteStep() {
  return (
    <div className="workflow-panel">

      <div className="workflow-panel-copy">

        <div className="workflow-panel-number">
          04
        </div>

        <h3>
          Let the agents do the work.
        </h3>

        <p>
          Specialized agents execute the plan,
          transforming raw data into analysis,
          visualizations, and supporting evidence.
        </p>

      </div>

      <div className="workflow-visual execute-visual">

        <AgentRow
          name="Cleaning Agent"
          status="Completed"
        />

        <AgentRow
          name="Analysis Agent"
          status="Completed"
        />

        <AgentRow
          name="Visualization Agent"
          status="Completed"
        />

      </div>

    </div>
  );
}


/* =====================================================
   STEP 05 — EXPLAIN
===================================================== */

function ExplainStep() {
  return (
    <div className="workflow-panel">

      <div className="workflow-panel-copy">

        <div className="workflow-panel-number">
          05
        </div>

        <h3>
          Get answers, not just outputs.
        </h3>

        <p>
          DataMind turns the results into clear
          findings, explanations, visualizations,
          and a report you can actually use.
        </p>

      </div>

      <div className="workflow-visual explain-visual">

        <div className="insight-card">

          <span className="insight-label">
            KEY INSIGHT
          </span>

          <strong>
            Revenue increased 18.4%
            over the last quarter.
          </strong>

          <p>
            Enterprise customers were the
            strongest contributor to the increase.
          </p>

        </div>

        <div className="insight-footer">
          <span>✓ Analysis complete</span>
          <span>Report ready</span>
        </div>

      </div>

    </div>
  );
}


/* =====================================================
   AGENT ROW
===================================================== */

function AgentRow({
  name,
  status,
}) {
  return (
    <div className="agent-row">

      <div className="agent-icon">
        ✓
      </div>

      <div className="agent-info">
        <strong>{name}</strong>
        <span>{status}</span>
      </div>

      <span className="agent-status">
        Done
      </span>

    </div>
  );
}