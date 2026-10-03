/**
 * CleaningPanel
 * Displays data cleaning results from the backend CleaningResult schema.
 * Fields: status, operations[{operation, parameters, details}],
 *         cleaned_output_id, cleaned_csv_name
 *
 * Props:
 *   cleaning    — CleaningResult object from the backend
 *   analysisId  — UUID of the parent analysis (needed for download)
 */

import { useState } from "react";
import { downloadOutput } from "../../api/workspace";
import { downloadCsvFile } from "../../lib/pdfGenerator";

const OP_LABELS = {
  FILL_MISSING_VALUES: "Fill Missing Values",
  REMOVE_DUPLICATES:   "Remove Duplicates",
  DROP_COLUMNS:        "Drop Columns",
  CONVERT_COLUMN_TYPE: "Convert Column Type",
};

const OP_ICONS = {
  FILL_MISSING_VALUES: "🧩",
  REMOVE_DUPLICATES:   "🗑️",
  DROP_COLUMNS:        "✂️",
  CONVERT_COLUMN_TYPE: "🔄",
};

function fmt(n) {
  return n == null ? "—" : Number(n).toLocaleString();
}

export default function CleaningPanel({ cleaning, analysisId }) {
  const [dlBusy,  setDlBusy]  = useState(false);
  const [dlError, setDlError] = useState("");

  const outputId  = cleaning?.cleaned_output_id;
  const csvName   = cleaning?.cleaned_csv_name || "cleaned_data.csv";
  const canDownload = !!cleaning?.csv_data || (!!outputId && !!analysisId);

  const handleDownloadCsv = async () => {
    if (!canDownload) return;
    setDlBusy(true);
    setDlError("");
    try {
      if (cleaning?.csv_data) {
        downloadCsvFile(cleaning.csv_data, csvName);
      } else {
        await downloadOutput(analysisId, outputId, csvName);
      }
    } catch (err) {
      setDlError(err.message || "Download failed.");
    } finally {
      setDlBusy(false);
    }
  };

  if (!cleaning || !cleaning.operations?.length) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-icon">🧹</div>
        <p className="ws-empty-text">No cleaning operations were performed.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Summary bar + download button ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div className="ws-stat-grid">
          <div className="ws-stat">
            <div className="ws-stat-value">{cleaning.operations.length}</div>
            <div className="ws-stat-label">Operations</div>
          </div>
        </div>

        {/* Download Cleaned CSV */}
        {canDownload && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={dlBusy}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                borderRadius: 10,
                border: "1px solid rgba(99,102,241,0.45)",
                background: dlBusy
                  ? "rgba(255,255,255,0.05)"
                  : "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.18))",
                color: "#a5b4fc",
                fontSize: 13,
                fontWeight: 600,
                cursor: dlBusy ? "default" : "pointer",
                transition: "background 0.2s, box-shadow 0.2s",
                boxShadow: dlBusy ? "none" : "0 0 14px rgba(99,102,241,0.18)",
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 16 }}>⬇️</span>
              {dlBusy ? "Downloading…" : "Download Cleaned CSV"}
            </button>
            {dlError && (
              <span style={{ color: "#f87171", fontSize: 12 }}>⚠️ {dlError}</span>
            )}
          </div>
        )}
      </div>

      {/* ── Operations ── */}
      {cleaning.operations.map((op, i) => {
        const label   = OP_LABELS[op.operation] || op.operation;
        const icon    = OP_ICONS[op.operation] || "⚙️";
        const details = op.details || {};

        return (
          <div key={i} className="ws-panel">
            <div className="ws-panel-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.1rem" }} aria-hidden="true">{icon}</span>
                <span className="ws-panel-title">{label}</span>
              </div>
              <span className="ws-badge ws-badge--green">Completed</span>
            </div>

            <div className="ws-panel-body" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>

              {/* Parameters */}
              {op.parameters && Object.keys(op.parameters).length > 0 && (
                <div>
                  <div className="ws-label" style={{ marginBottom: "6px" }}>Parameters</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {Object.entries(op.parameters).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          padding: "4px 10px",
                          borderRadius: "999px",
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(255,255,255,0.03)",
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.6)",
                        }}
                      >
                        <span style={{ color: "rgba(255,255,255,0.35)" }}>{k}: </span>
                        {Array.isArray(v) ? v.join(", ") : String(v)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Before / After */}
              {details.before && details.after && (
                <div style={{ display: "flex", gap: "12px" }}>
                  <div className="ws-stat" style={{ flex: 1 }}>
                    <div className="ws-stat-value">{fmt(details.before.rows)}</div>
                    <div className="ws-stat-label">Rows before</div>
                  </div>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    color: "rgba(255,255,255,0.25)",
                    fontSize: "1.2rem",
                  }}>→</div>
                  <div className="ws-stat" style={{ flex: 1 }}>
                    <div className="ws-stat-value">{fmt(details.after.rows)}</div>
                    <div className="ws-stat-label">Rows after</div>
                  </div>
                </div>
              )}

              {/* FILL: filled values */}
              {op.operation === "FILL_MISSING_VALUES" && details.filled_values && (
                <div>
                  <div className="ws-label" style={{ marginBottom: "8px" }}>Cells filled</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {Object.entries(details.filled_values).map(([col, count]) => (
                      <div key={col} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.8rem",
                        padding: "6px 10px",
                        borderRadius: "8px",
                        background: "rgba(52,211,153,0.06)",
                        border: "1px solid rgba(52,211,153,0.15)",
                      }}>
                        <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.7)" }}>{col}</span>
                        <span style={{ color: "#6ee7b7", fontWeight: 600 }}>+{fmt(count)} filled</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REMOVE_DUPLICATES */}
              {op.operation === "REMOVE_DUPLICATES" && details.removed_rows != null && (
                <div className="ws-stat" style={{ width: "fit-content" }}>
                  <div className="ws-stat-value" style={{ color: "#6ee7b7" }}>
                    {fmt(details.removed_rows)}
                  </div>
                  <div className="ws-stat-label">Duplicate rows removed</div>
                </div>
              )}

              {/* DROP_COLUMNS */}
              {op.operation === "DROP_COLUMNS" && details.columns && (
                <div>
                  <div className="ws-label" style={{ marginBottom: "6px" }}>Dropped columns</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {details.columns.map((col) => (
                      <span
                        key={col}
                        className="ws-badge ws-badge--orange"
                        style={{ fontFamily: "monospace" }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CONVERT_COLUMN_TYPE */}
              {op.operation === "CONVERT_COLUMN_TYPE" && details.column && (
                <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.6)" }}>
                  Column{" "}
                  <code style={{
                    padding: "2px 7px",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.06)",
                    color: "white",
                    fontFamily: "monospace",
                  }}>
                    {details.column}
                  </code>
                  {" "}converted from{" "}
                  <span className="ws-badge ws-badge--purple" style={{ fontFamily: "monospace" }}>
                    {details.before_dtype}
                  </span>
                  {" "}→{" "}
                  <span className="ws-badge ws-badge--green" style={{ fontFamily: "monospace" }}>
                    {details.after_dtype}
                  </span>
                </div>
              )}

            </div>
          </div>
        );
      })}
    </div>
  );
}
