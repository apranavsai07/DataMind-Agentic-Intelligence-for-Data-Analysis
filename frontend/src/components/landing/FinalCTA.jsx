import { useNavigate } from "react-router-dom";
import SpotlightCard from "../ui/SpotlightCard";
import "./FinalCTA.css";

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section id="get-started" className="final-cta">
      <div className="final-cta-content">

        <div className="final-cta-heading">
          <span className="final-cta-label">
            READY TO ANALYZE?
          </span>

          <h2>Your data is waiting.</h2>

          <p>
            Start a new analysis or continue where you left off.
          </p>
        </div>

        <div className="auth-choice-grid">

          {/* New user */}
          <SpotlightCard
            className="auth-choice-card"
            spotlightColor="rgba(82, 39, 255, 0.28)"
          >
            <div className="auth-choice-number">01</div>

            <h3>Start analyzing</h3>

            <p>
              Upload your dataset and begin exploring your data
              with AI-powered analysis.
            </p>

            <button
              className="auth-choice-primary"
              onClick={() => navigate("/signup")}
            >
              Create account
              <span>→</span>
            </button>
          </SpotlightCard>

          {/* Existing user */}
          <SpotlightCard
            className="auth-choice-card"
            spotlightColor="rgba(255, 159, 252, 0.22)"
          >
            <div className="auth-choice-number">02</div>

            <h3>Welcome back</h3>

            <p>
              Already have an account? Sign in to continue with
              your workspace.
            </p>

            <button
              className="auth-choice-secondary"
              onClick={() => navigate("/signin")}
            >
              Sign in
              <span>→</span>
            </button>
          </SpotlightCard>

        </div>

      </div>
    </section>
  );
}