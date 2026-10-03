
import { supabase } from "../lib/supabase";

// ============================================================
// API CLIENT — CENTRALIZED FETCH LAYER
// ============================================================

const RAW_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

// ============================================================
// STRUCTURED API ERROR
// ============================================================

export class ApiError extends Error {
  constructor(message, status = 0, detail = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

// ============================================================
// HTTP ERROR MESSAGES
// ============================================================

const HTTP_MESSAGES = {
  400: "The request was invalid. Please check your file and question.",
  401: "Authentication is required. Please sign in again.",
  403: "You do not have permission to perform this request.",
  404: "The requested backend endpoint was not found.",
  408: "The request timed out. Please try again.",
  413: "The file is too large.",
  415: "This file type is not supported by the server.",
  422: "Validation error. Please check your input.",
  429: "Too many requests. Please try again shortly.",
  500: "The server encountered an error. Please try again.",
  502: "The backend is temporarily unavailable.",
  503: "The server is unavailable. Please try again later.",
  504: "The server took too long to respond.",
};

// ============================================================
// HELPERS
// ============================================================

function extractErrorDetail(body) {
  if (body == null) return null;

  if (typeof body === "string") {
    return body.trim() || null;
  }

  const detail = body.detail ?? body.message;

  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return (
      detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (item && typeof item === "object") {
            const location = Array.isArray(item.loc)
              ? item.loc.join(" → ")
              : "";

            const message = item.msg || item.message || "";

            if (location && message) {
              return `${location}: ${message}`;
            }

            return message || JSON.stringify(item);
          }

          return String(item);
        })
        .filter(Boolean)
        .join("; ") || null
    );
  }

  if (detail && typeof detail === "object") {
    return JSON.stringify(detail);
  }

  return null;
}

async function readResponseBody(response) {
  const contentType =
    response.headers.get("content-type") || "";

  if (response.status === 204) {
    return null;
  }

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    return text || null;
  } catch {
    return null;
  }
}

// ============================================================
// STATIC OUTPUT URL
// ============================================================

/**
 * Returns a URL for a backend-served static file.
 *
 * NOTE:
 * Do not use this for private Supabase Storage files.
 * Private files should be served using an authenticated
 * backend endpoint or a short-lived signed URL.
 */
export function getStaticUrl(localPath) {
  if (!localPath || typeof localPath !== "string") {
    return null;
  }

  const normalized = localPath.replace(/\\/g, "/");

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  const outputsIndex = normalized.indexOf("outputs/");

  if (outputsIndex !== -1) {
    const outputPath = normalized.slice(outputsIndex);
    return `${BASE_URL}/${outputPath}`;
  }

  const cleanPath = normalized.replace(/^\/+/, "");
  return `${BASE_URL}/${cleanPath}`;
}

// ============================================================
// CENTRALIZED REQUEST FUNCTION
// ============================================================

/**
 * Sends an authenticated request to the backend.
 *
 * Adds the current Supabase access token automatically.
 *
 * @param {string} path
 * @param {RequestInit} options
 * @returns {Promise<any>}
 */
export async function request(path, options = {}) {
  // Get the current Supabase session.
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new ApiError(
      "Unable to retrieve your session. Please sign in again.",
      401,
      sessionError.message
    );
  }

  const headers = new Headers(options.headers || {});

  // Attach the access token for FastAPI authentication.
  if (session?.access_token) {
    headers.set(
      "Authorization",
      `Bearer ${session.access_token}`
    );
  }

  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  const url = `${BASE_URL}${normalizedPath}`;

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw error;
    }

    throw new ApiError(
      "Cannot reach the backend. Make sure the server is running.",
      0,
      error?.message || null
    );
  }

  const body = await readResponseBody(response);

  if (!response.ok) {
    const detail = extractErrorDetail(body);

    const message =
      detail ||
      HTTP_MESSAGES[response.status] ||
      `Request failed (${response.status})`;

    throw new ApiError(
      message,
      response.status,
      detail
    );
  }

  return body;
}