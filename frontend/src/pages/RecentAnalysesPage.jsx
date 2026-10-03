import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getRecentAnalyses } from "../api/workspace";
import "./RecentAnalysesPage.css";
import "../components/workspace/workspace.css";

// ── Helpers ───────────────────────────────────────────────────────────

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleString(undefined, {
    day: "numeric", month: "short", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function getStatus(status) {
  const v = String(status || "unknown").toLowerCase();
  if (["completed", "success", "succeeded"].includes(v)) return "completed";
  if (["failed", "error"].includes(v))                   return "failed";
  if (["running", "processing", "pending"].includes(v))  return "running";
  return "unknown";
}

function getErrorMessage(err) {
  return err?.message || "We couldn't load your recent analyses. Please try again.";
}

/** Return badges for analysis availability: Report, Outputs. */
function AnalysisBadges({ analysis }) {
  const results = analysis?.results || {};
  const hasReport = results.report || results.summary;
  const hasArtifacts = Array.isArray(analysis?.artifacts) && analysis.artifacts.length > 0;
  const hasProfile = results.profile;
  const hasAnalysis = results.analysis;

  return (
    <div className="ra-card-badges">
      {hasReport   && <span className="ra-badge ra-badge--report">Report</span>}
      {hasProfile  && <span className="ra-badge ra-badge--data">Profile</span>}
      {hasAnalysis && <span className="ra-badge ra-badge--data">Analysis</span>}
      {hasArtifacts && (
        <span className="ra-badge ra-badge--output">
          {analysis.artifacts.length} Output{analysis.artifacts.length !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}

/** Single analysis card. */
function AnalysisCard({ analysis }) {
  const status = getStatus(analysis.status);

  return (
    <Link
      to={`/workspace/analyses/${analysis.id}`}
      className="ra-card"
      aria-label={`Open analysis: ${analysis.filename || "Untitled"}`}
    >
      <div className="ra-card-top">
        {/* File icon */}
        <div className="ra-card-icon" aria-hidden="true">▤</div>

        {/* Status badge */}
        <span className={`recent-analyses-status status-${status}`}>
          <span className="recent-analyses-status-dot" />
          {status === "unknown" ? "Unknown"
            : status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="ra-card-body">
        <strong
          className="ra-card-filename"
          title={analysis.filename || "Untitled analysis"}
        >
          {analysis.filename || "Untitled analysis"}
        </strong>

        <p className="ra-card-request">
          {analysis.user_request || "No analytical request recorded."}
        </p>
      </div>

      <div className="ra-card-footer">
        <AnalysisBadges analysis={analysis} />
        <span className="ra-card-date">{formatDate(analysis.created_at)}</span>
      </div>

      <div className="ra-card-open-hint" aria-hidden="true">
        Open →
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────

export default function RecentAnalysesPage() {
  const [analyses, setAnalyses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const loadAnalyses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getRecentAnalyses(100);
      setAnalyses(Array.isArray(response?.analyses) ? response.analyses : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAnalyses(); }, [loadAnalyses]);

  return (
    <main className="ws-placeholder recent-analyses-page">

      {/* ── Page heading ── */}
      <div className="recent-analyses-heading">
        <div>
          <span className="ws-label">WORKSPACE / HISTORY</span>
          <h1 className="ws-placeholder-title">Recent Analyses</h1>
          <p className="ws-placeholder-sub">
            Pick up where you left off. Click any analysis to view results
            and continue the conversation.
          </p>
        </div>

        <button
          type="button"
          className="recent-analyses-refresh"
          onClick={loadAnalyses}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Count summary ── */}
      <div className="recent-analyses-summary">
        <div className="recent-analyses-summary-icon">
          <span aria-hidden="true">✳</span>
        </div>
        <div>
          <span className="recent-analyses-summary-label">SAVED ANALYSES</span>
          <strong>{loading ? "—" : analyses.length}</strong>
        </div>
      </div>

      {/* ── States ── */}
      {loading ? (
        <section className="recent-analyses-state" aria-live="polite">
          <div className="recent-analyses-spinner" />
          <h2>Loading your analyses</h2>
          <p>Fetching your saved work from the workspace.</p>
        </section>
      ) : error ? (
        <section className="recent-analyses-state recent-analyses-error" role="alert">
          <div className="recent-analyses-state-icon">!</div>
          <h2>Couldn't load your analyses</h2>
          <p>{error}</p>
          <button type="button" className="recent-analyses-primary" onClick={loadAnalyses}>
            Try again
          </button>
        </section>
      ) : analyses.length === 0 ? (
        <section className="recent-analyses-state">
          <div className="recent-analyses-empty-icon">
            <span aria-hidden="true">◈</span>
          </div>
          <h2>No analyses yet</h2>
          <p>
            Once you analyze a dataset, your saved analyses will appear here.
            You can reopen any analysis and continue the conversation.
          </p>
          <Link to="/workspace" className="recent-analyses-primary" style={{ display: "inline-block", marginTop: 20, textDecoration: "none" }}>
            Start new analysis →
          </Link>
        </section>
      ) : (
        <section className="recent-analyses-list">
          <div className="recent-analyses-list-heading">
            <div>
              <h2>Your analysis history</h2>
              <p>Click an analysis to reopen it and continue the conversation.</p>
            </div>
            <span className="recent-analyses-count">
              {analyses.length} {analyses.length === 1 ? "analysis" : "analyses"}
            </span>
          </div>

          {/* Card grid */}
          <div className="ra-card-grid">
            {analyses.map((analysis, index) => (
              <AnalysisCard
                key={analysis.id || `${analysis.filename || "analysis"}-${index}`}
                analysis={analysis}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}