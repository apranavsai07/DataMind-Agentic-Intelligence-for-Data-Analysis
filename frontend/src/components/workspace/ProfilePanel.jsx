/**
 * ProfilePanel
 * Displays dataset profiling results from the backend.
 * Uses the ProfileResult schema fields:
 *   rows, columns, column_names, dtypes, missing_values,
 *   duplicates, numeric_summary, categorical_summary
 */

const TYPE_COLORS = {
  int64:   "ws-badge--purple",
  float64: "ws-badge--blue",
  object:  "ws-badge--pink",
  bool:    "ws-badge--orange",
  datetime64: "ws-badge--green",
};

function typeColor(dtype) {
  for (const [key, cls] of Object.entries(TYPE_COLORS)) {
    if (dtype.startsWith(key)) return cls;
  }
  return "ws-badge--purple";
}

function pct(val, total) {
  if (!total) return "0%";
  return `${((val / total) * 100).toFixed(1)}%`;
}

export default function ProfilePanel({ profile }) {
  if (!profile) return null;

  const {
    rows = 0,
    columns = 0,
    column_names = [],
    dtypes = {},
    missing_values = {},
    duplicates,
    numeric_summary = {},
    categorical_summary = {},
  } = profile;

  const totalMissing = Object.values(missing_values).reduce(
    (s, v) => s + v,
    0,
  );

  const hasMissing = Object.keys(missing_values).length > 0;
  const hasNumeric = Object.keys(numeric_summary).length > 0;
  const hasCategorical = Object.keys(categorical_summary).length > 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* ── Stats Row ── */}
      <div className="ws-stat-grid">
        <div className="ws-stat">
          <div className="ws-stat-value">{rows.toLocaleString()}</div>
          <div className="ws-stat-label">Rows</div>
        </div>
        <div className="ws-stat">
          <div className="ws-stat-value">{columns}</div>
          <div className="ws-stat-label">Columns</div>
        </div>
        <div className="ws-stat">
          <div className="ws-stat-value">{totalMissing.toLocaleString()}</div>
          <div className="ws-stat-label">Missing Values</div>
        </div>
        <div className="ws-stat">
          <div className="ws-stat-value">{duplicates ?? "—"}</div>
          <div className="ws-stat-label">Duplicates</div>
        </div>
      </div>

      {/* ── Column Types ── */}
      {column_names.length > 0 && (
        <div className="ws-panel">
          <div className="ws-panel-header">
            <span className="ws-panel-title">Column Types</span>
            <span className="ws-badge ws-badge--purple">{column_names.length} columns</span>
          </div>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Missing</th>
                  <th>Missing %</th>
                </tr>
              </thead>
              <tbody>
                {column_names.map((col) => {
                  const dtype = dtypes[col] || "unknown";
                  const missing = missing_values[col] || 0;
                  return (
                    <tr key={col}>
                      <td style={{ fontWeight: 600, color: "white", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {col}
                      </td>
                      <td>
                        <span className={`ws-badge ${typeColor(dtype)}`}>
                          {dtype}
                        </span>
                      </td>
                      <td style={{ color: missing > 0 ? "#fbb96e" : "rgba(255,255,255,0.4)" }}>
                        {missing.toLocaleString()}
                      </td>
                      <td style={{ color: missing > 0 ? "#fbb96e" : "rgba(255,255,255,0.4)" }}>
                        {pct(missing, rows)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Missing Values Summary ── */}
      {hasMissing && (
        <div className="ws-panel">
          <div className="ws-panel-header">
            <span className="ws-panel-title">Missing Values Summary</span>
            <span className="ws-badge ws-badge--orange">{pct(totalMissing, rows * columns)} of all cells</span>
          </div>
          <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {Object.entries(missing_values).map(([col, count]) => (
              <div key={col} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem" }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{col}</span>
                  <span style={{ color: "#fbb96e" }}>
                    {count.toLocaleString()} ({pct(count, rows)})
                  </span>
                </div>
                <div style={{
                  height: "4px",
                  borderRadius: "999px",
                  background: "rgba(255,255,255,0.07)",
                  overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%",
                    width: pct(count, rows),
                    background: "linear-gradient(90deg, #f59e0b, #fb923c)",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Numeric Summary ── */}
      {hasNumeric && (
        <div className="ws-panel">
          <div className="ws-panel-header">
            <span className="ws-panel-title">Numeric Summary</span>
          </div>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Count</th>
                  <th>Mean</th>
                  <th>Std</th>
                  <th>Min</th>
                  <th>25%</th>
                  <th>50%</th>
                  <th>75%</th>
                  <th>Max</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(numeric_summary).map(([col, stats]) => {
                  const fmt = (v) =>
                    v == null ? "—" : Number(v).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    });
                  return (
                    <tr key={col}>
                      <td style={{ fontWeight: 600, color: "white", fontFamily: "monospace", fontSize: "0.8rem" }}>
                        {col}
                      </td>
                      <td>{fmt(stats["count"])}</td>
                      <td>{fmt(stats["mean"])}</td>
                      <td>{fmt(stats["std"])}</td>
                      <td>{fmt(stats["min"])}</td>
                      <td>{fmt(stats["25%"])}</td>
                      <td>{fmt(stats["50%"])}</td>
                      <td>{fmt(stats["75%"])}</td>
                      <td>{fmt(stats["max"])}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Categorical Summary ── */}
      {hasCategorical && (
        <div className="ws-panel">
          <div className="ws-panel-header">
            <span className="ws-panel-title">Categorical Columns</span>
          </div>
          <div style={{ padding: "14px 22px", display: "flex", flexDirection: "column", gap: "20px" }}>
            {Object.entries(categorical_summary).map(([col, info]) => (
              <div key={col}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: 600, color: "white" }}>
                    {col}
                  </span>
                  <span className="ws-badge ws-badge--purple">
                    {info.unique_values} unique
                  </span>
                  {info.missing_values > 0 && (
                    <span className="ws-badge ws-badge--orange">
                      {info.missing_values} missing
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {Object.entries(info.top_values || {}).slice(0, 8).map(([val, count]) => (
                    <div
                      key={val}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "999px",
                        border: "1px solid rgba(255,255,255,0.08)",
                        background: "rgba(255,255,255,0.03)",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.65)",
                        display: "flex",
                        gap: "6px",
                      }}
                    >
                      <span>{val}</span>
                      <span style={{ color: "rgba(255,255,255,0.3)" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
