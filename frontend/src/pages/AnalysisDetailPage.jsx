/**
 * AnalysisDetailPage
 *
 * Reached via /workspace/analyses/:id
 *
 * Displays:
 *  - Saved analysis metadata (filename, request, date, status)
 *  - Saved results rendered via the existing panel components
 *  - Persisted conversation history (loaded from DB)
 *  - Follow-up input (sends to /history/analyses/:id/followup)
 *
 * Security: every API call passes through the authenticated
 * backend client — ownership is verified server-side.
 */

import { Component, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import { getAnalysis, getMessages, sendFollowUp } from "../api/workspace";
import { ApiError } from "../api/client";

import ProfilePanel       from "../components/workspace/ProfilePanel";
import CleaningPanel      from "../components/workspace/CleaningPanel";
import AnalysisPanel      from "../components/workspace/AnalysisPanel";
import VisualizationPanel from "../components/workspace/VisualizationPanel";
import ReportPanel        from "../components/workspace/ReportPanel";
import LatticeLoader      from "../components/workspace/LatticeLoader";

import "./AnalysisDetailPage.css";
import "../components/workspace/workspace.css";
import "../components/workspace/UploadPanel.css";

// ── Prompt Helper Shortcuts (mirrors workspace UploadPanel) ───────────
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
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── helpers ──────────────────────────────────────────────────────────

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString(undefined, {
        day: "numeric", month: "short", year: "numeric",
        hour: "numeric", minute: "2-digit",
      });
}

function getStatus(s) {
  const v = String(s || "").toLowerCase();
  if (["completed", "success", "succeeded"].includes(v)) return "completed";
  if (["failed", "error"].includes(v)) return "failed";
  if (["running", "processing", "pending"].includes(v)) return "running";
  return "unknown";
}

function buildTabs(results) {
  if (!results || typeof results !== "object") return [];
  const tabs = [];
  if (results.profile)          tabs.push({ id: "profile",       label: "Data Profile" });
  if (results.cleaning)         tabs.push({ id: "cleaning",      label: "Data Cleaning" });
  if (results.analysis)         tabs.push({ id: "analysis",      label: "Analysis" });
  if (results.visualizations)   tabs.push({ id: "visualizations",label: "Visualizations" });
  if (results.report || results.summary || results.document_analysis)
                                tabs.push({ id: "report",        label: "Report" });
  return tabs;
}

// ── Error Boundary ────────────────────────────────────────────────────

class AnalysisErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AnalysisDetailPage error boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="adp-error" style={{ margin: "2rem auto", maxWidth: "600px", textAlign: "center" }}>
          <h2>Unable to display this analysis</h2>
          <p>{this.state.error?.message || "An unexpected error occurred while rendering the conversation."}</p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button
              type="button"
              className="adp-back-link"
              style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "8px" }}
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <Link
              to="/workspace/analyses"
              className="adp-back-link"
              style={{ background: "rgba(255,255,255,0.08)", padding: "8px 16px", borderRadius: "8px" }}
            >
              Back to Recent Analyses
            </Link>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Content normalizer to ensure react-markdown receives a clean string ───

function formatMessageContent(content) {
  if (content == null) return "";
  if (typeof content === "string") return content;

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object") {
          return part.text || part.content || part.value || JSON.stringify(part);
        }
        return String(part ?? "");
      })
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof content === "object") {
    if (typeof content.text === "string") return content.text;
    if (typeof content.answer === "string") return content.answer;
    if (typeof content.content === "string") return content.content;
    if (typeof content.message === "string") return content.message;
    if (typeof content.response === "string") return content.response;
    if (Array.isArray(content.parts)) {
      return content.parts
        .map((p) => (typeof p === "string" ? p : p?.text || JSON.stringify(p)))
        .filter(Boolean)
        .join("\n\n");
    }
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return String(content);
    }
  }

  return String(content);
}

// ── Markdown message renderer ─────────────────────────────────────────

function MsgMarkdown({ text }) {
  const contentStr = formatMessageContent(text);
  if (!contentStr) return null;

  return (
    <div className="adp-msg-markdown">
      <ReactMarkdown>{contentStr}</ReactMarkdown>
    </div>
  );
}

// ── Result tabs (reuse WorkspacePage patterns) ────────────────────────

function SavedResults({ results, analysisTitle, analysisId }) {
  const tabs = buildTabs(results);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  if (!results || tabs.length === 0) {
    return (
      <div className="adp-no-results">
        <span>No structured results were saved for this analysis.</span>
      </div>
    );
  }

  return (
    <div className="adp-results-wrap">
      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div className="adp-result-tabs" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`adp-tab-btn${activeTab === t.id ? " adp-tab-btn--active" : ""}`}
              aria-selected={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adp-result-content">
        {activeTab === "profile"        && <ProfilePanel       profile={results.profile} />}
        {activeTab === "cleaning"       && <CleaningPanel      cleaning={results.cleaning} analysisId={analysisId} />}
        {activeTab === "analysis"       && <AnalysisPanel      analysis={results.analysis} />}
        {activeTab === "visualizations" && <VisualizationPanel visualizations={results.visualizations} />}
        {activeTab === "report"         && (
          <ReportPanel
            report={results.report}
            summary={results.summary}
            documentAnalysis={results.document_analysis}
          />
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────

function AnalysisDetailContent() {
  const { id } = useParams();
  const navigate = useNavigate();

  // -- Analysis data --
  const [analysis,  setAnalysis]  = useState(null);
  const [loadingA,  setLoadingA]  = useState(true);
  const [errorA,    setErrorA]    = useState("");

  // -- Conversation --
  const [messages,  setMessages]  = useState([]);
  const [loadingM,  setLoadingM]  = useState(true);

  // -- Follow-up input --
  const [question,       setQuestion]       = useState("");
  const [activeShortcut, setActiveShortcut] = useState(null);
  const [sending,        setSending]        = useState(false);
  const [sendError,      setSendError]      = useState("");

  const abortRef    = useRef(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);

  const handleShortcut = (helper) => {
    setActiveShortcut(helper.id);
    setQuestion(helper.prompt);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handleQuestionChange = (e) => {
    setQuestion(e.target.value);
    if (activeShortcut) {
      setActiveShortcut(null);
    }
  };

  // -- Load analysis --
  const loadAnalysis = useCallback(async () => {
    if (!id) return;
    setLoadingA(true);
    setErrorA("");
    try {
      const data = await getAnalysis(id);
      setAnalysis(data.analysis);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setErrorA("This analysis doesn't exist or you don't have permission to view it.");
      } else {
        setErrorA(err?.message || "Failed to load analysis.");
      }
    } finally {
      setLoadingA(false);
    }
  }, [id]);

  // -- Load persisted messages --
  const loadMessages = useCallback(async () => {
    if (!id) return;
    setLoadingM(true);
    try {
      const data = await getMessages(id);
      const rawList = Array.isArray(data?.messages) ? data.messages : [];
      setMessages(
        rawList.map((m) => ({
          ...m,
          content: formatMessageContent(m?.content),
        }))
      );
    } catch {
      // Non-fatal — messages may not exist yet.
      setMessages([]);
    } finally {
      setLoadingM(false);
    }
  }, [id]);

  useEffect(() => {
    loadAnalysis();
    loadMessages();
    return () => abortRef.current?.abort();
  }, [loadAnalysis, loadMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handlePause = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setSending(false);
    setMessages((prev) => prev.filter((m) => !m._temp));
    setSendError("Follow-up response paused.");
  }, []);

  // -- Send follow-up --
  async function handleSend(e) {
    e?.preventDefault();
    const q = question.trim();
    if (!q || sending) return;

    setSending(true);
    setSendError("");
    setActiveShortcut(null);

    // Optimistically add the user message
    const tempUserMsg = { role: "user", content: q, _temp: true };
    setMessages((prev) => [...prev, tempUserMsg]);
    setQuestion("");

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const result = await sendFollowUp(id, q, controller.signal);
      const answerStr = formatMessageContent(result?.answer);
      // Replace temp with real messages
      setMessages((prev) => [
        ...prev.filter((m) => !m._temp),
        { role: "user",      content: q,         created_at: new Date().toISOString() },
        { role: "assistant", content: answerStr, created_at: new Date().toISOString() },
      ]);
    } catch (err) {
      if (err?.name === "AbortError" || err?.message?.toLowerCase().includes("abort")) {
        setMessages((prev) => prev.filter((m) => !m._temp));
        setSendError("Follow-up response paused.");
        return;
      }
      setSendError(err?.message || "Failed to get a response. Please try again.");
      setMessages((prev) => prev.filter((m) => !m._temp));
    } finally {
      setSending(false);
      abortRef.current = null;
      textareaRef.current?.focus();
    }
  }

  // Enter to send, Shift+Enter for newline
  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (question.trim() && !sending) handleSend();
    }
  }

  // ── LOADING STATE ───────────────────────────────────────────────────
  if (loadingA) {
    return (
      <div className="adp-page">
        <div className="adp-state">
          <div className="adp-spinner" />
          <p>Loading analysis…</p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ─────────────────────────────────────────────────────
  if (errorA) {
    return (
      <div className="adp-page">
        <div className="adp-state adp-state--error">
          <div className="adp-state-icon">!</div>
          <h2>Couldn't load this analysis</h2>
          <p>{errorA}</p>
          <button
            type="button"
            className="adp-btn-primary"
            onClick={() => navigate("/workspace/analyses")}
          >
            ← Back to analyses
          </button>
        </div>
      </div>
    );
  }

  const results = analysis?.results || {};
  const status  = getStatus(analysis?.status);

  // ── MAIN VIEW ───────────────────────────────────────────────────────
  return (
    <div className="adp-page">

      {/* ── Breadcrumb ── */}
      <nav className="adp-breadcrumb" aria-label="Breadcrumb">
        <Link to="/workspace/analyses" className="adp-breadcrumb-link">
          ← Recent Analyses
        </Link>
        <span className="adp-breadcrumb-sep">/</span>
        <span className="adp-breadcrumb-current">
          {analysis?.filename || "Analysis"}
        </span>
      </nav>

      {/* ── Header ── */}
      <header className="adp-header">
        <div className="adp-header-meta">
          <span className="ws-label">WORKSPACE / ANALYSES</span>
          <h1 className="adp-title">
            {analysis?.filename || "Untitled analysis"}
          </h1>
          <p className="adp-request">
            {analysis?.user_request || "No request recorded."}
          </p>
        </div>

        <div className="adp-header-badges">
          <span className={`adp-status adp-status--${status}`}>
            <span className="adp-status-dot" />
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          <span className="adp-date">{formatDate(analysis?.created_at)}</span>
        </div>
      </header>

      {/* ── Saved Results ── */}
      <section className="adp-section">
        <h2 className="adp-section-title">
          <span aria-hidden="true">▤</span>
          Analysis Results
        </h2>
        <SavedResults results={results} analysisTitle={analysis?.filename || analysis?.title || "Analysis Report"} analysisId={id} />
      </section>

      {/* ── Conversation ── */}
      <section className="adp-section adp-conversation-section">
        <h2 className="adp-section-title">
          <span aria-hidden="true">◈</span>
          Conversation
        </h2>

        {/* Message history */}
        <div className="adp-messages" aria-live="polite" aria-label="Conversation">

          {!loadingM && messages.length === 0 && (
            <div className="adp-no-messages">
              <span>No follow-up questions yet.</span>
              <span>Ask anything about this analysis below.</span>
            </div>
          )}

          {loadingM && (
            <div className="adp-msg-loading">
              <div className="adp-spinner adp-spinner--sm" />
              <span>Loading conversation…</span>
            </div>
          )}

          {messages.map((msg, i) => {
            const contentStr = formatMessageContent(msg.content);
            return (
              <div
                key={msg.id || `${msg.role}-${i}`}
                className={`adp-msg adp-msg--${msg.role}${msg._temp ? " adp-msg--temp" : ""}`}
              >
                <div className="adp-msg-role">
                  {msg.role === "user" ? "You" : "AI Analyst"}
                </div>
                {msg.role === "assistant" ? (
                  <MsgMarkdown text={contentStr} />
                ) : (
                  <p className="adp-msg-text">{contentStr}</p>
                )}
                {msg.created_at && !msg._temp && (
                  <span className="adp-msg-time">{formatDate(msg.created_at)}</span>
                )}
              </div>
            );
          })}

          

          <div ref={bottomRef} />
        </div>

        {/* Send error */}
        {sendError && (
          <div className="adp-send-error" role="alert">
            {sendError}
          </div>
        )}

        {/* Follow-up input matching workspace prompt box styling & 6 shortcuts */}
        <form className="adp-composer-form" onSubmit={handleSend} noValidate>
          <div className="upload-request-wrap">
            <label className="ws-label" htmlFor="adp-followup-request">
              Your analytical question
            </label>

            {/* ONE UNIFIED PROMPT BOX */}
            <div className="prompt-composer">
              <textarea
                ref={textareaRef}
                id="adp-followup-request"
                className="upload-request"
                placeholder={`Ask anything...
e.g. Show the distribution of salaries by department and flag any outliers.`}
                value={question}
                onChange={handleQuestionChange}
                onKeyDown={handleKeyDown}
                rows={4}
                disabled={sending}
                aria-label="Follow-up analytical question"
              />

            {/* Response generation status inside the composer */}
            {sending && (
              <div
                className="prompt-thinking"
                role="status"
                aria-live="polite"
              >
                <div className="prompt-thinking-top">
                  <div className="prompt-thinking-status">
                    <span className="prompt-thinking-dot" />
                    <span className="prompt-thinking-label">
                      Analyzing dataset & generating follow-up...
                    </span>
                  </div>

                  <div className="prompt-thinking-right">
                    <button
                      type="button"
                      className="prompt-pause-btn"
                      onClick={handlePause}
                      title="Pause analysis"
                      aria-label="Pause analysis"
                    >
                      <span className="prompt-pause-icon" aria-hidden="true">&#x23F8;</span>
                      Pause
                    </button>
                  </div>
                </div>

                {analysis?.filename && (
                  <div className="prompt-thinking-file">
                    <span aria-hidden="true">&#x1F4C4;</span>
                    <span className="prompt-thinking-file-name" title={analysis.filename}>
                      {analysis.filename}
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

            {!sending && (
              <div className="prompt-action-row">
                <span className="prompt-action-hint">
                  {analysis?.filename ? `Ready for ${analysis.filename}` : "Ready when you are"}
                </span>

                <button
                  type="submit"
                  className="upload-submit prompt-submit"
                  disabled={!question.trim()}
                  id="analyze-btn"
                >
                  <IconArrow />
                  Run Analysis
                </button>
              </div>
            )}
          </div>

          {/* Quick Start shortcuts matching workspace */}
          {!sending && (
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
                    Choose a starting point. Customize the prompt before running.
                  </p>
                </div>
              </div>

              <div className="prompt-helper-grid">
                {PROMPT_HELPERS.map((helper) => {
                  const isActive = activeShortcut === helper.id;

                  return (
                    <button
                      key={helper.id}
                      type="button"
                      className={`prompt-helper-card${
                        isActive ? " prompt-helper-card--active" : ""
                      }`}
                      onClick={() => handleShortcut(helper)}
                      disabled={sending}
                      aria-pressed={isActive}
                      aria-label={`${helper.label}: ${helper.description}`}
                      title={helper.description}
                    >
                      <span className="prompt-helper-icon" aria-hidden="true">
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

                      <span className="prompt-helper-arrow" aria-hidden="true">
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
      </section>

    </div>
  );
}

export default function AnalysisDetailPage() {
  return (
    <AnalysisErrorBoundary>
      <AnalysisDetailContent />
    </AnalysisErrorBoundary>
  );
}
