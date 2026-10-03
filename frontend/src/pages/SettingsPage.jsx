import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";
import {
  signOut,
  updateDisplayName,
  updatePassword,
  updateUserPreferences,
  getUserPreferences,
} from "../lib/auth.js";
import { request } from "../api/client.js";
import "./SettingsPage.css";
import "../components/workspace/workspace.css";

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

// ── Inline SVG Icons ────────────────────────────────────────────────────────
function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SlidersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

function DatabaseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "14px",
        height: "14px",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        borderTopColor: "#ffffff",
        borderRadius: "50%",
        animation: "spin 0.6s linear infinite",
      }}
      aria-hidden="true"
    />
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();

  // ── User & Auth State ──────────────────────────────────────────────────────
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // ── Profile Form State ─────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState("");
  const [originalName, setOriginalName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // ── Password Form State ────────────────────────────────────────────────────
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  // ── Workspace Preferences State ───────────────────────────────────────────
  const [defaultTab, setDefaultTab] = useState("first_available");
  const [analysisTone, setAnalysisTone] = useState("comprehensive");
  const [autoScrollResults, setAutoScrollResults] = useState(true);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [prefSuccess, setPrefSuccess] = useState("");
  const [prefError, setPrefError] = useState("");

  // ── Data Summary Stats ────────────────────────────────────────────────────
  const [stats, setStats] = useState({
    datasets: null,
    analyses: null,
    outputs: null,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // ── Fetch User & Preferences ───────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;

    async function loadAccountData() {
      setLoadingUser(true);

      if (DEV_MODE) {
        if (!isMounted) return;
        setUser({
          email: "dev@workspace.local",
          email_confirmed_at: new Date().toISOString(),
          app_metadata: { provider: "email" },
          user_metadata: { display_name: "Dev User" },
          created_at: new Date().toISOString(),
        });
        setDisplayName("Dev User");
        setOriginalName("Dev User");

        try {
          const cached = localStorage.getItem("workspace_preferences");
          if (cached) {
            const p = JSON.parse(cached);
            if (p.defaultTab) setDefaultTab(p.defaultTab);
            if (p.analysisTone) setAnalysisTone(p.analysisTone);
            if (p.autoScrollResults !== undefined) setAutoScrollResults(p.autoScrollResults);
          }
        } catch {}

        setLoadingUser(false);
        return;
      }

      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!isMounted) return;

        if (currentUser) {
          setUser(currentUser);
          const currentName = currentUser.user_metadata?.display_name || "";
          setDisplayName(currentName);
          setOriginalName(currentName);

          // Preferences: prioritize Supabase metadata, fallback to localStorage
          const metaPrefs = getUserPreferences(currentUser);
          let activePrefs = metaPrefs;

          if (!metaPrefs || Object.keys(metaPrefs).length === 0) {
            try {
              const cached = localStorage.getItem("workspace_preferences");
              if (cached) activePrefs = JSON.parse(cached);
            } catch {}
          }

          if (activePrefs?.defaultTab) setDefaultTab(activePrefs.defaultTab);
          if (activePrefs?.analysisTone) setAnalysisTone(activePrefs.analysisTone);
          if (activePrefs?.autoScrollResults !== undefined) {
            setAutoScrollResults(activePrefs.autoScrollResults);
          }
        }
      } catch (err) {
        console.error("Failed to load user info:", err);
      } finally {
        if (isMounted) setLoadingUser(false);
      }
    }

    loadAccountData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── Fetch Data Summary Counts ──────────────────────────────────────────────
  const loadDataStats = useCallback(async () => {
    setLoadingStats(true);
    let datasetsCount = 0;
    let analysesCount = 0;
    let outputsCount = 0;

    try {
      const dsRes = await request("/datasets/?limit=100");
      datasetsCount = Array.isArray(dsRes?.datasets) ? dsRes.datasets.length : 0;
    } catch {}

    try {
      const historyRes = await request("/history/analyses?limit=100");
      const analyses = Array.isArray(historyRes?.analyses) ? historyRes.analyses : [];
      analysesCount = analyses.length;

      // Calculate total outputs/artifacts across recent analyses
      for (const a of analyses) {
        if (Array.isArray(a.artifacts)) {
          outputsCount += a.artifacts.length;
        } else if (a.results?.cleaning?.cleaned_output_id) {
          outputsCount += 1;
        }
      }
    } catch {}

    setStats({
      datasets: datasetsCount,
      analyses: analysesCount,
      outputs: outputsCount,
    });
    setLoadingStats(false);
  }, []);

  useEffect(() => {
    loadDataStats();
  }, [loadDataStats]);

  // ── Profile Form Handler ───────────────────────────────────────────────────
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    const trimmed = displayName.trim();
    if (!trimmed) {
      setProfileError("Display name cannot be empty.");
      return;
    }

    setSavingProfile(true);
    try {
      if (DEV_MODE) {
        setOriginalName(trimmed);
        setProfileSuccess("Display name updated (dev mode).");
        return;
      }

      const { error } = await updateDisplayName(trimmed);
      if (error) throw error;

      setOriginalName(trimmed);
      setProfileSuccess("Display name updated successfully.");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to update display name.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Password Form Handler ──────────────────────────────────────────────────
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordSuccess("");
    setPasswordError("");

    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setUpdatingPassword(true);
    try {
      if (DEV_MODE) {
        setPasswordSuccess("Password updated (mock mode).");
        setNewPassword("");
        setConfirmPassword("");
        return;
      }

      const { error } = await updatePassword(newPassword);
      if (error) throw error;

      setPasswordSuccess("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 4000);
    } catch (err) {
      setPasswordError(err.message || "Failed to update password.");
    } finally {
      setUpdatingPassword(false);
    }
  };

  // ── Sign Out Handler ───────────────────────────────────────────────────────
  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      window.location.href = "/";
    } catch (err) {
      console.error("Sign out failed:", err);
      window.location.href = "/";
    }
  };

  // ── Preferences Handler ────────────────────────────────────────────────────
  const handleSavePreferences = async (e) => {
    e.preventDefault();
    setPrefSuccess("");
    setPrefError("");
    setSavingPrefs(true);

    const updatedPrefs = {
      defaultTab,
      analysisTone,
      autoScrollResults,
    };

    try {
      // 1. Persist to localStorage immediately
      localStorage.setItem("workspace_preferences", JSON.stringify(updatedPrefs));

      // 2. Broadcast event for any active tabs/listeners
      window.dispatchEvent(
        new CustomEvent("workspacePreferencesUpdated", { detail: updatedPrefs })
      );

      // 3. Persist to Supabase user_metadata if authenticated
      if (!DEV_MODE) {
        const { error } = await updateUserPreferences(updatedPrefs);
        if (error) throw error;
      }

      setPrefSuccess("Workspace preferences saved and synchronized.");
      setTimeout(() => setPrefSuccess(""), 4000);
    } catch (err) {
      setPrefError(err.message || "Failed to save preferences to your account.");
    } finally {
      setSavingPrefs(false);
    }
  };

  // Determine provider info
  const provider =
    user?.app_metadata?.provider ||
    (user?.identities && user.identities[0]?.provider) ||
    "email";

  const isGoogleUser = provider === "google";
  const isEmailVerified = !!user?.email_confirmed_at;

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Active User";

  return (
    <div className="settings-page">
      {/* ── Page Header ────────────────────────────────────────── */}
      <header className="settings-header">
        <span className="ws-label">Workspace Settings</span>
        <h1 className="settings-title">Account & Preferences</h1>
        <p className="settings-subtitle">
          Manage your personal profile, credentials, workspace automation, and data storage.
        </p>
      </header>

      {/* ── SECTION 1: PROFILE ─────────────────────────────────── */}
      <section className="settings-card" aria-labelledby="profile-heading">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon" aria-hidden="true">
              <UserIcon />
            </div>
            <div>
              <h2 id="profile-heading" className="settings-card-title">Profile & Identity</h2>
              <p className="settings-card-desc">
                Your public identification across the analytics workspace
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="settings-card-body">
          {/* Display Name */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <label htmlFor="settings-display-name" className="settings-label-title">
                Display Name
              </label>
              <span className="settings-label-hint">
                Shown in the workspace header, session logs, and generated reports.
              </span>
            </div>
            <div className="settings-field-control">
              <input
                id="settings-display-name"
                type="text"
                className="settings-input"
                placeholder="Enter your name or nickname"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={60}
                disabled={loadingUser || savingProfile}
              />
            </div>
          </div>

          {/* Email Address (Read-only with verification status) */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <span className="settings-label-title">Email Address</span>
              <span className="settings-label-hint">
                Your authenticated account email managed via Supabase.
              </span>
            </div>
            <div className="settings-field-control">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span className="settings-readonly-value">
                  {user?.email || "No email available"}
                </span>
                {isEmailVerified ? (
                  <span className="settings-badge settings-badge--success">
                    <CheckIcon /> Verified
                  </span>
                ) : (
                  <span className="settings-badge settings-badge--warning">
                    <AlertTriangleIcon /> Unverified
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Feedback messages */}
          {profileSuccess && (
            <div className="settings-alert settings-alert--success" role="status">
              <CheckIcon /> {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="settings-alert settings-alert--error" role="alert">
              <AlertTriangleIcon /> {profileError}
            </div>
          )}

          <div className="settings-card-footer" style={{ margin: "-4px -26px -24px", padding: "16px 26px" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.4)" }}>
              Changes sync across all active workspace sessions.
            </span>
            <button
              type="submit"
              className="settings-btn settings-btn--primary"
              disabled={loadingUser || savingProfile || displayName.trim() === originalName}
            >
              {savingProfile ? <><Spinner /> Saving...</> : "Save Profile"}
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 2: ACCOUNT & SECURITY ──────────────────────── */}
      <section className="settings-card" aria-labelledby="account-heading">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon" aria-hidden="true">
              <ShieldIcon />
            </div>
            <div>
              <h2 id="account-heading" className="settings-card-title">Account & Security</h2>
              <p className="settings-card-desc">
                Authentication credentials, provider details, and session access
              </p>
            </div>
          </div>
          <span className="settings-badge settings-badge--provider">
            Member since {memberSince}
          </span>
        </div>

        <div className="settings-card-body">
          {/* Provider Info */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <span className="settings-label-title">Auth Provider</span>
              <span className="settings-label-hint">
                Method used to verify and access your account.
              </span>
            </div>
            <div className="settings-field-control">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className="settings-readonly-value" style={{ textTransform: "capitalize" }}>
                  {isGoogleUser ? "Google OAuth 2.0" : "Email & Password"}
                </span>
                <span className="settings-badge settings-badge--provider">
                  {provider}
                </span>
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <span className="settings-label-title">Password Security</span>
              <span className="settings-label-hint">
                {isGoogleUser
                  ? "Password management is delegated to Google."
                  : "Update your password with at least 6 characters."}
              </span>
            </div>

            <div className="settings-field-control">
              {isGoogleUser ? (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: "10px",
                    background: "rgba(255, 255, 255, 0.03)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    fontSize: "0.84rem",
                    color: "rgba(255, 255, 255, 0.65)",
                    lineHeight: "1.5",
                  }}
                >
                  🔒 <strong>Single Sign-On Active:</strong> Your workspace authentication is handled via Google OAuth. To update your password, visit your Google Account Security settings.
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="New password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={updatingPassword}
                  />
                  <input
                    type="password"
                    className="settings-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={updatingPassword}
                  />

                  {passwordSuccess && (
                    <div className="settings-alert settings-alert--success" role="status">
                      <CheckIcon /> {passwordSuccess}
                    </div>
                  )}
                  {passwordError && (
                    <div className="settings-alert settings-alert--error" role="alert">
                      <AlertTriangleIcon /> {passwordError}
                    </div>
                  )}

                  <div>
                    <button
                      type="submit"
                      className="settings-btn settings-btn--secondary"
                      disabled={updatingPassword || !newPassword || !confirmPassword}
                    >
                      {updatingPassword ? <><Spinner /> Updating...</> : "Update Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Sign Out Action */}
          <div className="settings-field-row" style={{ paddingTop: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="settings-field-label">
              <span className="settings-label-title" style={{ color: "#fca5a5" }}>
                Session Sign Out
              </span>
              <span className="settings-label-hint">
                Terminates your active session and returns to the home page.
              </span>
            </div>
            <div className="settings-field-control">
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? <><Spinner /> Signing out...</> : "Sign Out"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: WORKSPACE PREFERENCES ──────────────────── */}
      <section className="settings-card" aria-labelledby="preferences-heading">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon" aria-hidden="true">
              <SlidersIcon />
            </div>
            <div>
              <h2 id="preferences-heading" className="settings-card-title">Workspace Preferences</h2>
              <p className="settings-card-desc">
                Default behavior for automated analysis workflows and results viewing
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSavePreferences} className="settings-card-body">
          {/* Default Result Tab */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <label htmlFor="settings-default-tab" className="settings-label-title">
                Default Results View
              </label>
              <span className="settings-label-hint">
                Preferred tab automatically selected when an analysis run finishes.
              </span>
            </div>
            <div className="settings-field-control">
              <select
                id="settings-default-tab"
                className="settings-select"
                value={defaultTab}
                onChange={(e) => setDefaultTab(e.target.value)}
              >
                <option value="first_available">First Available Section (Default)</option>
                <option value="profile">Data Profile</option>
                <option value="cleaning">Data Cleaning</option>
                <option value="analysis">Statistical Analysis</option>
                <option value="visualizations">Visualizations</option>
                <option value="report">Executive Report</option>
              </select>
            </div>
          </div>

          {/* Analysis Tone */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <label htmlFor="settings-tone" className="settings-label-title">
                Analysis Narrative Tone
              </label>
              <span className="settings-label-hint">
                Guides the depth and style of generated natural language insights.
              </span>
            </div>
            <div className="settings-field-control">
              <select
                id="settings-tone"
                className="settings-select"
                value={analysisTone}
                onChange={(e) => setAnalysisTone(e.target.value)}
              >
                <option value="comprehensive">Comprehensive & In-Depth</option>
                <option value="executive">Executive & Action-Oriented</option>
                <option value="concise">Concise & Key Metrics Only</option>
              </select>
            </div>
          </div>

          {/* Auto-scroll toggle */}
          <div className="settings-field-row">
            <div className="settings-field-label">
              <span className="settings-label-title">Auto-Scroll to Results</span>
              <span className="settings-label-hint">
                Automatically smooth-scroll down to freshly computed results upon completion.
              </span>
            </div>
            <div className="settings-field-control">
              <label className="settings-switch-label">
                <span className="settings-switch">
                  <input
                    type="checkbox"
                    checked={autoScrollResults}
                    onChange={(e) => setAutoScrollResults(e.target.checked)}
                  />
                  <span className="settings-slider" />
                </span>
                <span style={{ fontSize: "0.86rem", color: autoScrollResults ? "#c4b5fd" : "rgba(255,255,255,0.4)" }}>
                  {autoScrollResults ? "Enabled" : "Disabled"}
                </span>
              </label>
            </div>
          </div>

          {prefSuccess && (
            <div className="settings-alert settings-alert--success" role="status">
              <CheckIcon /> {prefSuccess}
            </div>
          )}
          {prefError && (
            <div className="settings-alert settings-alert--error" role="alert">
              <AlertTriangleIcon /> {prefError}
            </div>
          )}

          <div className="settings-card-footer" style={{ margin: "-4px -26px -24px", padding: "16px 26px" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255, 255, 255, 0.4)" }}>
              Saved to your cloud profile and synced across devices.
            </span>
            <button
              type="submit"
              className="settings-btn settings-btn--primary"
              disabled={savingPrefs}
            >
              {savingPrefs ? <><Spinner /> Saving...</> : "Save Preferences"}
            </button>
          </div>
        </form>
      </section>

      {/* ── SECTION 4: DATA & NAVIGATION ───────────────────────── */}
      <section className="settings-card" aria-labelledby="data-heading">
        <div className="settings-card-header">
          <div className="settings-card-header-left">
            <div className="settings-card-icon" aria-hidden="true">
              <DatabaseIcon />
            </div>
            <div>
              <h2 id="data-heading" className="settings-card-title">Data & Output Records</h2>
              <p className="settings-card-desc">
                Direct access to stored datasets, execution histories, and generated downloads
              </p>
            </div>
          </div>
        </div>

        <div className="settings-card-body">
          <div className="settings-data-grid">
            {/* Datasets */}
            <Link to="/workspace/datasets" className="settings-data-card">
              <div>
                <div className="settings-data-card-top">
                  <span className="settings-data-card-icon" aria-hidden="true">🗄️</span>
                  <span className="settings-data-count">
                    {loadingStats ? "..." : `${stats.datasets ?? 0} files`}
                  </span>
                </div>
                <h3 className="settings-data-card-title">Datasets</h3>
                <p className="settings-data-card-desc">
                  Browse uploaded CSV and Excel datasets, inspect schemas, or download original source files.
                </p>
              </div>
              <div className="settings-data-card-arrow">
                Manage Datasets <ArrowRightIcon />
              </div>
            </Link>

            {/* Recent Analyses */}
            <Link to="/workspace/analyses" className="settings-data-card">
              <div>
                <div className="settings-data-card-top">
                  <span className="settings-data-card-icon" aria-hidden="true">⏱️</span>
                  <span className="settings-data-count">
                    {loadingStats ? "..." : `${stats.analyses ?? 0} runs`}
                  </span>
                </div>
                <h3 className="settings-data-card-title">Recent Analyses</h3>
                <p className="settings-data-card-desc">
                  View past analysis sessions, query prompts, execution statuses, and discussion history.
                </p>
              </div>
              <div className="settings-data-card-arrow">
                View History <ArrowRightIcon />
              </div>
            </Link>

            {/* Outputs & Reports */}
            <Link to="/workspace/outputs" className="settings-data-card">
              <div>
                <div className="settings-data-card-top">
                  <span className="settings-data-card-icon" aria-hidden="true">📑</span>
                  <span className="settings-data-count">
                    {loadingStats ? "..." : `${stats.outputs ?? 0} artifacts`}
                  </span>
                </div>
                <h3 className="settings-data-card-title">Outputs & Reports</h3>
                <p className="settings-data-card-desc">
                  Download cleaned dataset CSVs, interactive visualizations, and structured PDF executive reports.
                </p>
              </div>
              <div className="settings-data-card-arrow">
                Access Outputs <ArrowRightIcon />
              </div>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
