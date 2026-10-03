import { BackgroundGradient } from "../ui/background-gradient";
import "./FeatureCard.css";

function ProfilePreview() {
  return (
    <>
      <div className="feature-card-description">
        Get an instant overview of your dataset before you
        start analyzing it.
      </div>

      <div className="feature-card-stats">
        <Stat
          value="12,450"
          label="Rows"
        />

        <Stat
          value="18"
          label="Columns"
        />
      </div>

      <div className="feature-card-details">
        <Detail
          label="Numeric"
          value="11"
        />

        <Detail
          label="Categorical"
          value="5"
        />

        <Detail
          label="Date"
          value="2"
        />

        <Detail
          label="Missing values"
          value="2.4%"
        />
      </div>

      <Status>
        Dataset ready for analysis
      </Status>
    </>
  );
}

function CleanPreview() {
  return (
    <>
      <div className="feature-card-description">
        Identify data-quality issues and prepare your
        dataset for reliable analysis.
      </div>

      <div className="quality-summary">

        <div className="quality-score">
          <div className="quality-score-ring">
            <span>94%</span>
          </div>

          <div>
            <div className="quality-title">
              Data quality
            </div>

            <div className="quality-subtitle">
              Good condition
            </div>
          </div>
        </div>

      </div>

      <div className="feature-card-details">
        <Detail
          label="Missing values"
          value="42"
          warning
        />

        <Detail
          label="Duplicate rows"
          value="8"
          warning
        />

        <Detail
          label="Invalid values"
          value="3"
          warning
        />

        <Detail
          label="Clean records"
          value="12,397"
          success
        />
      </div>

      <Status>
        Cleaning recommendations ready
      </Status>
    </>
  );
}

function AnalyzePreview() {
  return (
    <>
      <div className="feature-card-description">
        Ask questions in plain English and let DataMind
        determine the right analytical approach.
      </div>

      <div className="analysis-question">
        <span className="analysis-icon">
          ?
        </span>

        <span>
          What factors are affecting revenue?
        </span>
      </div>

      <div className="analysis-flow">

        <div className="analysis-step">
          <span className="analysis-step-number">
            01
          </span>

          <div>
            <strong>Understand</strong>
            <small>Interpreting the question</small>
          </div>
        </div>

        <div className="analysis-line" />

        <div className="analysis-step">
          <span className="analysis-step-number">
            02
          </span>

          <div>
            <strong>Analyze</strong>
            <small>Finding relevant patterns</small>
          </div>
        </div>

        <div className="analysis-line" />

        <div className="analysis-step">
          <span className="analysis-step-number">
            03
          </span>

          <div>
            <strong>Explain</strong>
            <small>Generating the result</small>
          </div>
        </div>

      </div>

      <Status>
        Analysis completed
      </Status>
    </>
  );
}

function VisualizePreview() {
  return (
    <>
      <div className="feature-card-description">
        Turn analytical results into clear visualizations
        that make patterns easier to understand.
      </div>

      <div className="chart-preview">

        <div className="chart-header">
          <span>Revenue by month</span>
          <span className="chart-period">
            2026
          </span>
        </div>

        <div className="chart-area">

          <div
            className="chart-bar"
            style={{ height: "38%" }}
          />

          <div
            className="chart-bar"
            style={{ height: "52%" }}
          />

          <div
            className="chart-bar"
            style={{ height: "44%" }}
          />

          <div
            className="chart-bar"
            style={{ height: "68%" }}
          />

          <div
            className="chart-bar"
            style={{ height: "58%" }}
          />

          <div
            className="chart-bar chart-bar-active"
            style={{ height: "82%" }}
          />

          <div
            className="chart-bar"
            style={{ height: "73%" }}
          />

        </div>

        <div className="chart-labels">
          <span>Jan</span>
          <span>Feb</span>
          <span>Mar</span>
          <span>Apr</span>
          <span>May</span>
          <span>Jun</span>
          <span>Jul</span>
        </div>

      </div>

      <Status>
        Visualization generated
      </Status>
    </>
  );
}

function InsightsPreview() {
  return (
    <>
      <div className="feature-card-description">
        DataMind turns patterns in your data into concise,
        actionable findings.
      </div>

      <div className="insight-list">

        <Insight
          number="01"
          title="Revenue is trending upward"
          description="Revenue increased 18.4% over the last quarter."
        />

        <Insight
          number="02"
          title="One segment is outperforming"
          description="Enterprise customers show the strongest growth."
        />

        <Insight
          number="03"
          title="A potential anomaly detected"
          description="June contains an unusual spike in transactions."
        />

      </div>

      <Status>
        3 meaningful insights found
      </Status>
    </>
  );
}

function ReportPreview() {
  return (
    <>
      <div className="feature-card-description">
        Bring your analysis together into a structured report
        ready to share or export.
      </div>

      <div className="report-preview">

        <div className="report-top">
          <div className="report-document-icon">
            AI
          </div>

          <div>
            <strong>
              Dataset Analysis Report
            </strong>

            <small>
              Generated by DataMind
            </small>
          </div>
        </div>

        <div className="report-sections">

          <ReportRow
            number="01"
            label="Executive summary"
          />

          <ReportRow
            number="02"
            label="Dataset overview"
          />

          <ReportRow
            number="03"
            label="Key findings"
          />

          <ReportRow
            number="04"
            label="Visual analysis"
          />

        </div>

      </div>

      <Status>
        Report ready to export
      </Status>
    </>
  );
}

/* --------------------------------
   REUSABLE PIECES
-------------------------------- */

function Stat({ value, label }) {
  return (
    <div className="feature-stat">
      <div className="feature-stat-value">
        {value}
      </div>

      <div className="feature-stat-label">
        {label}
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
  warning = false,
  success = false,
}) {
  return (
    <div className="feature-detail-row">

      <span>
        {label}
      </span>

      <span
        className={`
          feature-detail-value
          ${warning ? "is-warning" : ""}
          ${success ? "is-success" : ""}
        `}
      >
        {value}
      </span>

    </div>
  );
}

function Status({ children }) {
  return (
    <div className="feature-card-footer">

      <span className="feature-check">
        ✓
      </span>

      <span>
        {children}
      </span>

    </div>
  );
}

function Insight({
  number,
  title,
  description,
}) {
  return (
    <div className="insight-item">

      <span className="insight-number">
        {number}
      </span>

      <div>
        <strong>
          {title}
        </strong>

        <p>
          {description}
        </p>
      </div>

    </div>
  );
}

function ReportRow({
  number,
  label,
}) {
  return (
    <div className="report-row">

      <span>
        {number}
      </span>

      <strong>
        {label}
      </strong>

      <span className="report-arrow">
        →
      </span>

    </div>
  );
}

/* --------------------------------
   CARD
-------------------------------- */

const PREVIEWS = {
  profile: ProfilePreview,
  clean: CleanPreview,
  analyze: AnalyzePreview,
  visualize: VisualizePreview,
  insights: InsightsPreview,
  report: ReportPreview,
};

const TITLES = {
  profile: "Dataset Profile",
  clean: "Clean Dataset",
  analyze: "AI Analysis",
  visualize: "Data Visualization",
  insights: "AI Insights",
  report: "Analysis Report",
};

const SUBTITLES = {
  profile: "sales_data.csv",
  clean: "sales_data.csv",
  analyze: "Natural language analysis",
  visualize: "Generated visualization",
  insights: "Discovered patterns",
  report: "Generated report",
};

export default function FeatureCard({
  feature,
}) {
  const Preview =
    PREVIEWS[feature?.id] ||
    ProfilePreview;

  const title =
    TITLES[feature?.id] ||
    TITLES.profile;

  const subtitle =
    SUBTITLES[feature?.id] ||
    SUBTITLES.profile;

  return (
    <div className="feature-card-wrapper">

      <BackgroundGradient
        containerClassName="feature-card-gradient"
        className="feature-card"
        animate={true}
      >
        <div className="feature-card-inner">

          <div className="feature-card-header">

            <div>
              <div className="feature-card-eyebrow">
                DataMind
              </div>

              <h3>
                {title}
              </h3>

              <p className="feature-card-subtitle">
                {subtitle}
              </p>
            </div>

            <span className="feature-card-status-dot" />

          </div>

          <Preview />

        </div>
      </BackgroundGradient>

    </div>
  );
}