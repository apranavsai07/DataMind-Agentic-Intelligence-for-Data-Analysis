
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/client";
import { downloadOutput } from "../api/workspace";
import { downloadMarkdownAsPdf, downloadTextFile, downloadCsvFile } from "../lib/pdfGenerator";
import "./RecentAnalysesPage.css";
import "../components/workspace/workspace.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function getOutputTitle(output) {
  return (
    output.title ||
    output.filename ||
    output.name ||
    output.output_type ||
    output.type ||
    "Analysis output"
  );
}

function getOutputContent(output) {
  const content =
    output.content ?? output.data ?? output.result ?? output.description;
  if (content == null) return null;
  if (typeof content === "string") return content;
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
}

/** Badge colour depending on output type */
function typeColor(output) {
  const t = (output.output_type || output.type || "").toLowerCase();
  if (t.includes("chart") || t.includes("viz") || t.includes("plot"))
    return "#6366f1";
  if (t.includes("report") || t.includes("markdown")) return "#10b981";
  if (t.includes("clean") || t.includes("csv")) return "#f59e0b";
  return "#94a3b8";
}

export default function OutputsPage() {
  const [outputs, setOutputs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // per-output download state  { [id]: { busy, error } }
  const [dlState, setDlState] = useState({});

  const loadOutputs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const history = await request("/history/analyses?limit=100");
      const analyses = history.analyses || [];

      const outputGroups = await Promise.all(
        analyses.map(async (analysis) => {
          try {
            const result = await request(
              `/history/analyses/${encodeURIComponent(analysis.id)}/outputs`
            );
            return (result.outputs || []).map((output) => ({
              ...output,
              analysis_id: analysis.id,
              analysis_title:
                analysis.title || analysis.name || analysis.filename || "Analysis",
              analysis_created_at: analysis.created_at,
            }));
          } catch (err) {
            return [
              {
                _fetch_error: true,
                _error_message:
                  err.message || "Could not load this analysis's outputs.",
                id: `error-${analysis.id}`,
                analysis_id: analysis.id,
                analysis_title:
                  analysis.title || analysis.name || "Analysis",
                analysis_created_at: analysis.created_at,
              },
            ];
          }
        })
      );

      const flattened = outputGroups
        .flat()
        .sort((a, b) => {
          const dA = new Date(a.created_at || a.analysis_created_at || 0).getTime();
          const dB = new Date(b.created_at || b.analysis_created_at || 0).getTime();
          return dB - dA;
        });

      setOutputs(flattened);
    } catch (err) {
      setError(err.message || "Unable to load your outputs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutputs();
  }, [loadOutputs]);

  /** True if this output is cleaned CSV data */
  function isCleanedDataType(output) {
    const t = (output.output_type || output.type || "").toLowerCase();
    const n = (output.name || "").toLowerCase();
    return (
      t === "cleaned_data" ||
      t.includes("clean") ||
      n.endsWith(".csv") ||
      output.content_type === "text/csv"
    );
  }

  /** True if this output is a text/markdown report */
  function isReportType(output) {
    if (isCleanedDataType(output)) return false;
    const t = (output.output_type || output.type || "").toLowerCase();
    const n = (output.name || "").toLowerCase();
    return (
      t.includes("report") ||
      t.includes("markdown") ||
      t.includes("summary") ||
      n.endsWith(".md") ||
      output.content_type === "text/markdown"
    );
  }

  /** True if this output is a chart or image visualization */
  function isVisualizationType(output) {
    const t = (output.output_type || output.type || "").toLowerCase();
    const n = (output.name || "").toLowerCase();
    return (
      t.includes("viz") ||
      t.includes("chart") ||
      t.includes("image") ||
      t.includes("plot") ||
      n.endsWith(".png") ||
      n.endsWith(".jpg") ||
      n.endsWith(".jpeg")
    );
  }

  const handleDownload = async (output) => {
    const key = output.id;
    setDlState((prev) => ({ ...prev, [key]: { busy: true, label: "Preparing…", error: null } }));
    try {
      const title = getOutputTitle(output);

      // ── Cleaned CSV outputs → proper formatted CSV download ─────────
      if (isCleanedDataType(output)) {
        const text = typeof output.content === "string" ? output.content : null;
        if (text && text.includes(",")) {
          downloadCsvFile(text, title.endsWith(".csv") ? title : `${title}.csv`);
        } else {
          await downloadOutput(output.analysis_id, output.id, title.endsWith(".csv") ? title : `${title}.csv`);
        }

      // ── Report / markdown outputs → styled PDF ──────────────────────
      } else if (isReportType(output)) {
        // Get the raw content — prefer inline content, otherwise fetch from storage.
        let mdText = null;
        const inlineContent = getOutputContent(output);
        if (inlineContent) {
          mdText = inlineContent;
        } else {
          // Fetch from backend (it'll follow the redirect to storage).
          setDlState((prev) => ({ ...prev, [key]: { busy: true, label: "Fetching report…", error: null } }));
          const { supabase } = await import("../lib/supabase");
          const { data: { session } } = await supabase.auth.getSession();
          const { BASE_URL } = await import("../api/client");
          const res = await fetch(
            `${BASE_URL}/history/analyses/${encodeURIComponent(output.analysis_id)}/outputs/${encodeURIComponent(output.id)}/download`,
            {
              redirect: "follow",
              headers: session?.access_token
                ? { Authorization: `Bearer ${session.access_token}` }
                : {},
            }
          );
          if (!res.ok) throw new Error(`Server returned ${res.status}`);
          mdText = await res.text();
        }

        setDlState((prev) => ({ ...prev, [key]: { busy: true, label: "Generating PDF…", error: null } }));
        await downloadMarkdownAsPdf(mdText, title);

      // ── Visualizations and stored files → file download ─────────────
      } else {
        await downloadOutput(output.analysis_id, output.id, title);
      }

      setDlState((prev) => ({ ...prev, [key]: { busy: false, label: "", error: null } }));
    } catch (err) {
      setDlState((prev) => ({
        ...prev,
        [key]: { busy: false, label: "", error: err.message || "Download failed." },
      }));
    }
  };

  // Count only real (non-error-placeholder) outputs
  const realOutputCount = outputs.filter((o) => !o._fetch_error).length;

  return (
    <main className="ws-placeholder recent-analyses-page">
      {/* ── Page heading ── */}
      <div className="recent-analyses-heading">
        <div>
          <span className="ws-label">WORKSPACE / OUTPUTS</span>
          <h1 className="ws-placeholder-title">Outputs &amp; Reports</h1>
          <p className="ws-placeholder-sub">
            Generated results from your analyses — visualizations, reports, and cleaned data.
          </p>
        </div>

        <button
          type="button"
          className="recent-analyses-refresh"
          onClick={loadOutputs}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Count summary ── */}
      <div className="recent-analyses-summary">
        <div className="recent-analyses-summary-icon">
          <span aria-hidden="true">📑</span>
        </div>
        <div>
          <span className="recent-analyses-summary-label">OUTPUT ARTIFACTS</span>
          <strong>{loading ? "—" : realOutputCount}</strong>
        </div>
      </div>

      {/* ── States ── */}
      {loading ? (
        <section className="recent-analyses-state" aria-live="polite">
          <div className="recent-analyses-spinner" />
          <h2>Loading your outputs</h2>
          <p>Fetching your generated artifacts and reports from the workspace.</p>
        </section>
      ) : error ? (
        <section className="recent-analyses-state recent-analyses-error" role="alert">
          <div className="recent-analyses-state-icon">!</div>
          <h2>Couldn't load your outputs</h2>
          <p>{error}</p>
          <button type="button" className="recent-analyses-primary" onClick={loadOutputs}>
            Try again
          </button>
        </section>
      ) : outputs.length === 0 ? (
        <section className="recent-analyses-state">
          <div className="recent-analyses-empty-icon">
            <span aria-hidden="true">◈</span>
          </div>
          <h2>No outputs yet</h2>
          <p>
            Run an analysis or data cleaning workflow on a dataset to generate
            downloadable CSVs, charts, and reports.
          </p>
          <Link
            to="/workspace"
            className="recent-analyses-primary"
            style={{ display: "inline-block", marginTop: 20, textDecoration: "none" }}
          >
            Start new analysis →
          </Link>
        </section>
      ) : (
        <section className="recent-analyses-list">
          <div className="recent-analyses-list-heading">
            <div>
              <h2>Your generated outputs</h2>
              <p>Download cleaned dataset CSVs, interactive charts, and PDF reports.</p>
            </div>
            <span className="recent-analyses-count">
              {realOutputCount} {realOutputCount === 1 ? "output" : "outputs"}
            </span>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {outputs.map((output, index) => {
              const content = getOutputContent(output);
              const dl = dlState[output.id] || {};
              const isClean = isCleanedDataType(output);
              const isRep = isReportType(output);
              const isViz = isVisualizationType(output);
              const canDownload =
                !output._fetch_error &&
                (isRep || isClean || isViz) &&
                (output.storage_path || output.content != null);

              return (
                <div
                  key={output.id || `${output.analysis_id}-${index}`}
                  style={{
                    textAlign: "left",
                    padding: 20,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.035)",
                    overflowWrap: "anywhere",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  {/* Header */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {/* type badge */}
                      {(output.output_type || output.type) && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: typeColor(output) + "26",
                            color: typeColor(output),
                            border: `1px solid ${typeColor(output)}55`,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            flexShrink: 0,
                          }}
                        >
                          {output.output_type || output.type}
                        </span>
                      )}
                      <h3 style={{ margin: 0, fontSize: 15 }}>
                        {getOutputTitle(output)}
                      </h3>
                    </div>

                    {/* Download button */}
                    {canDownload && (
                      <button
                        type="button"
                        onClick={() => handleDownload(output)}
                        disabled={dl.busy}
                        title={
                          isRep
                            ? "Download as formatted PDF"
                            : isClean
                            ? "Download cleaned CSV file"
                            : "Download visualization image"
                        }
                        style={{
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.18)",
                          background: dl.busy
                            ? "rgba(255,255,255,0.06)"
                            : isRep
                            ? "rgba(16,185,129,0.18)"
                            : isClean
                            ? "rgba(245,158,11,0.18)"
                            : "rgba(99,102,241,0.18)",
                          color: "var(--text-primary, #fff)",
                          cursor: dl.busy ? "default" : "pointer",
                          fontSize: 13,
                          fontWeight: 500,
                          transition: "background 0.2s",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {dl.busy ? (
                          <>
                            <span style={{ fontSize: 14 }}>⏳</span>
                            {dl.label || "Working…"}
                          </>
                        ) : isRep ? (
                          <>
                            <span style={{ fontSize: 14 }}>📄</span>
                            Download PDF
                          </>
                        ) : isClean ? (
                          <>
                            <span style={{ fontSize: 14 }}>⬇️</span>
                            Download CSV
                          </>
                        ) : isViz ? (
                          <>
                            <span style={{ fontSize: 14 }}>🖼️</span>
                            Download Image
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize: 14 }}>⬇️</span>
                            Download
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Meta */}
                  <p className="ws-placeholder-sub" style={{ margin: 0 }}>
                    From: {output.analysis_title}
                  </p>
                  <p className="ws-placeholder-sub" style={{ margin: 0 }}>
                    Created: {formatDate(output.created_at)}
                  </p>

                  {/* Error fetch placeholder */}
                  {output._fetch_error && (
                    <p className="ws-placeholder-sub" role="alert">
                      {output._error_message}
                    </p>
                  )}

                  {/* Inline content preview */}
                  {!output._fetch_error && content && (
                    <details style={{ marginTop: 8 }}>
                      <summary style={{ cursor: "pointer", fontSize: 13 }}>
                        Preview output
                      </summary>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          overflowWrap: "anywhere",
                          maxHeight: 420,
                          overflow: "auto",
                          padding: 14,
                          marginTop: 10,
                          borderRadius: 10,
                          background: "rgba(0,0,0,0.2)",
                          fontSize: 13,
                        }}
                      >
                        {content}
                      </pre>
                    </details>
                  )}

                  {/* Storage info (no inline content) */}
                  {!output._fetch_error && !content && output.storage_path && (
                    <p className="ws-placeholder-sub" style={{ margin: 0, fontSize: 12 }}>
                      📁 {output.filename || output.storage_path}
                    </p>
                  )}

                  {/* No content, no storage */}
                  {!output._fetch_error && !content && !output.storage_path && (
                    <p className="ws-placeholder-sub" style={{ margin: 0 }}>
                      Output metadata is available, but no inline content was returned.
                    </p>
                  )}

                  {/* Download error */}
                  {dl.error && (
                    <p style={{ margin: 0, color: "#f87171", fontSize: 13 }}>
                      ⚠️ {dl.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
  );
}
