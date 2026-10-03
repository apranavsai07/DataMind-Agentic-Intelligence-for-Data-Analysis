import { useEffect, useState } from "react";
import "./AgentStatus.css";

// These labels map to what the backend actually does
const STAGES = [
  { id: "planning",   label: "Planning your analysis",       icon: "🧠" },
  { id: "profiling",  label: "Profiling dataset structure",  icon: "🔍" },
  { id: "executing",  label: "Executing operations",         icon: "⚙️" },
  { id: "analyzing",  label: "Running analysis",             icon: "📊" },
  { id: "reporting",  label: "Generating insights",          icon: "✍️" },
];

export default function AgentStatusPanel({ filename, userRequest }) {
  const [stageIndex, setStageIndex] = useState(0);

  // Advance through visual stages automatically
  // Real stages match backend execution order
  useEffect(() => {
    const delays = [0, 2200, 5000, 9000, 14000];
    const timers = delays.map((delay, i) =>
      setTimeout(() => setStageIndex(i), delay),
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="agent-status">
      {/* Header */}
      <div className="agent-status-header">
        <div className="agent-status-pulse" aria-hidden="true" />
        <span className="agent-status-live">Agent running</span>
      </div>

      {/* Request recap */}
      <div className="agent-status-context">
        <div className="agent-status-file">
          <span className="agent-status-file-icon" aria-hidden="true">📁</span>
          <span className="agent-status-file-name">{filename}</span>
        </div>
        <blockquote className="agent-status-request">
          "{userRequest}"
        </blockquote>
      </div>

      {/* Stage track */}
      <div className="agent-status-stages" role="list">
        {STAGES.map((stage, i) => {
          const done = i < stageIndex;
          const active = i === stageIndex;
          return (
            <div
              key={stage.id}
              className={`agent-stage${active ? " agent-stage--active" : ""}${done ? " agent-stage--done" : ""}`}
              role="listitem"
            >
              <div className="agent-stage-left">
                <div className="agent-stage-dot-wrap">
                  {done ? (
                    <svg
                      className="agent-stage-check"
                      width="14"
                      height="14"
                      viewBox="0 0 14 14"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle cx="7" cy="7" r="7" fill="rgba(52,211,153,0.2)" />
                      <path
                        d="M4 7l2 2 4-4"
                        stroke="#6ee7b7"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : active ? (
                    <span className="agent-stage-spinner" aria-hidden="true" />
                  ) : (
                    <span className="agent-stage-idle" aria-hidden="true" />
                  )}
                  {i < STAGES.length - 1 && (
                    <span
                      className={`agent-stage-line${done ? " agent-stage-line--done" : ""}`}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              <div className="agent-stage-right">
                <span className="agent-stage-icon" aria-hidden="true">
                  {stage.icon}
                </span>
                <span className="agent-stage-label">{stage.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <p className="agent-status-note">
        This may take 10–60 seconds depending on dataset size.
      </p>
    </div>
  );
}
