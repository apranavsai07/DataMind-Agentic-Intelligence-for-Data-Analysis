import { BrowserRouter, Routes, Route } from "react-router-dom";

// ── Public pages ──────────────────────────────────────────────
import LandingPage          from "./pages/LandingPage";
import SignInPage           from "./pages/SignInPage";
import SignupPage           from "./pages/SignupPage";
import AuthCallbackPage     from "./pages/AuthCallbackPage";
import ProfileSetupPage     from "./pages/ProfileSetupPage";

// ── Workspace layout + pages ──────────────────────────────────
import WorkspaceLayout      from "./components/workspace/WorkspaceLayout.jsx";
import WorkspacePage        from "./pages/WorkspacePage";
import RecentAnalysesPage   from "./pages/RecentAnalysesPage";
import AnalysisDetailPage   from "./pages/AnalysisDetailPage";
import DatasetsPage         from "./pages/DatasetsPage";
import OutputsPage          from "./pages/OutputsPage";
import SettingsPage         from "./pages/SettingsPage";

// ── Auth guard ────────────────────────────────────────────────
import ProtectedRoute       from "./components/auth/ProtectedRoute";


export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public ───────────────────────────────────── */}
        <Route path="/"              element={<LandingPage />} />
        <Route path="/signup"        element={<SignupPage />} />
        <Route path="/signin"        element={<SignInPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* ── Profile setup (protected — needs a live session) ─── */}
        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />

        {/* ── Workspace (protected, nested) ────────────── */}
        {/*
          WorkspaceLayout renders once and persists across all
          /workspace/* routes via React Router's nested routing.
          The sidebar and header never remount during navigation.
        */}
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspaceLayout />
            </ProtectedRoute>
          }
        >
          {/* Default: New Analysis */}
          <Route index element={<WorkspacePage />} />

          {/* Workspace sections */}
          <Route path="analyses"        element={<RecentAnalysesPage />} />
          <Route path="analyses/:id"    element={<AnalysisDetailPage />} />
          <Route path="datasets"        element={<DatasetsPage />} />
          <Route path="outputs"         element={<OutputsPage />} />
          <Route path="settings"        element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
