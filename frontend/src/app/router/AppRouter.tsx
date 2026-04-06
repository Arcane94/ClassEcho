import { Navigate, Route, Routes } from "react-router-dom";
import CreateAccountPage from "@/features/auth/pages/CreateAccountPage";
import ForgotPasswordPage from "@/features/auth/pages/ForgotPasswordPage";
import LoginPage from "@/features/auth/pages/LoginPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import CreateNewSessionPage from "@/features/observation-tool/pages/CreateNewSessionPage";
import CustomizeSessionPage from "@/features/observation-tool/pages/CustomizeSessionPage";
import JoinExistingSessionPage from "@/features/observation-tool/pages/JoinExistingSessionPage";
import ManageIndividualSessionPage from "@/features/observation-tool/pages/ManageIndividualSessionPage";
import ManageSessionsPage from "@/features/observation-tool/pages/ManageSessionsPage";
import ObservationPage from "@/features/observation-tool/pages/ObservationPage";
import ObservationSessionPage from "@/features/observation-tool/pages/ObservationSessionPage";
import SessionOptionsPage from "@/features/observation-tool/pages/SessionOptionsPage";
import ViewSessionsPage from "@/features/observation-tool/pages/ViewSessionsPage";
import ToolHubPage from "@/features/workspace/pages/ToolHubPage";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
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
      <Route path="/view-sessions" element={<ViewSessionsPage />} />
      <Route path="/manage-sessions" element={<ManageSessionsPage />} />
      <Route path="/manage-session" element={<ManageIndividualSessionPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
