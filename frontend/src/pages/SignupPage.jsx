import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp, signInWithGoogle } from "../lib/auth.js";
import AppBackground from "../components/layout/AppBackground";
import "./AuthPage.css";

// ── Google "G" icon ───────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // ── Google OAuth sign-up ──────────────────────────────────────────
  async function handleGoogleSignUp() {
    setOauthLoading(true);
    setError(null);

    const { error: oauthError } = await signInWithGoogle();

    if (oauthError) {
      setError(oauthError.message);
      setOauthLoading(false);
    }
    // On success Supabase redirects to Google → /auth/callback
  }

  // ── Email / password sign-up ──────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) return;

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    const { data, error: authError } = await signUp(email, password);

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, Supabase returns a session immediately.
    // Navigate straight to profile setup so users can set their display name.
    // If confirmation IS enabled, data.session will be null — show the email prompt.
    if (data?.session) {
      navigate("/profile-setup", { replace: true });
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="auth-page">
        <AppBackground />
        <div className="auth-content">
          <div className="auth-card auth-card--success">
            <div className="auth-success-icon" aria-hidden="true">✉️</div>
            <h1 className="auth-title">Check your email</h1>
            <p className="auth-subtitle">
              We sent a confirmation link to{" "}
              <strong style={{ color: "white" }}>{email}</strong>.
              <br />
              Click it to activate your account, then sign in.
            </p>
            <Link to="/signin" className="auth-submit auth-submit--link">
              Go to sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <AppBackground />

      <div className="auth-content">
        <div className="auth-brand">
          <img src="/datamind-logo.png" alt="DataMind" className="w-6 h-6 rounded-md object-cover shadow-[0_0_10px_rgba(147,51,234,0.45)]" />
          <span className="brand-datamind">
            <span className="brand-data">Data</span>
            <span className="brand-mind">Mind</span>
          </span>
        </div>

        <div className="auth-card">
          <div className="auth-card-header">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">
              Start analyzing your data with AI.
            </p>
          </div>

          {/* Google OAuth button */}
          <button
            type="button"
            className="auth-oauth-btn"
            onClick={handleGoogleSignUp}
            disabled={oauthLoading || loading}
            id="google-signup-btn"
          >
            {oauthLoading ? (
              <span className="auth-spinner" aria-hidden="true" />
            ) : (
              <GoogleIcon />
            )}
            {oauthLoading ? "Redirecting…" : "Continue with Google"}
          </button>

          {/* Divider */}
          <div className="auth-divider">
            <span>or create account with email</span>
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
              <label className="auth-label" htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                className="auth-input"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="signup-confirm">Confirm password</label>
              <input
                id="signup-confirm"
                type="password"
                className="auth-input"
                placeholder="Re-enter your password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading || oauthLoading || !email || !password || !confirm}
            >
              {loading ? <span className="auth-spinner" aria-hidden="true" /> : null}
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already have an account?</span>
            <Link to="/signin" className="auth-link">Sign in</Link>
          </div>

          <Link to="/" className="auth-back">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}