import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getSession, onAuthChange } from "../../lib/auth.js";

// ─── Dev bypass ───────────────────────────────────────────────
// Set VITE_DEV_MODE=true in frontend/.env to skip auth entirely.
// Remove or set to false before deploying.
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

/**
 * Wraps a route so only authenticated users can access it.
 * Redirects to /signin if no active session.
 */
export default function ProtectedRoute({ children }) {
  // In dev mode skip all auth checks
  if (DEV_MODE) return children;

  const [session, setSession] = useState(undefined); // undefined = loading

  useEffect(() => {
    // Check initial session
    getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Listen for auth changes (login/logout)
    const unsubscribe = onAuthChange((s) => setSession(s));
    return unsubscribe;
  }, []);

  // Still checking
  if (session === undefined) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#050307",
          color: "rgba(255,255,255,0.4)",
          fontFamily: "Inter, sans-serif",
          fontSize: "0.9rem",
        }}
      >
        Checking session…
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
