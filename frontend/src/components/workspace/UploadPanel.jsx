
import { useRef, useState, useEffect, useCallback } from "react";
import "./UploadPanel.css";
import LatticeLoader from "./LatticeLoader";
import { getSession, getDisplayName } from "../../lib/auth.js";


// ============================================================
// MODULE 4 â€” ACCEPTED FILE TYPES
// Mirrors the supported backend parser types.
// ============================================================

const ACCEPTED_EXTENSIONS = new Set([
  ".csv",
  ".xlsx",
  ".xls",
  ".pdf",
  ".docx",
  ".json",
]);

const ACCEPT_ATTR = [...ACCEPTED_EXTENSIONS].join(",");

const ACCEPTED_DISPLAY = "CSV · Excel · JSON · PDF · Word";

const ACCEPTED_EXTS_LABEL =
  ".csv · .xlsx · .xls · .json · .pdf · .docx";

const FILE_META = {
  csv: {
    label: "CSV",
    color: "#34d399",
  },
  xlsx: {
    label: "Excel",
    color: "#34d399",
  },
  xls: {
    label: "Excel",
    color: "#34d399",
  },
  json: {
    label: "JSON",
    color: "#60a5fa",
  },
  pdf: {
    label: "PDF",
    color: "#f87171",
  },
  docx: {
    label: "Word",
    color: "#818cf8",
  },
};

// ============================================================
// HELPERS
// ============================================================

function getExt(filename) {
  const parts = filename.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

function isAccepted(filename) {
  return ACCEPTED_EXTENSIONS.has(`.${getExt(filename)}`);
}

// ============================================================
// MODULE 3 â€” PERSONALIZED GREETINGS
// ============================================================

const GREETINGS = [
  (name) => `What's up, ${name}?`,
  (name) => `What are we analyzing today, ${name}?`,
  (name) => `Ready to dig in, ${name}?`,
  (name) => `What would you like to explore, ${name}?`,
  (name) => `Let's get to work, ${name}.`,
];

function useStableGreeting() {
  const indexRef = useRef(
    Math.floor(Math.random() * GREETINGS.length)
  );

  const [displayName, setDisplayName] = useState(null);

  useEffect(() => {
    let mounted = true;

    getSession()
      .then(({ data }) => {
        if (!mounted) return;

        const name = getDisplayName(data?.session);

        if (name) {
          setDisplayName(name);
        }
      })
      .catch((err) => {
        console.error("Could not load user greeting:", err);
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (!displayName) return null;

  return GREETINGS[indexRef.current](displayName);
}

function formatSize(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================================
// MODULE 5 — ANALYSIS PROMPT HELPERS
//
// These are prompt templates, NOT separate workflows.
// Clicking one only populates the editable textarea.
// ============================================================

const PROMPT_HELPERS = [
  {
    id: "profile",
    icon: "\u25c8",
    label: "Profile",
    description: "Understand your dataset",
    prompt:
      "Generate a comprehensive data profile covering the dataset structure, column types, missing values, duplicates, statistical summaries, and potential data quality issues.",
  },
  {
    id: "clean",
    icon: "\u2726",
    label: "Clean",
    description: "Prepare your data",
    prompt:
      "Inspect this dataset for missing values, duplicate records, inconsistent data types, and data quality issues. Recommend and perform appropriate cleaning steps, and summarize the changes.",
  },
  {
    id: "analyze",
    icon: "\u2b21",
    label: "Analyze",
    description: "Discover patterns",
    prompt:
      "Analyze this dataset to identify important patterns, relationships, trends, and anomalies. Use appropriate statistical methods and explain the key findings.",
  },
  {
    id: "visualize",
    icon: "\u25c9",
    label: "Visualize",
    description: "Explore with charts",
    prompt:
      "Explore this dataset using appropriate visualizations. Generate clear, informative charts that reveal important trends, distributions, comparisons, and relationships. Explain the key takeaways.",
  },
  {
    id: "insights",
    icon: "\u2727",
    label: "Insights",
    description: "Find what matters",
    prompt:
      "Identify the most meaningful and actionable insights in this dataset. Highlight significant patterns, unusual observations, important relationships, and potential opportunities, supporting conclusions with data.",
  },
  {
    id: "report",
    icon: "\u25a3",
    label: "Report",
    description: "Create a full report",
    prompt:
      "Generate a comprehensive report for this dataset, including a data profile, cleaning summary, exploratory analysis, key visualizations, important findings, and a concise executive summary.",
  },
];

// ============================================================
// SVG ICONS
// ============================================================

function IconUpload() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 20V10M14 10L9 15M14 10L19 15"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <rect
        x="3"
        y="20"
        width="22"
        height="5"
        rx="2.5"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function IconArrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 2L14 8M14 8L8 14M14 8H2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconClose() {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 1L9 9M9 1L1 9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ============================================================
// FILE TYPE BADGE
// ============================================================

function FileTypeBadge({ ext }) {
  const meta = FILE_META[ext] || {
    label: ext?.toUpperCase() || "FILE",
    color: "rgba(255,255,255,0.35)",
  };

  return (
    <span
      className="upload-file-type-badge"
      style={{ "--badge-color": meta.color }}
    >
      {meta.label}
    </span>
  );
}

const ANALYSIS_STEPS = [
  "Planning your analysis",
  "Profiling your dataset",
  "Executing operations",
  "Running analysis",
  "Generating insights",
];

// ============================================================
// UPLOAD PANEL
// ============================================================

export default function UploadPanel({
  onSubmit,
  onFileChange,
  onPause,
  loading,
  analysisFailed = false,
  conversationStarted = false,
})  {
  const fileInputRef = useRef(null);
  const replaceInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [request, setRequest] = useState("");
  const [dragging, setDragging] = useState(false);
  const [chipDrag, setChipDrag] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [activeShortcut, setActiveShortcut] = useState(null);

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!loading) {
      setActiveStep(0);
      return undefined;
    }

    // UI-only step labels: the backend does not currently emit stage events.
    // Advance one label at a time, then remain on the final label.
    const timer = window.setInterval(() => {
      setActiveStep((current) =>
        Math.min(current + 1, ANALYSIS_STEPS.length - 1)
      );
    }, 1800);

    return () => window.clearInterval(timer);
  }, [loading]);

  const greeting = useStableGreeting();

  // ----------------------------------------------------------
  // PROMPT HELPER HANDLERS
  // ----------------------------------------------------------

  function handleShortcut(shortcut) {
    if (loading) return;

    // Populate the textarea. Do not submit the form.
    setRequest(shortcut.prompt);

    // Highlight the selected helper.
    setActiveShortcut(shortcut.id);
  }

  function handleRequestChange(e) {
    setRequest(e.target.value);

    // Manual editing clears the selected-helper indicator.
    setActiveShortcut(null);
  }

  // ----------------------------------------------------------
  // FILE VALIDATION
  // ----------------------------------------------------------

  const applyFile = useCallback(
  (selected) => {
    // The dataset is immutable once the first request has been submitted.
    if (conversationStarted || !selected) return;

    if (!isAccepted(selected.name)) {
      const ext = getExt(selected.name) || "unknown";

      setFileError(
        `.${ext} files are not supported. Please upload a CSV, Excel (.xlsx/.xls), JSON, PDF, or Word (.docx) file.`
      );

      return;
    }

    setFileError(null);
    setFile(selected);
    onFileChange?.(selected);
  },
  [onFileChange, conversationStarted]
);
  // ----------------------------------------------------------
  // DROP ZONE HANDLERS
  // ----------------------------------------------------------

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    if (conversationStarted) return;

    applyFile(e.dataTransfer.files[0]);
  }

  function handleDragOver(e) {
    e.preventDefault();
    if (conversationStarted) return;
    setDragging(true);
  }

  function handleDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragging(false);
    }
  }

  // ----------------------------------------------------------
  // FILE CHIP â€” REPLACE FILE
  // ----------------------------------------------------------

  function handleChipDrop(e) {
    e.preventDefault();
    setChipDrag(false);
    if (conversationStarted) return;

    applyFile(e.dataTransfer.files[0]);
  }

  function handleChipDragOver(e) {
    e.preventDefault();
    if (conversationStarted) return;
    setChipDrag(true);
  }

  function handleChipDragLeave(e) {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setChipDrag(false);
    }
  }

  function handleBrowse(e) {
    if (!conversationStarted) {
      applyFile(e.target.files[0]);
    }

    // Allow selecting the same file again.
    e.target.value = "";
  }

  // ----------------------------------------------------------
  // ANALYSIS SUBMISSION
  //
  // The ONLY place this component submits an analysis.
  // ----------------------------------------------------------

  function handleSubmit(e) {
    e.preventDefault();

    if (!file || !request.trim() || loading) {
      return;
    }

    const submittedRequest = request.trim();

// Keep the submitted question visible in the composer while analysis runs.
// Clear it only after the parent confirms a successful response.
Promise.resolve(onSubmit(file, submittedRequest)).then((success) => {
  if (success) {
    setRequest("");
    setActiveShortcut(null);
  }
});
  }

  // ----------------------------------------------------------
  // CLEAR FILE
  // ----------------------------------------------------------

  function clearFile() {
  if (conversationStarted) return;

  setFile(null);
  setFileError(null);
  onFileChange?.(null);

  if (fileInputRef.current) {
    fileInputRef.current.value = "";
  }

  if (replaceInputRef.current) {
    replaceInputRef.current.value = "";
  }
  }

  // ----------------------------------------------------------
  // DERIVED STATE
  // ----------------------------------------------------------

  const ext = file ? getExt(file.name) : null;

  const canSubmit =
    Boolean(file) &&
    request.trim().length > 0 &&
    !loading;

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <div className="upload-panel">

      {/* The greeting is shown only before the first request. */}
      {!conversationStarted && (
        <div className="upload-panel-header">
          <span className="ws-label"></span>

          <h2 className="upload-panel-title">
            {greeting ?? "What would you like to analyze?"}
          </h2>

          <p className="upload-panel-sub">
            Upload your dataset and describe what you want to know.
          </p>
        </div>
      )}

      <form
        className="upload-form"
        onSubmit={handleSubmit}
        noValidate
      >

        {/* ================================================
            FILE UPLOAD DROPZONE
        ================================================ */}

        {!file && (
          <div
            className={`upload-dropzone${
              dragging ? " upload-dropzone--active" : ""
            }${
              fileError ? " upload-dropzone--error" : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => {
              if (!conversationStarted) fileInputRef.current?.click();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            aria-label="Upload file â€” drag and drop or click to browse"
          >
            <div className="upload-dropzone-icon">
              <IconUpload />
            </div>

            <p className="upload-dropzone-text">
              <span>Drop your file here</span>
              <span> or </span>
              <span className="upload-dropzone-cta">
                click to browse
              </span>
            </p>

            <div className="upload-dropzone-types">
              <span className="upload-dropzone-hint">
                {ACCEPTED_DISPLAY}
              </span>

              <span className="upload-dropzone-exts">
                {ACCEPTED_EXTS_LABEL}
              </span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={handleBrowse}
              disabled={conversationStarted}
              className="upload-file-input"
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}

        {/* ================================================
            FILE VALIDATION ERROR
        ================================================ */}

        {fileError && (
          <div className="upload-file-error" role="alert">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="7.5"
                cy="7.5"
                r="6.5"
                stroke="#f87171"
                strokeWidth="1.4"
              />

              <path
                d="M7.5 4.5v4M7.5 10v1"
                stroke="#f87171"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>

            {fileError}
          </div>
        )}

        {/* ================================================
            SELECTED FILE CHIP
        ================================================ */}

        {file && (
          <div
            className={`upload-file-chip${
              chipDrag ? " upload-file-chip--drag" : ""
            }`}
            onDrop={handleChipDrop}
            onDragOver={handleChipDragOver}
            onDragLeave={handleChipDragLeave}
            aria-label={`Selected file: ${file.name}`}
          >
            <FileTypeBadge ext={ext} />

            <div className="upload-file-info">
              <span
                className="upload-file-name"
                title={file.name}
              >
                {file.name}
              </span>

              <div className="upload-file-meta">
                <span className="upload-file-size">
                  {formatSize(file.size)}
                </span>

                <button
                  type="button"
                  className="upload-file-replace"
                  onClick={() => {
                    if (!conversationStarted && !loading) replaceInputRef.current?.click();
                  }}
                  disabled={loading || conversationStarted}
                  aria-label="Replace file"
                >
                  Replace
                </button>
              </div>
            </div>

            <button
              type="button"
              className="upload-file-remove"
              onClick={clearFile}
              disabled={loading || conversationStarted}
              aria-label="Remove file"
            >
              <IconClose />
            </button>

            {chipDrag && (
              <div
                className="upload-chip-drop-overlay"
                aria-hidden="true"
              >
                Drop to replace
              </div>
            )}

            <input
              ref={replaceInputRef}
              type="file"
              accept={ACCEPT_ATTR}
              onChange={handleBrowse}
              disabled={conversationStarted}
              style={{ display: "none" }}
              aria-hidden="true"
              tabIndex={-1}
            />
          </div>
        )}

               {/* ================================================
            ANALYTICAL QUESTION + UNIFIED COMPOSER
        ================================================ */}

        <div className="upload-request-wrap">
          <label
            className="ws-label"
            htmlFor="user-request"
          >
            Your analytical question
          </label>

          {/* ONE UNIFIED PROMPT BOX */}
          <div className="prompt-composer">

            {/* Keep the user's question visible while analyzing */}
            <textarea
              id="user-request"
              className="upload-request"
              placeholder={`Ask anything...
e.g. Show the distribution of salaries by department and flag any outliers.`}
              value={request}
              onChange={handleRequestChange}
              rows={4}
              disabled={loading}
            />

            {/* Analysis status appears inside the same composer */}
            {loading && (
              <div
                className="prompt-thinking"
                role="status"
                aria-live="polite"
              >
                <div className="prompt-thinking-top">
                  <div className="prompt-thinking-status">
                    <span className="prompt-thinking-dot" />

                    <span
                      className="prompt-thinking-label"
                      key={activeStep}
                    >
                      {ANALYSIS_STEPS[activeStep]}
                    </span>
                  </div>

                  <div className="prompt-thinking-right">
                    <span className="prompt-thinking-count">
                      {String(activeStep + 1).padStart(2, "0")}
                      {" / "}
                      {String(ANALYSIS_STEPS.length).padStart(2, "0")}
                    </span>

                    {onPause && (
                      <button
                        type="button"
                        className="prompt-pause-btn"
                        onClick={onPause}
                        title="Pause analysis"
                        aria-label="Pause analysis"
                      >
                        <span className="prompt-pause-icon" aria-hidden="true">&#x23F8;</span>
                        Pause
                      </button>
                    )}
                  </div>
                </div>

                {file && (
                  <div className="prompt-thinking-file">
                    <span aria-hidden="true">&#x1F4C4;</span>

                    <span
                      className="prompt-thinking-file-name"
                      title={file.name}
                    >
                      {file.name}
                    </span>
                  </div>
                )}

                <div className="prompt-thinking-loader">
                  <LatticeLoader
                    status="working"
                    label="Thinking..."
                    doneLabel="Done"
                    errorLabel="Failed"
                    pattern="orbit"
                    grid={3}
                    shape="round"
                    doneColor="#22c55e"
                    errorColor="#ef4444"
                    cellSize={6}
                    gap={2}
                    fontSize={14}
                    step={90}
                    idleOpacity={0.15}
                    glow={false}
                    glowColor=""
                    showTimer
                    color="#f5f5f5"
                  />
                </div>
              </div>
            )}

            {/* Show the Run Analysis button only before submission */}
            {!loading && (
              <div className="prompt-action-row">
                <span className="prompt-action-hint">
                  {file ? "Ready when you are" : ""}
                </span>

                <button
                  type="submit"
                  className="upload-submit prompt-submit"
                  disabled={!canSubmit}
                  id="analyze-btn"
                >
                  <IconArrow />
                  Run Analysis
                </button>
              </div>
            )}
          </div>

          {/* Quick Start shortcuts */}
          {!loading && !analysisFailed && (
            <div
              className="prompt-helper-section"
              role="group"
              aria-label="Analysis prompt helpers"
            >
              <div className="prompt-helper-header">
                <div>
                  <span className="prompt-helper-eyebrow">
                    QUICK START
                  </span>

                  <h3 className="prompt-helper-title">
                    What would you like to explore?
                  </h3>

                  <p className="prompt-helper-description">
                    Choose a starting point. Customize the prompt
                    before running.
                  </p>
                </div>
              </div>

              <div className="prompt-helper-grid">
                {PROMPT_HELPERS.map((helper) => {
                  const isActive =
                    activeShortcut === helper.id;

                  return (
                    <button
                      key={helper.id}
                      type="button"
                      className={`prompt-helper-card${
                        isActive
                          ? " prompt-helper-card--active"
                          : ""
                      }`}
                      onClick={() => handleShortcut(helper)}
                      disabled={loading}
                      aria-pressed={isActive}
                      aria-label={`${helper.label}: ${helper.description}`}
                      title={helper.description}
                    >
                      <span
                        className="prompt-helper-icon"
                        aria-hidden="true"
                      >
                        {helper.icon}
                      </span>

                      <span className="prompt-helper-content">
                        <span className="prompt-helper-label">
                          {helper.label}
                        </span>

                        <span className="prompt-helper-card-description">
                          {helper.description}
                        </span>
                      </span>

                      <span
                        className="prompt-helper-arrow"
                        aria-hidden="true"
                      >
                        &#x2197;
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

