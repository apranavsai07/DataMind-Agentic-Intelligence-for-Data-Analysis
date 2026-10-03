/**
 * ReportPanel
 *
 * Renders AI-generated reports and document summaries using react-markdown
 * for full Markdown support: headings, bold, italic, lists, tables, code blocks.
 *
 * Handles:
 *  - ReportResult     { status, text }
 *  - SummaryResult    { status, text, key_points }
 *  - DocumentAnalysis { status, findings }
 *  - plain string     (legacy / direct LLM output)
 */
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { downloadMarkdownAsPdf } from "../../lib/pdfGenerator.js";
import "./ReportPanel.css";

// ── Safe Markdown renderer ────────────────────────────────────────────
function MarkdownBody({ text }) {
  if (!text) return null;
  const contentStr =
    typeof text === "string"
      ? text
      : typeof text === "object"
      ? text.text || text.content || JSON.stringify(text, null, 2)
      : String(text);
  if (!contentStr) return null;

  return (
    <div className="report-markdown">
      <ReactMarkdown
        components={{
          // Headings
          h1: ({ children }) => <h1 className="rp-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="rp-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="rp-h3">{children}</h3>,
          h4: ({ children }) => <h4 className="rp-h4">{children}</h4>,
          // Paragraphs
          p:  ({ children }) => <p  className="rp-p">{children}</p>,
          // Lists
          ul: ({ children }) => <ul className="rp-ul">{children}</ul>,
          ol: ({ children }) => <ol className="rp-ol">{children}</ol>,
          li: ({ children }) => <li className="rp-li">{children}</li>,
          // Emphasis
          strong: ({ children }) => <strong className="rp-strong">{children}</strong>,
          em:     ({ children }) => <em className="rp-em">{children}</em>,
          // Code
          code: ({ inline, children }) =>
            inline ? (
              <code className="rp-code-inline">{children}</code>
            ) : (
              <pre className="rp-pre"><code>{children}</code></pre>
            ),
          // Table
          table: ({ children }) => (
            <div className="rp-table-wrap">
              <table className="rp-table">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="rp-th">{children}</th>,
          td: ({ children }) => <td className="rp-td">{children}</td>,
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="rp-blockquote">{children}</blockquote>
          ),
          // Horizontal rule
          hr: () => <hr className="rp-hr" />,
        }}
      >
        {contentStr}
      </ReactMarkdown>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────
export default function ReportPanel({ report, summary, documentAnalysis }) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState("");

  const hasReport   = report?.text;
  const hasSummary  = summary?.text || (typeof summary === "string" && summary);
  const hasDocAnalysis = documentAnalysis?.findings?.length > 0;

  if (!hasReport && !hasSummary && !hasDocAnalysis) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-icon">📝</div>
        <p className="ws-empty-text">
          No report was generated.
          <br />
          Ask for insights, a summary, or an explanation in your request.
        </p>
      </div>
    );
  }

  // Normalise summary to a string
  const summaryText =
    typeof summary === "string"
      ? summary
      : summary?.text || "";

  const handleDownloadPdf = async (text, title = "Analysis Report") => {
    setPdfBusy(true);
    setPdfError("");
    try {
      await downloadMarkdownAsPdf(text, title);
    } catch (err) {
      setPdfError(err.message || "Failed to generate PDF.");
    } finally {
      setPdfBusy(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {pdfError && (
        <div style={{ color: "#f87171", fontSize: "0.85rem", padding: "8px 12px", background: "rgba(248,113,113,0.1)", borderRadius: 8 }}>
          ⚠️ {pdfError}
        </div>
      )}

      {/* ── AI Analysis Report ── */}
      {hasReport && (
        <div className="report-panel">
          <div className="report-panel-header">
            <span className="ws-label">AI Analysis Report</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                type="button"
                onClick={() => handleDownloadPdf(report.text, "AI Analysis Report")}
                disabled={pdfBusy}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(16,185,129,0.45)",
                  background: pdfBusy ? "rgba(255,255,255,0.06)" : "rgba(16,185,129,0.18)",
                  color: "#6ee7b7",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: pdfBusy ? "default" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                <span>📄</span>
                {pdfBusy ? "Generating…" : "Download PDF"}
              </button>
            </div>
          </div>
          <div className="report-body">
            <MarkdownBody text={report.text} />
          </div>
        </div>
      )}

      {/* ── Document Summary / User-Request Response ── */}
      {hasSummary && (
        <div className="report-panel">
          <div className="report-panel-header">
            <span className="ws-label">AI Response</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!hasReport && (
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(summaryText, "AI Response")}
                  disabled={pdfBusy}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: "1px solid rgba(16,185,129,0.45)",
                    background: pdfBusy ? "rgba(255,255,255,0.06)" : "rgba(16,185,129,0.18)",
                    color: "#6ee7b7",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: pdfBusy ? "default" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <span>📄</span>
                  {pdfBusy ? "Generating…" : "Download PDF"}
                </button>
              )}
            </div>
          </div>
          <div className="report-body">
            <MarkdownBody text={summaryText} />
          </div>

          {summary?.key_points?.length > 0 && (
            <div style={{ padding: "0 24px 24px" }}>
              <div className="ws-label" style={{ marginBottom: "10px" }}>Key Points</div>
              <ul className="report-keypoints">
                {summary.key_points.map((point, i) => (
                  <li key={i} className="report-keypoint">
                    <span className="report-keypoint-dot" aria-hidden="true" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Document Analysis Findings ── */}
      {hasDocAnalysis && (
        <div className="report-panel">
          <div className="report-panel-header">
            <span className="ws-label">Document Analysis</span>
          </div>
          <div className="report-body">
            {documentAnalysis.findings.map((finding, i) => (
              <div key={i} style={{ marginBottom: "16px" }}>
                {finding.title && (
                  <h3 className="rp-h3" style={{ marginBottom: "6px" }}>
                    {finding.title}
                  </h3>
                )}
                <MarkdownBody text={finding.content} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
