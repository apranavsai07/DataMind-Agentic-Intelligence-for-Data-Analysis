import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";

import { uploadAndAnalyze } from "../api/workspace";
import { ApiError } from "../api/client";

import UploadPanel from "../components/workspace/UploadPanel";
import ProfilePanel from "../components/workspace/ProfilePanel";
import CleaningPanel from "../components/workspace/CleaningPanel";
import AnalysisPanel from "../components/workspace/AnalysisPanel";
import VisualizationPanel from "../components/workspace/VisualizationPanel";
import ReportPanel from "../components/workspace/ReportPanel";

import "./WorkspacePage.css";

// ── Inline document metadata display ─────────────────────────────────
function DocumentMetaPanel({ document: doc }) {
  if (!doc) return null;

  const fields = [
    { label: "Pages",      value: doc.pages      },
    { label: "Words",      value: doc.words      },
    { label: "Characters", value: doc.characters },
  ].filter((f) => f.value != null);

  return (
    <div className="ws-panel" style={{ padding: "24px" }}>
      <div className="ws-label" style={{ marginBottom: "16px" }}>Document Info</div>
      {fields.length > 0 ? (
        <div style={{ display: "grid", gap: "10px" }}>
          {fields.map((f) => (
            <div
              key={f.label}
              style={{ display: "flex", justifyContent: "space-between",
                       padding: "10px 14px", borderRadius: "10px",
                       background: "rgba(255,255,255,0.04)",
                       border: "1px solid rgba(255,255,255,0.07)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.82rem" }}>{f.label}</span>
              <span style={{ color: "white", fontWeight: 600 }}>{f.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
          Document metadata not available.
        </p>
      )}
    </div>
  );
}

function getErrorMessage(error) {
  if (error?.name === "AbortError") {
    return "This request was interrupted. You can try again.";
  }

  if (error instanceof ApiError) {
    return "We couldn't complete this request. Please try again.";
  }

  if (
    error instanceof TypeError ||
    error?.message?.toLowerCase().includes("fetch")
  ) {
    return "We're temporarily unable to process your request. Please try again shortly.";
  }

  return (
    error?.message ||
    "Something went wrong while processing your request."
  );
}

function buildTabs(results) {
  if (!results || typeof results !== "object") return [];

  const tabs = [];

  if (results.profile) {
    tabs.push({ id: "profile", label: "Data Profile" });
  }

  if (results.cleaning) {
    tabs.push({ id: "cleaning", label: "Data Cleaning" });
  }

  if (results.analysis) {
    tabs.push({ id: "analysis", label: "Analysis" });
  }

  if (results.visualizations) {
    tabs.push({ id: "visualizations", label: "Visualizations" });
  }

  // "Report" tab covers: AI report, document summary, and doc analysis
  if (results.report || results.summary || results.document_analysis) {
    tabs.push({ id: "report", label: "Report" });
  }

  // Document metadata tab (file info, word count, etc.)
  if (results.document) {
    tabs.push({ id: "document", label: "Document" });
  }

  return tabs;
}

function ResultTabs({ entry, onTabChange }) {
  const results = entry.response?.results;
  const tabs = buildTabs(results);

  if (!results || tabs.length === 0) {
    return (
      <div className="workspace-no-results">
        <h3>No displayable results</h3>
        <p>
          This response did not contain any result sections
          supported by the workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="workspace-message-results">
      <div
        className="workspace-result-tabs"
        role="tablist"
        aria-label="Results for this request"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={entry.activeTab === tab.id}
            className={entry.activeTab === tab.id ? "active" : ""}
            onClick={() => onTabChange(entry.id, tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="workspace-result-content">
        {entry.activeTab === "profile" && (
          <ProfilePanel profile={results.profile} />
        )}

        {entry.activeTab === "cleaning" && (
          <CleaningPanel cleaning={results.cleaning} analysisId={entry.analysisId} />
        )}

        {entry.activeTab === "analysis" && (
          <AnalysisPanel analysis={results.analysis} />
        )}

        {entry.activeTab === "visualizations" && (
          <VisualizationPanel
            visualizations={results.visualizations}
          />
        )}

        {entry.activeTab === "report" && (
          <ReportPanel
            report={results.report}
            summary={results.summary}
            documentAnalysis={results.document_analysis}
          />
        )}

        {entry.activeTab === "document" && results.document && (
          <DocumentMetaPanel document={results.document} />
        )}
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const [conversation, setConversation] = useState([]);
  
  const [uploadKey, setUploadKey] = useState(0);
  const [loading, setLoading] = useState(false);

  const abortRef = useRef(null);
  const requestIdRef = useRef(0);
  const mountedRef = useRef(false);
  const submissionLockRef = useRef(false);
  const stoppedByUserRef = useRef(false);

  // Each message has its own DOM element for result scrolling.
  const messageRefs = useRef({});
  const [scrollTargetId, setScrollTargetId] = useState(null);

  const conversationStarted = conversation.length > 0;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
      abortRef.current?.abort();
      submissionLockRef.current = false;
    };
  }, []);

  // Scroll to the beginning of the latest completed question/result.
  useEffect(() => {
    if (!scrollTargetId) return;

    const frame = requestAnimationFrame(() => {
      messageRefs.current[scrollTargetId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [scrollTargetId, conversation]);

  const handleSubmit = useCallback(async (file, request) => {
    if (submissionLockRef.current) return;

    if (!(file instanceof File)) return;
    if (typeof request !== "string" || !request.trim()) return;

    const cleanRequest = request.trim();
    const requestId = ++requestIdRef.current;
    const messageId = `${Date.now()}-${requestId}`;
    const controller = new AbortController();
    

    submissionLockRef.current = true;
    abortRef.current = controller;
    setLoading(true);

    // Append a new request immediately. This makes conversationStarted true
    // on the first submission, hiding the greeting and locking the dataset
    // before the backend request finishes. Never overwrite earlier messages.
    setConversation((previous) => [
      ...previous,
      {
        id: messageId,
        request: cleanRequest,
        status: "processing",
        response: null,
        error: "",
        activeTab: "",
        fileName: file.name,
      },
    ]);

    try {
      const data = await uploadAndAnalyze(
        file,
        cleanRequest,
        controller.signal
      );

      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      if (!data || typeof data !== "object") {
        throw new Error("The server returned an invalid response.");
      }

      const tabs = buildTabs(data.results);

      let initialTab = tabs[0]?.id || "";
      let shouldScroll = true;

      try {
        const storedPref = localStorage.getItem("workspace_preferences");
        if (storedPref) {
          const pref = JSON.parse(storedPref);
          if (pref.defaultTab && pref.defaultTab !== "first_available") {
            const hasPrefTab = tabs.some((t) => t.id === pref.defaultTab);
            if (hasPrefTab) {
              initialTab = pref.defaultTab;
            }
          }
          if (pref.autoScrollResults === false) {
            shouldScroll = false;
          }
        }
      } catch {}

      setConversation((previous) =>
        previous.map((entry) =>
          entry.id === messageId
            ? {
                ...entry,
                status: "completed",
                response: data,
                analysisId: data.analysis_id || null,
                activeTab: initialTab,
                error: "",
              }
            : entry
        )
      );

      // Trigger scrolling after React renders this result if auto-scroll is enabled.
      if (shouldScroll) {
        setScrollTargetId(messageId);
      }
      return true;
    } catch (error) {
      if (
        !mountedRef.current ||
        requestId !== requestIdRef.current
      ) {
        return;
      }

      const isAborted = error?.name === "AbortError" || error?.message?.toLowerCase().includes("abort");
      setConversation((previous) =>
        previous.map((entry) =>
          entry.id === messageId
            ? {
                ...entry,
                status: "error",
                error: isAborted ? "Analysis paused by user." : getErrorMessage(error),
              }
            : entry
        )
      );
      return false;
    } finally {
      if (requestId === requestIdRef.current) {
        submissionLockRef.current = false;
        abortRef.current = null;
        setLoading(false);
      }
    }
  }, []);

  const handlePause = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    submissionLockRef.current = false;
    setLoading(false);
    setConversation((previous) =>
      previous.map((entry) =>
        entry.status === "processing"
          ? {
              ...entry,
              status: "error",
              error: "Analysis paused by user.",
            }
          : entry
      )
    );
  }, []);

  const handleTabChange = useCallback((messageId, tabId) => {
    setConversation((previous) =>
      previous.map((entry) =>
        entry.id === messageId
          ? { ...entry, activeTab: tabId }
          : entry
      )
    );
  }, []);

  const handleNewAnalysis = useCallback(() => {
    // Don't reset the workspace while a request is running.
    if (submissionLockRef.current) return;

    setConversation([]);
    setScrollTargetId(null);
    messageRefs.current = {};
    setLoading(false);

    // Remount UploadPanel to clear its file, prompt and shortcuts.
    setUploadKey((key) => key + 1);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  return (
    <main className="workspace-page">
      {/* The same prompt and shortcuts stay in this workspace. */}
      <div className="workspace-input-section">
        <UploadPanel
          key={uploadKey}
          onSubmit={handleSubmit}
          onPause={handlePause}
          loading={loading}
          conversationStarted={conversationStarted}
        />
      </div>

      {conversation.length > 0 && (
        <section className="workspace-conversation">
          <div className="workspace-conversation-actions">
            <button
              type="button"
              className="workspace-button workspace-button-secondary"
              onClick={handleNewAnalysis}
              disabled={loading}
            >
              + New Analysis
            </button>
          </div>

          <div className="workspace-conversation-messages">
            {conversation.map((entry, index) => (
              <article
                className="workspace-conversation-entry"
                key={entry.id}
                ref={(node) => {
                  if (node) {
                    messageRefs.current[entry.id] = node;
                  } else {
                    delete messageRefs.current[entry.id];
                  }
                }}
              >
                {/* Show the question above its completed results. */}
                {entry.status === "completed" && (
                  <div className="workspace-user-message">
                    <span className="workspace-message-label">
                      YOUR REQUEST · {index + 1}
                    </span>
                    <p>{entry.request}</p>
                  </div>
                )}
{entry.status === "error" && (
                  <div className="workspace-error" role="alert">
                    <div className="workspace-error-icon">!</div>
                    <div className="workspace-error-content">
                      <span className="workspace-error-eyebrow">
                        REQUEST INTERRUPTED
                      </span>
                      <h3>We couldn't complete this request</h3>
                      <p>{entry.error}</p>
                      <p>
                        Your earlier conversation and results
                        have been preserved.
                      </p>
                    </div>
                  </div>
                )}

                {entry.status === "completed" && (
                  <div className="workspace-message-completed">
                    {entry.response?.message && (
                      <div className="workspace-message-result-heading">
                        <p>{entry.response.message}</p>
                      </div>
                    )}

                    <ResultTabs
                      entry={entry}
                      onTabChange={handleTabChange}
                    />
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}