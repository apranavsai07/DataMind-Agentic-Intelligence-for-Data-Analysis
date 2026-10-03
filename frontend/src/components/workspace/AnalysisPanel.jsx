/**
 * AnalysisPanel
 * Displays analysis results from the backend AnalysisResult schema.
 * Fields: status, results[{operation, data, title, columns, value, metadata}]
 */

const OP_LABELS = {
  COLUMN_STATISTICS:     "Column Statistics",
  CORRELATION:           "Correlation",
  GROUP_BY_AGGREGATE:    "Group By Aggregate",
  VALUE_COUNTS:          "Value Counts",
  FILTER_ROWS:           "Filtered Rows",
  TOP_BOTTOM:            "Top / Bottom Records",
  TIME_SERIES_AGGREGATE: "Time Series Aggregate",
};

function fmt(v) {
  if (v == null) return "—";
  if (typeof v === "number") {
    return Number.isInteger(v)
      ? v.toLocaleString()
      : v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return String(v);
}

function ScalarValue({ value }) {
  return (
    <div style={{
      padding: "16px",
      borderRadius: "14px",
      background: "rgba(82,39,255,0.08)",
      border: "1px solid rgba(82,39,255,0.25)",
      display: "inline-block",
    }}>
      <div style={{
        fontSize: "1.8rem",
        fontWeight: 700,
        letterSpacing: "-0.03em",
        color: "white",
      }}>
        {fmt(value)}
      </div>
    </div>
  );
}

function RecordsTable({ data }) {
  if (!Array.isArray(data) || !data.length) return null;

  const keys = Object.keys(data[0]);

  return (
    <div className="ws-table-wrap">
      <table className="ws-table">
        <thead>
          <tr>
            {keys.map((k) => <th key={k}>{k}</th>)}
          </tr>
        </thead>
        <tbody>
          {data.slice(0, 50).map((row, i) => (
            <tr key={i}>
              {keys.map((k) => (
                <td key={k}>{fmt(row[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length > 50 && (
        <div style={{
          padding: "8px 14px",
          fontSize: "0.72rem",
          color: "rgba(255,255,255,0.3)",
        }}>
          Showing 50 of {data.length.toLocaleString()} rows
        </div>
      )}
    </div>
  );
}

function DictTable({ data }) {
  const entries = Object.entries(data);
  if (!entries.length) return null;

  return (
    <div className="ws-table-wrap">
      <table className="ws-table">
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{k}</td>
              <td>{fmt(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderData(data) {
  if (data == null) return null;
  if (typeof data === "number" || typeof data === "string") {
    return <ScalarValue value={data} />;
  }
  if (Array.isArray(data)) {
    return <RecordsTable data={data} />;
  }
  if (typeof data === "object") {
    return <DictTable data={data} />;
  }
  return <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem" }}>{String(data)}</span>;
}

export default function AnalysisPanel({ analysis }) {
  if (!analysis || !analysis.results?.length) {
    return (
      <div className="ws-empty">
        <div className="ws-empty-icon">📊</div>
        <p className="ws-empty-text">No analysis results were returned.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {analysis.results.map((item, i) => {
        const label = OP_LABELS[item.operation] || item.operation;

        return (
          <div key={i} className="ws-panel">
            <div className="ws-panel-header">
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span className="ws-label">{label}</span>
                {item.title && (
                  <span className="ws-panel-title">{item.title}</span>
                )}
                {item.columns?.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
                    {item.columns.map((c) => (
                      <span
                        key={c}
                        style={{
                          fontFamily: "monospace",
                          fontSize: "0.72rem",
                          padding: "2px 7px",
                          borderRadius: "6px",
                          background: "rgba(82,39,255,0.1)",
                          color: "#a78bfa",
                          border: "1px solid rgba(82,39,255,0.2)",
                        }}
                      >{c}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="ws-panel-body">
              {item.value != null && <ScalarValue value={item.value} />}
              {item.data != null && renderData(item.data)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
