import { Link } from "react-router-dom";
import { signOut } from "../../lib/auth.js";


export default function WorkspaceNavbar({ userEmail }) {
  async function handleSignOut() {
    await signOut();
    window.location.href = "/";
  }

  return (
    <nav className="workspace-navbar" role="navigation" aria-label="Workspace navigation">
      <Link to="/" className="workspace-navbar-brand">
        <div className="workspace-navbar-dot" aria-hidden="true" />
        <span className="workspace-navbar-name">DataMind</span>
      </Link>

      <div className="workspace-navbar-right">
        {userEmail && (
          <span className="workspace-navbar-user" title={userEmail}>
            {userEmail}
          </span>
        )}
        <button
          className="workspace-navbar-signout"
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
