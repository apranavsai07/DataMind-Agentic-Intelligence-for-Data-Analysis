import { NavLink, useNavigate } from "react-router-dom";
import { signOut } from "../../lib/auth.js";

// ── Inline SVG icons (no icon library dependency) ─────────────

function IconPlus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 4.5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDatabase() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <ellipse cx="7.5" cy="4" rx="5" ry="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 4v3.5c0 1.1 2.24 2 5 2s5-.9 5-2V4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7.5v3.5c0 1.1 2.24 2 5 2s5-.9 5-2V7.5" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3 2h6l3 3v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M5 8h5M5 10.5h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M7.5 1.5v1M7.5 12.5v1M1.5 7.5h1M12.5 7.5h1M3.4 3.4l.7.7M10.9 10.9l.7.7M3.4 11.6l.7-.7M10.9 4.1l.7-.7"
        stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────

export default function WorkspaceSidebar({ onClose }) {
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  function handleNewAnalysis() {
    navigate("/workspace");
    if (onClose) onClose(); // close mobile drawer
  }

  function navLinkClass({ isActive }) {
    return "ws-sidebar-link" + (isActive ? " ws-sidebar-link--active" : "");
  }

  return (
    <aside className="ws-sidebar" aria-label="Workspace navigation">

      {/* ── New Analysis CTA ───────────────────────────────── */}
      <div className="ws-sidebar-top">
        <button
          type="button"
          className="ws-sidebar-new"
          onClick={handleNewAnalysis}
        >
          <IconPlus />
          New Analysis
        </button>
      </div>

      {/* ── Main nav ──────────────────────────────────────── */}
      <nav className="ws-sidebar-nav" aria-label="Workspace sections">
        <span className="ws-sidebar-section-label">Workspace</span>

        <NavLink to="/workspace/analyses" className={navLinkClass} end>
          <IconClock />
          Recent Analyses
        </NavLink>

        <NavLink to="/workspace/datasets" className={navLinkClass}>
          <IconDatabase />
          Datasets
        </NavLink>

        <NavLink to="/workspace/outputs" className={navLinkClass}>
          <IconFile />
          Outputs &amp; Reports
        </NavLink>
      </nav>

      {/* ── Bottom section ────────────────────────────────── */}
      <div className="ws-sidebar-bottom">
        <NavLink to="/workspace/settings" className={navLinkClass}>
          <IconSettings />
          Settings
        </NavLink>

        <button
          type="button"
          className="ws-sidebar-signout"
          onClick={handleSignOut}
        >
          Sign out
        </button>
      </div>

    </aside>
  );
}
