// Central router for the application. This keeps page-level navigation in one place.
import { Navigate, Route, Routes } from "react-router-dom";
import CreateAccountPage from "@/features/auth/pages/CreateAccountPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import PrivacyPolicyPage from "@/features/auth/pages/PrivacyPolicyPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import TermsOfUsePage from "@/features/auth/pages/TermsOfUsePage";
import CreateNewSessionPage from "@/features/observation-mode/pages/CreateNewSessionPage";
import CustomizeSessionPage from "@/features/observation-mode/pages/CustomizeSessionPage";
import JoinExistingSessionPage from "@/features/observation-mode/pages/JoinExistingSessionPage";
import ManageIndividualSessionPage from "@/features/observation-mode/pages/ManageIndividualSessionPage";
import ManageSessionsPage from "@/features/observation-mode/pages/ManageSessionsPage";
import ObservationPage from "@/features/observation-mode/pages/ObservationPage";
import ObservationSessionPage from "@/features/observation-mode/pages/ObservationSessionPage";
import SessionOptionsPage from "@/features/observation-mode/pages/SessionOptionsPage";
import ViewSessionsPage from "@/features/observation-mode/pages/ViewSessionsPage";
import VisualizationModePage from "@/features/visualization-mode/pages/VisualizationModePage";
import VisualizationSessionSelectionPage from "@/features/visualization-mode/pages/VisualizationSessionSelectionPage";
import VisualizationSessionSetupPage from "@/features/visualization-mode/pages/VisualizationSessionSetupPage";
import ToolHubPage from "@/features/workspace/pages/ToolHubPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-use" element={<TermsOfUsePage />} />
      <Route path="/apps" element={<ToolHubPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/signup" element={<CreateAccountPage />} />
      <Route path="/observation" element={<ObservationPage />} />
      <Route path="/observation-session" element={<ObservationSessionPage />} />
      <Route path="/session-options" element={<SessionOptionsPage />} />
      <Route path="/join-existing" element={<JoinExistingSessionPage />} />
      <Route path="/create-new" element={<CreateNewSessionPage />} />
      <Route path="/customize-session" element={<CustomizeSessionPage />} />
      <Route path="/visualization" element={<VisualizationSessionSelectionPage />} />
      <Route path="/visualization/setup" element={<VisualizationSessionSetupPage />} />
      <Route path="/visualization/view" element={<VisualizationModePage />} />
      <Route path="/view-sessions" element={<ViewSessionsPage />} />
      <Route path="/manage-sessions" element={<ManageSessionsPage />} />
      <Route path="/manage-session" element={<ManageIndividualSessionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

