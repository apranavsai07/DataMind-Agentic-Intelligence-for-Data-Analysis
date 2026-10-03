import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { updateDisplayName, getSession } from "../lib/auth.js";
import AppBackground from "../components/layout/AppBackground";
import "./AuthPage.css";

/**
 * ProfileSetupPage — Module 2
 *
 * Shown once after a new account is created.
 * Asks "What should we call you?" and stores the answer
 * in Supabase user_metadata.display_name.
 *
 * Reuses all existing AuthPage.css styles — no new CSS needed.
 */
export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [name, setName]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  useEffect(() => {
    getSession().then(({ data }) => {
      const meta = data?.session?.user?.user_metadata || {};
      const suggested = meta.display_name || meta.full_name || meta.name || "";
      if (suggested) {
        setName(suggested);
      }
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    setError(null);

    const { error: updateError } = await updateDisplayName(trimmed);

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    navigate("/workspace", { replace: true });
  }

  async function handleSkip() {
    try {
      const { data } = await getSession();
      const fallback =
        data?.session?.user?.user_metadata?.full_name ||
        data?.session?.user?.email?.split("@")[0] ||
        "Analyst";
      await updateDisplayName(fallback);
    } catch {}
    navigate("/workspace", { replace: true });
  }

  return (
    <main className="auth-page">
      <AppBackground />

      <div className="auth-content">
        {/* Brand */}
        <div className="auth-brand">
          <img src="/datamind-logo.png" alt="DataMind" className="w-6 h-6 rounded-md object-cover shadow-[0_0_10px_rgba(147,51,234,0.45)]" />
          <span className="brand-datamind">
            <span className="brand-data">Data</span>
            <span className="brand-mind">Mind</span>
          </span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">What should we call you?</h1>
            <p className="auth-subtitle">
              This is the name we&apos;ll use in your workspace. You can change it later in Settings.
            </p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="8" cy="8" r="7" stroke="#ff6b6b" strokeWidth="1.5" />
                <path d="M8 4.5v4M8 10.5v1" stroke="#ff6b6b" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="display-name">
                Your name
              </label>
              <input
                id="display-name"
                type="text"
                className="auth-input"
                placeholder="e.g. Alex, Dr. Sharma, Pranav…"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="given-name"
                autoFocus
                maxLength={60}
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || !name.trim()}
            >
              {loading ? (
                <span className="auth-spinner" aria-hidden="true" />
              ) : null}
              {loading ? "Saving…" : "Continue"}
            </button>
          </form>

          {/* Skip — user can always set name later in Settings */}
          <button
            type="button"
            onClick={handleSkip}
            className="auth-back"
            style={{ background: "none", border: "none", cursor: "pointer", width: "100%" }}
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
