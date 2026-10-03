/**
 * VisualizationPanel
 * Displays chart images from the backend VisualizationResult schema.
 * Fields: status, visualizations[{type, title, file, x, y, metadata}]
 *
 * Chart files are served by FastAPI's StaticFiles mount at /outputs/
 */

import { useState } from "react";
import { getStaticUrl } from "../../api/client.js";
import { downloadImageFromUrl } from "../../lib/pdfGenerator.js";
import "./VisualizationPanel.css";

const CHART_ICONS = {
  HISTOGRAM:         "📊",
  BAR_CHART:         "📊",
  LINE_CHART:        "📈",
  SCATTER_PLOT:      "⬤",
  BOX_PLOT:          "📦",
  CORRELATION_HEATMAP: "🌡️",
};

export default function VisualizationPanel({ visualizations }) {
  const [lightbox, setLightbox] = useState(null); // index of active chart
  const [downloadingIdx, setDownloadingIdx] = useState(null);

  if (!visualizations || !visualizations.visualizations?.length) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-icon">📉</div>
        <p className="ws-empty-text">
          No visualizations were generated.
          <br />
          Ask for charts in your next request.
        </p>
      </div>
    );
  }

  const charts = visualizations.visualizations;

  const handleDownload = async (chart, index) => {
    const url = getStaticUrl(chart.file);
    if (!url) return;
    setDownloadingIdx(index);
    try {
      const safeTitle = (chart.title || "visualization").replace(/[^a-zA-Z0-9_-]/g, "_");
      await downloadImageFromUrl(url, `${safeTitle}.png`);
    } finally {
      setDownloadingIdx(null);
    }
  };

  const handleDownloadAll = async () => {
    for (let i = 0; i < charts.length; i++) {
      const c = charts[i];
      const url = getStaticUrl(c.file);
      if (url) {
        const safeTitle = (c.title || `visualization_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, "_");
        await downloadImageFromUrl(url, `${safeTitle}.png`);
        // Brief delay between multiple browser downloads
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

      {/* ── Summary toolbar + Download All ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div className="ws-stat-grid">
          <div className="ws-stat">
            <div className="ws-stat-value">{charts.length}</div>
            <div className="ws-stat-label">Charts Generated</div>
          </div>
        </div>

        {charts.length > 0 && (
          <button
            type="button"
            onClick={handleDownloadAll}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 18px",
              borderRadius: 10,
              border: "1px solid rgba(99,102,241,0.45)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.22), rgba(139,92,246,0.18))",
              color: "#a5b4fc",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s, box-shadow 0.2s",
              boxShadow: "0 0 14px rgba(99,102,241,0.18)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ fontSize: 16 }}>⬇️</span>
            {charts.length > 1 ? "Download All Charts (PNG)" : "Download Chart (PNG)"}
          </button>
        )}
      </div>

      {/* Chart grid */}
      <div className="viz-grid">
        {charts.map((chart, i) => {
          const url = getStaticUrl(chart.file);
          const icon = CHART_ICONS[chart.type] || "📊";

          return (
            <div
              key={i}
              className="viz-card"
              onClick={() => setLightbox(i)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setLightbox(i)}
              aria-label={`View chart: ${chart.title}`}
            >
              {url ? (
                <img
                  src={url}
                  alt={chart.title}
                  className="viz-card-img"
                  loading="lazy"
                />
              ) : (
                <div className="viz-card-placeholder">
                  <span>{icon}</span>
                  <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                    Image unavailable
                  </span>
                </div>
              )}

              <div className="viz-card-footer">
                <span className="viz-card-type">{chart.type.replace(/_/g, " ")}</span>
                <span className="viz-card-title">{chart.title}</span>
                {chart.metadata?.column && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {chart.metadata.column}
                  </span>
                )}
                {chart.metadata?.x_column && chart.metadata?.y_column && (
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "0.7rem",
                      color: "rgba(255,255,255,0.35)",
                    }}
                  >
                    {chart.metadata.x_column} × {chart.metadata.y_column}
                  </span>
                )}

                {/* Direct download button on card */}
                {url && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      className="viz-download-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(chart, i);
                      }}
                      disabled={downloadingIdx === i}
                      title="Download chart image (PNG)"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "5px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(99,102,241,0.4)",
                        background: "rgba(99,102,241,0.14)",
                        color: "#c7d2fe",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: downloadingIdx === i ? "default" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span>⬇️</span>
                      {downloadingIdx === i ? "Saving…" : "Download PNG"}
                    </button>
                  </div>
                )}
              </div>

              <div className="viz-card-expand" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 2h4M2 2v4M12 2H8M12 2v4M2 12h4M2 12v-4M12 12H8M12 12v-4"
                    stroke="rgba(255,255,255,0.6)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="viz-lightbox"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Chart lightbox"
        >
          <div
            className="viz-lightbox-inner"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              gap: 12,
              flexWrap: "wrap",
            }}>
              <div className="viz-lightbox-title" style={{ margin: 0 }}>
                {charts[lightbox].title}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {getStaticUrl(charts[lightbox].file) && (
                  <button
                    type="button"
                    onClick={() => handleDownload(charts[lightbox], lightbox)}
                    disabled={downloadingIdx === lightbox}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(99,102,241,0.5)",
                      background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.2))",
                      color: "#c7d2fe",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: downloadingIdx === lightbox ? "default" : "pointer",
                    }}
                  >
                    <span>⬇️</span>
                    {downloadingIdx === lightbox ? "Saving…" : "Download Chart (PNG)"}
                  </button>
                )}

                <button
                  className="viz-lightbox-close"
                  onClick={() => setLightbox(null)}
                  aria-label="Close"
                  style={{ position: "static" }}
                >
                  ✕
                </button>
              </div>
            </div>

            {getStaticUrl(charts[lightbox].file) ? (
              <img
                src={getStaticUrl(charts[lightbox].file)}
                alt={charts[lightbox].title}
                className="viz-lightbox-img"
              />
            ) : (
              <div className="viz-card-placeholder" style={{ height: "300px" }}>
                <span style={{ fontSize: "2rem" }}>📊</span>
                <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.3)" }}>
                  Image unavailable
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
