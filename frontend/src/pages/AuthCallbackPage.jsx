import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.js";

/**
 * Handles Supabase auth redirect callbacks:
 *
 *  1. Email confirmation (PKCE):      ?code=<code>
 *  2. OAuth (Google, etc.):           ?code=<code>  (same PKCE flow)
 *  3. Legacy OTP / implicit flow:     #access_token=<token>
 *
 * After establishing the session:
 *  - If the user has no display_name, redirect to /profile-setup.
 *  - If they already have one, redirect to /workspace.
 *
 * For Google OAuth we pre-fill display_name from the Google full_name
 * so the profile-setup page is skipped for returning users.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("Verifying your account…");
  const [error, setError] = useState(null);

  useEffect(() => {
    async function handleCallback() {
      // ── PKCE flow (email confirmation AND Google OAuth): ?code=... ──
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchError) {
          setError(exchError.message);
          return;
        }

        await redirectAfterSession();
        return;
      }

      // ── Legacy OTP / implicit flow: #access_token=... ─────────────
      const hash = window.location.hash;
      if (hash && hash.includes("access_token")) {
        // Supabase JS v2 picks up the hash automatically via
        // onAuthStateChange — just wait for the session to appear.
        const { data, error: sessError } = await supabase.auth.getSession();

        if (sessError) {
          setError(sessError.message);
          return;
        }

        if (data.session) {
          await redirectAfterSession();
          return;
        }

        // Give onAuthStateChange a moment to fire
        const unsub = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            unsub.data.subscription.unsubscribe();
            redirectAfterSession();
          }
        });
        return;
      }

      // ── Nothing recognised ────────────────────────────────────────
      setError(
        "No verification token found. The link may have expired — please sign up again or request a new confirmation email."
      );
    }

    /**
     * Decide where to send the user based on their profile.
     *
     * For Google OAuth, user_metadata.full_name is populated automatically.
     * If no display_name is set yet, copy full_name → display_name and
     * go straight to /workspace.  This avoids an unnecessary profile-setup
     * screen for users who signed in with Google.
     */
    async function redirectAfterSession() {
      setStatus("Almost there…");

      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        setError("Session could not be established. Please try again.");
        return;
      }

      const meta = session.user?.user_metadata || {};
      const displayName = meta.display_name;

      if (!displayName) {
        // User has not set their nickname / display name yet:
        // send them to profile setup so they can pick what they want to be called.
        setStatus("Just one more step…");
        navigate("/profile-setup", { replace: true });
      } else {
        setStatus("Welcome back! Redirecting…");
        navigate("/workspace", { replace: true });
      }
    }

    handleCallback();
  }, [navigate]);

  /* ── UI ──────────────────────────────────────────────────────────── */
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "#050307",
        fontFamily: "Inter, sans-serif",
        gap: "1rem",
        padding: "2rem",
        textAlign: "center",
      }}
    >
      {error ? (
        <>
          <div style={{ fontSize: "2.5rem" }}>❌</div>
          <h1 style={{ color: "#ff6b6b", fontSize: "1.2rem", margin: 0 }}>
            Verification failed
          </h1>
          <p style={{ color: "rgba(255,255,255,0.55)", maxWidth: "420px", lineHeight: 1.6 }}>
            {error}
          </p>
          <a
            href="/signup"
            style={{
              marginTop: "0.5rem",
              padding: "0.6rem 1.4rem",
              background: "linear-gradient(135deg,#7c3aed,#a855f7)",
              color: "#fff",
              borderRadius: "8px",
              textDecoration: "none",
              fontSize: "0.9rem",
            }}
          >
            Back to Sign Up
          </a>
        </>
      ) : (
        <>
          <div
            style={{
              width: 40,
              height: 40,
              border: "3px solid rgba(168,85,247,0.3)",
              borderTop: "3px solid #a855f7",
              borderRadius: "50%",
              animation: "spin 0.8s linear infinite",
            }}
          />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ color: "rgba(255,255,255,0.6)", margin: 0 }}>{status}</p>
        </>
      )}
    </main>
  );
}
