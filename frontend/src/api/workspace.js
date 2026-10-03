// ============================================================
// WORKSPACE API
//
// Wraps backend endpoints:
//   POST /upload/                              — run new analysis
//   GET  /history/analyses                    — list recent
//   GET  /history/analyses/:id                — single analysis
//   GET  /history/analyses/:id/messages       — conversation
//   POST /history/analyses/:id/followup       — follow-up LLM call
// ============================================================

import { request, BASE_URL } from "./client.js";


// ── New analysis ──────────────────────────────────────────────────────

/**
 * Uploads a file and the user's analytical request to the backend.
 *
 * @param {File} file
 * @param {string} userRequest
 * @param {AbortSignal} [signal]
 * @returns {Promise<object>} WorkspaceResponse
 */
export async function uploadAndAnalyze(file, userRequest, signal) {
  if (!(file instanceof File)) {
    throw new TypeError("Please select a valid file before starting the analysis.");
  }
  if (typeof userRequest !== "string" || !userRequest.trim()) {
    throw new TypeError("Please enter an analytical request before continuing.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("user_request", userRequest);

  return request("/upload/", { method: "POST", body: form, signal });
}

// ── History list ──────────────────────────────────────────────────────

/**
 * Fetch the authenticated user's recent analyses.
 *
 * @param {number} [limit=100]
 * @returns {Promise<{analyses: object[]}>}
 */
export async function getRecentAnalyses(limit = 100) {
  return request(`/history/analyses?limit=${limit}`);
}

// ── Single analysis ───────────────────────────────────────────────────

/**
 * Fetch a single saved analysis by ID.
 * Verifies ownership server-side — returns 404 for unknown / other-user IDs.
 *
 * @param {string} analysisId
 * @returns {Promise<{analysis: object}>}
 */
export async function getAnalysis(analysisId) {
  return request(`/history/analyses/${encodeURIComponent(analysisId)}`);
}

/**
 * Fetch the outputs (reports, files) for one analysis.
 *
 * @param {string} analysisId
 * @returns {Promise<{outputs: object[]}>}
 */
export async function getAnalysisOutputs(analysisId) {
  return request(`/history/analyses/${encodeURIComponent(analysisId)}/outputs`);
}

// ── Conversation messages ─────────────────────────────────────────────

/**
 * Fetch the full persisted conversation for an analysis.
 *
 * @param {string} analysisId
 * @returns {Promise<{messages: object[]}>}
 */
export async function getMessages(analysisId) {
  return request(`/history/analyses/${encodeURIComponent(analysisId)}/messages`);
}

/**
 * Ask a follow-up question about a saved analysis.
 * The backend loads saved results + prior messages as context,
 * calls the LLM, and persists both the question and answer.
 *
 * @param {string} analysisId
 * @param {string} question
 * @param {AbortSignal} [signal]
 * @returns {Promise<{answer: string, analysis_id: string}>}
 */
export async function sendFollowUp(analysisId, question, signal) {
  if (!question.trim()) {
    throw new TypeError("Question must not be empty.");
  }
  return request(
    `/history/analyses/${encodeURIComponent(analysisId)}/followup`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: question.trim() }),
      signal,
    }
  );
}

// ── Downloads ─────────────────────────────────────────────────────────

/**
 * Internal helper — fetches a signed download URL from a backend
 * redirect endpoint by following the redirect and capturing the
 * final URL, then triggers a browser download via an <a> element.
 *
 * @param {string} path   - Backend path that redirects to signed URL
 * @param {string} filename - Suggested filename for the download
 */
async function _triggerDownload(path, filename) {
  const { supabase } = await import("../lib/supabase");
  const { data: { session } } = await supabase.auth.getSession();

  const url = `${BASE_URL}${path.startsWith("/") ? path : "/" + path}`;

  // Fetch with redirect:follow so we end up at the Supabase signed URL.
  const res = await fetch(url, {
    method: "GET",
    redirect: "follow",
    headers: session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {},
  });

  if (!res.ok) {
    throw new Error(`Download failed (${res.status})`);
  }

  // We now have the response from the final (signed) URL.
  // Read it as a blob and trigger a <a> download.
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Release the object URL after the browser has had a moment to start the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
}

/**
 * Trigger a browser download for a persisted dataset.
 *
 * @param {string} datasetId
 * @param {string} [filename] - Optional filename hint
 */
export async function downloadDataset(datasetId, filename = "dataset") {
  return _triggerDownload(
    `/datasets/${encodeURIComponent(datasetId)}/download`,
    filename
  );
}

/**
 * Trigger a browser download for an analysis output file.
 *
 * @param {string} analysisId
 * @param {string} outputId
 * @param {string} [filename] - Optional filename hint
 */
export async function downloadOutput(analysisId, outputId, filename = "output") {
  return _triggerDownload(
    `/history/analyses/${encodeURIComponent(analysisId)}/outputs/${encodeURIComponent(outputId)}/download`,
    filename
  );
}