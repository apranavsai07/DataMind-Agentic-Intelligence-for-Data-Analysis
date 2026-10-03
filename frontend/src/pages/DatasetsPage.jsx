
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { request } from "../api/client";
import { downloadDataset } from "../api/workspace";
import "./RecentAnalysesPage.css";
import "../components/workspace/workspace.css";

function formatDate(value) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // per-dataset download state: { [id]: { busy, error } }
  const [dlState, setDlState] = useState({});

  const loadDatasets = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await request("/datasets/?limit=100");
      setDatasets(data.datasets || []);
    } catch (err) {
      setError(err.message || "Unable to load datasets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatasets();
  }, [loadDatasets]);

  const handleDownload = async (dataset) => {
    const id = dataset.id;
    setDlState((prev) => ({ ...prev, [id]: { busy: true, error: null } }));
    try {
      await downloadDataset(id, dataset.filename || "dataset");
      setDlState((prev) => ({ ...prev, [id]: { busy: false, error: null } }));
    } catch (err) {
      setDlState((prev) => ({
        ...prev,
        [id]: { busy: false, error: err.message || "Download failed." },
      }));
    }
  };

  return (
    <main className="ws-placeholder recent-analyses-page">
      {/* ── Page heading ── */}
      <div className="recent-analyses-heading">
        <div>
          <span className="ws-label">WORKSPACE / DATASETS</span>
          <h1 className="ws-placeholder-title">Datasets</h1>
          <p className="ws-placeholder-sub">
            Your uploaded datasets, all in one place. Inspect schemas, view metadata,
            and download original source files.
          </p>
        </div>

        <button
          type="button"
          className="recent-analyses-refresh"
          onClick={loadDatasets}
          disabled={loading}
        >
          <span aria-hidden="true">↻</span>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ── Count summary ── */}
      <div className="recent-analyses-summary">
        <div className="recent-analyses-summary-icon">
          <span aria-hidden="true">🗄️</span>
        </div>
        <div>
          <span className="recent-analyses-summary-label">SAVED DATASETS</span>
          <strong>{loading ? "—" : datasets.length}</strong>
        </div>
      </div>

      {/* ── States ── */}
      {loading ? (
        <section className="recent-analyses-state" aria-live="polite">
          <div className="recent-analyses-spinner" />
          <h2>Loading your datasets</h2>
          <p>Fetching your uploaded files from the workspace.</p>
        </section>
      ) : error ? (
        <section className="recent-analyses-state recent-analyses-error" role="alert">
          <div className="recent-analyses-state-icon">!</div>
          <h2>Couldn't load your datasets</h2>
          <p>{error}</p>
          <button type="button" className="recent-analyses-primary" onClick={loadDatasets}>
            Try again
          </button>
        </section>
      ) : datasets.length === 0 ? (
        <section className="recent-analyses-state">
          <div className="recent-analyses-empty-icon">
            <span aria-hidden="true">◈</span>
          </div>
          <h2>No datasets yet</h2>
          <p>
            Once you upload a dataset, your files will appear here.
            You can inspect column profiles and download the raw data.
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
              <h2>Your uploaded datasets</h2>
              <p>Click download to retrieve original dataset files.</p>
            </div>
            <span className="recent-analyses-count">
              {datasets.length} {datasets.length === 1 ? "dataset" : "datasets"}
            </span>
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {datasets.map((dataset) => {
              const ds = dlState[dataset.id] || {};
              const sizeLabel = formatBytes(dataset.file_size_bytes ?? dataset.size_bytes);
              return (
                <div
                  key={dataset.id}
                  style={{
                    textAlign: "left",
                    padding: 20,
                    border: "1px solid rgba(255,255,255,0.12)",
                    borderRadius: 14,
                    background: "rgba(255,255,255,0.035)",
                    overflowWrap: "anywhere",
                    display: "grid",
                    gap: 6,
                  }}
                >
                  {/* Header row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <h3 style={{ margin: 0 }}>
                      {dataset.filename || "Untitled dataset"}
                    </h3>

                    <button
                      type="button"
                      onClick={() => handleDownload(dataset)}
                      disabled={ds.busy || !dataset.storage_path}
                      title={
                        !dataset.storage_path
                          ? "No stored file available"
                          : "Download dataset"
                      }
                      style={{
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,255,255,0.18)",
                        background: ds.busy
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(99,102,241,0.18)",
                        color: "var(--text-primary, #fff)",
                        cursor: ds.busy || !dataset.storage_path ? "default" : "pointer",
                        fontSize: 13,
                        fontWeight: 500,
                        opacity: !dataset.storage_path ? 0.45 : 1,
                        transition: "background 0.2s",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {ds.busy ? (
                        <>
                          <span style={{ fontSize: 14 }}>⏳</span>
                          Downloading…
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: 14 }}>⬇️</span>
                          Download
                        </>
                      )}
                    </button>
                  </div>

                  {/* Metadata */}
                  <p className="ws-placeholder-sub" style={{ margin: 0 }}>
                    {[
                      dataset.file_type || dataset.content_type,
                      sizeLabel,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  <p className="ws-placeholder-sub" style={{ margin: 0 }}>
                    Uploaded: {formatDate(dataset.created_at)}
                  </p>

                  {/* Download error */}
                  {ds.error && (
                    <p
                      style={{
                        margin: 0,
                        color: "#f87171",
                        fontSize: 13,
                      }}
                    >
                      ⚠️ {ds.error}
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