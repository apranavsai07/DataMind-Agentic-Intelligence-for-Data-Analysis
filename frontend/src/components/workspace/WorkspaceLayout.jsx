import { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { signOut, getSession, onAuthChange, getDisplayName } from "../../lib/auth.js";
import WorkspaceSidebar from "./WorkspaceSidebar.jsx";
import MoltenMetal from "../landing/MoltenMetal.jsx";
import "./workspace.css";


// ─────────────────────────────────────────────────────────────
// WorkspaceLayout — Module 1 shell + Module 2 display name
//
// Reads the display name directly from the Supabase session's
// user_metadata.display_name (set during profile onboarding).
// No additional API call needed — Supabase provides this in
// every getSession() response.
//
// If no display_name is set (user skipped or was created
// before Module 2), shows a neutral fallback.
// ─────────────────────────────────────────────────────────────

const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function WorkspaceLayout() {
  const navigate = useNavigate();
  const [drawerOpen,   setDrawerOpen]   = useState(false);
  const [displayName,  setDisplayName]  = useState(null);

  // ── Read display name from Supabase session ──────────────────
  useEffect(() => {
    // In dev bypass mode there is no real session
    if (DEV_MODE) return;

    getSession().then(({ data }) => {
      setDisplayName(getDisplayName(data.session));

      // If the user has no display name, send them to profile setup.
      // This catches users who signed up before Module 2 or who skipped.
      const name = getDisplayName(data.session);
      if (data.session && !name) {
        navigate("/profile-setup", { replace: true });
      }
    });

    // Keep display name in sync if the session updates (e.g. after updateUser)
    const unsub = onAuthChange((session) => {
      setDisplayName(getDisplayName(session));
    });
    return unsub;
  }, [navigate]);

  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  // Header identity: display name → neutral fallback
  const identityLabel = displayName || (DEV_MODE ? "Dev Mode" : "My Workspace");

  return (
    <div className="ws-layout">

      {/* ── Animated background — movement preserved, shine reduced ── */}
      <div className="ws-bg-canvas" aria-hidden="true">
        <MoltenMetal
          color1="#5227FF"
          color2="#FF9FFC"
          color3="#FFFFFF"
          speed={0.35}
          scale={4}
          detail={3}
          glow={0.7}
          coreSize={0.1}
          swirl={1}
          fold={-0.2}
          blackPoint={0.15}
          brightness={0.65}
          colorMode="molten"
          grain
          grainIntensity={0.02}
          mouseInteraction
          mouseStrength={0.3}
          opacity={0.5}
        />
      </div>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="ws-header" role="banner">
        {/* Left — mobile hamburger + brand */}
        <div className="ws-header-left">
          <button
            type="button"
            className="ws-header-hamburger"
            aria-label={drawerOpen ? "Close menu" : "Open menu"}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen((o) => !o)}
          >
            <span />
            <span />
            <span />
          </button>

          <Link to="/" className="ws-header-brand" aria-label="Go to home">
            <img src="/datamind-logo.png" alt="DataMind" className="w-5 h-5 rounded-[5px] object-cover shadow-[0_0_8px_rgba(147,51,234,0.4)]" />
            <span className="ws-header-brand-name">
              <span className="brand-datamind">
                <span className="brand-data">Data</span>
                <span className="brand-mind">Mind</span>
              </span>
            </span>
          </Link>
        </div>

        {/* Right — display name + sign out */}
        <div className="ws-header-right">
          <span className="ws-header-identity">
            {identityLabel}
          </span>
          <button
            type="button"
            className="workspace-navbar-signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Body: sidebar + main ────────────────────────── */}
      <div className="ws-body">

        {/* Sidebar — desktop: always visible */}
        <WorkspaceSidebar onClose={() => setDrawerOpen(false)} />

        {/* Mobile overlay */}
        {drawerOpen && (
          <div
            className="ws-drawer-overlay"
            aria-hidden="true"
            onClick={() => setDrawerOpen(false)}
          />
        )}

        {/* Mobile drawer */}
        <div className={`ws-drawer${drawerOpen ? " ws-drawer--open" : ""}`}>
          <WorkspaceSidebar onClose={() => setDrawerOpen(false)} />
        </div>

        {/* Main content — Outlet renders the active workspace page */}
        <main className="ws-main" id="main-content">
          <div className="ws-main-inner">
            <Outlet />
          </div>
        </main>

      </div>
    </div>
  );
}
