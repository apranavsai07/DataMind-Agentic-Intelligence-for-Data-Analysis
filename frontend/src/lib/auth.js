import { supabase } from "./supabase.js";

// ============================================================
// AUTH HELPERS
// ============================================================

/**
 * Sign in with email and password.
 * @returns {{ data, error }}
 */
export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign up with email and password.
 * @returns {{ data, error }}
 */
export async function signUp(email, password) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      // Supabase will append ?code=... to this URL after email confirmation
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/**
 * Sign in with Google via Supabase OAuth.
 * Works for both sign-in and sign-up — Google handles both.
 * The PKCE callback is handled by AuthCallbackPage (/auth/callback).
 *
 * @returns {{ data, error }}
 */
export async function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      // Request the user's name so we can pre-fill display_name
      scopes: "openid email profile",
    },
  });
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Get the current session.
 * @returns {{ data: { session }, error }}
 */
export async function getSession() {
  return supabase.auth.getSession();
}

/**
 * Subscribe to auth state changes.
 * @param {Function} callback
 * @returns {() => void} Unsubscribe function
 */
export function onAuthChange(callback) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });
  return () => data.subscription.unsubscribe();
}

// ============================================================
// PROFILE HELPERS
// ============================================================

/**
 * Save a display name to the authenticated user's metadata.
 * Uses Supabase's built-in user_metadata — no custom endpoint needed.
 * Persists server-side and is available in every subsequent getSession() call.
 *
 * @param {string} displayName
 * @returns {{ data, error }}
 */
export async function updateDisplayName(displayName) {
  return supabase.auth.updateUser({
    data: { display_name: displayName.trim() },
  });
}

/**
 * Extract the display name from a Supabase session object.
 * Returns null if the session is missing or display_name is not set.
 *
 * @param {object|null} session
 * @returns {string|null}
 */
export function getDisplayName(session) {
  return session?.user?.user_metadata?.display_name ?? null;
}

/**
 * Update the user's password.
 * @param {string} newPassword
 * @returns {{ data, error }}
 */
export async function updatePassword(newPassword) {
  return supabase.auth.updateUser({ password: newPassword });
}

/**
 * Update user preferences in user_metadata.
 * @param {object} preferences
 * @returns {{ data, error }}
 */
export async function updateUserPreferences(preferences) {
  return supabase.auth.updateUser({
    data: { preferences },
  });
}

/**
 * Extract preferences from a user or session object.
 * @param {object|null} sessionOrUser
 * @returns {object}
 */
export function getUserPreferences(sessionOrUser) {
  const meta = sessionOrUser?.user?.user_metadata || sessionOrUser?.user_metadata;
  return meta?.preferences || {};
}
