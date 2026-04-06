import { useEffect, useState } from "react";
import { FileSpreadsheet, Settings2, Tags, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ObservationPanelLayout from "@/features/observation-tool/components/ObservationPanelLayout";
import ObservationInfoButton from "@/features/observation-tool/components/ObservationInfoButton";
import ObservationSessionCard from "@/features/observation-tool/components/ObservationSessionCard";
import ObservationTextField from "@/features/observation-tool/components/ObservationTextField";
import { deleteSession } from "@/services/deleteSession";
import { fetchSessionById, type SessionData } from "@/services/fetchSessionById";
import { getAllUserEditSessions } from "@/services/getAllUserEditSessions";
import { updateSessionInfo } from "@/services/updateSessionInfo";
import { exportStudentObservationsToCSV } from "@/utils/exportStudentObservationsToCSV";
import { exportTeacherObservationsToCSV } from "@/utils/exportTeacherObservationsToCSV";

type StatusTone = "error" | "success";

export default function ManageSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [controlPanelSession, setControlPanelSession] = useState<SessionData | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [sessionName, setSessionName] = useState("");
  const [lessonDescription, setLessonDescription] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [studentIdNumericOnly, setStudentIdNumericOnly] = useState(false);
  const [isControlSaving, setIsControlSaving] = useState(false);
  const [controlPanelStatus, setControlPanelStatus] = useState("");
  const [controlPanelStatusTone, setControlPanelStatusTone] = useState<StatusTone>("success");
  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"teacher" | "student" | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteTargetSession, setDeleteTargetSession] = useState<SessionData | null>(null);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState("");

  const normalizedTeacherName = teacherName.trim();
  const normalizedSessionName = sessionName.trim();
  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const isJoinCodeValid = normalizedJoinCode.length >= 8;
  const canSaveControlPanel = Boolean(normalizedTeacherName && normalizedSessionName && isJoinCodeValid && !isControlSaving);

  useEffect(() => {
    const fetchSessions = async () => {
      const userId = localStorage.getItem("user_id");

      if (userId) {
        const userEditSessions = await getAllUserEditSessions(userId);
        setSessions(userEditSessions);
      }

      setLoading(false);
    };

    fetchSessions();
  }, []);

  const openControlPanel = async (session: SessionData) => {
    setControlPanelSession(session);
    setTeacherName(session.teacher_name || "");
    setSessionName(session.lesson_name || "");
    setLessonDescription(session.lesson_description || "");
    setJoinCode((session.join_code || "").toUpperCase().replace(/\s+/g, ""));
    setStudentIdNumericOnly(Boolean(session.student_id_numeric_only));
    setControlPanelStatus("");

    if (!session.join_code) {
      const freshSession = await fetchSessionById(session.session_id);

      if (freshSession) {
        setJoinCode((freshSession.join_code || "").toUpperCase().replace(/\s+/g, ""));
        setStudentIdNumericOnly(freshSession.student_id_numeric_only);
      }
    }
  };

  const closeControlPanel = () => {
    if (isControlSaving) {
      return;
    }

    setControlPanelSession(null);
    setControlPanelStatus("");
  };

  const openDeleteModal = (session: SessionData) => {
    setDeleteTargetSession(session);
    setDeleteStatusMessage("");
  };

  const closeDeleteModal = () => {
    if (deleteTargetSession && deletingSessionId === deleteTargetSession.session_id) {
      return;
    }

    setDeleteTargetSession(null);
    setDeleteStatusMessage("");
  };

  const handleSaveControlPanel = async () => {
    if (!controlPanelSession) {
      return;
    }

    if (!normalizedTeacherName || !normalizedSessionName) {
      setControlPanelStatusTone("error");
      setControlPanelStatus("Teacher name, session name, and join code are required.");
      return;
    }

    if (!isJoinCodeValid) {
      setControlPanelStatusTone("error");
      setControlPanelStatus("Join code must be at least 8 characters.");
      return;
    }

    setIsControlSaving(true);
    setControlPanelStatus("");

    const result = await updateSessionInfo(controlPanelSession.session_id, {
      teacher_name: normalizedTeacherName,
      session_name: normalizedSessionName,
      lesson_description: lessonDescription.trim(),
      join_code: normalizedJoinCode,
      student_id_numeric_only: studentIdNumericOnly,
    });

    if (!result.success) {
      setControlPanelStatusTone("error");
      setControlPanelStatus(result.error || "Failed to update session info");
      setIsControlSaving(false);
      return;
    }

    setSessions((previous) =>
      previous.map((session) =>
        session.session_id === controlPanelSession.session_id
          ? {
              ...session,
              teacher_name: normalizedTeacherName,
              lesson_name: normalizedSessionName,
              lesson_description: lessonDescription.trim(),
              join_code: normalizedJoinCode,
              student_id_numeric_only: studentIdNumericOnly,
            }
          : session,
      ),
    );

    setControlPanelStatusTone("success");
    setControlPanelStatus("Session info updated");
    setIsControlSaving(false);
    setControlPanelSession(null);
  };

  const handleDeleteSession = async () => {
    if (!deleteTargetSession) {
      return;
    }

    setDeletingSessionId(deleteTargetSession.session_id);
    setDeleteStatusMessage("");

    if (controlPanelSession?.session_id === deleteTargetSession.session_id) {
      setControlPanelStatus("");
    }

    const result = await deleteSession(deleteTargetSession.session_id);

    if (!result.success) {
      if (controlPanelSession?.session_id === deleteTargetSession.session_id) {
        setControlPanelStatusTone("error");
        setControlPanelStatus(result.error || "Failed to delete session");
      }

      setDeleteStatusMessage(result.error || "Failed to delete session");
      setDeletingSessionId(null);
      return;
    }

    setSessions((previous) => previous.filter((item) => item.session_id !== deleteTargetSession.session_id));
    setDeletingSessionId(null);

    if (controlPanelSession?.session_id === deleteTargetSession.session_id) {
      setControlPanelSession(null);
    }

    setDeleteTargetSession(null);
    setDeleteStatusMessage("");
  };

  const handleManageSessionTags = (sessionId: string) => {
    navigate(`/manage-session?sessionId=${sessionId}`);
  };

  const handleExportTeacherCSV = async (sessionId: string) => {
    setExportingSessionId(sessionId);
    setExportingType("teacher");
    await exportTeacherObservationsToCSV(sessionId);
    setExportingSessionId(null);
    setExportingType(null);
  };

  const handleExportStudentCSV = async (sessionId: string) => {
    setExportingSessionId(sessionId);
    setExportingType("student");
    await exportStudentObservationsToCSV(sessionId);
    setExportingSessionId(null);
    setExportingType(null);
  };

  return (
    <>
      <ObservationPanelLayout
        title="Manage Your Sessions"
        subtitle="Review your sessions, update details, tags, and export data."
        onBack={() => navigate("/session-options")}
        width="wide"
      >
        {loading ? (
          <div className="observation-empty-state">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="observation-empty-state">No editable sessions were found for this account yet.</div>
        ) : (
          <div className="observation-session-grid">
            {sessions.map((session) => {
              return (
                <ObservationSessionCard
                  key={session.session_id}
                  session={session}
                  contextLabel="Editable Session"
                  actions={
                    <>
                      <div className="observation-session-card-action-row">
                        <button
                          type="button"
                          className="observation-button observation-button--secondary"
                          onClick={() => openControlPanel(session)}
                        >
                          <Settings2 className="h-4 w-4" />
                          Edit Info
                        </button>
                        <button
                          type="button"
                          className="observation-button observation-button--accent"
                          onClick={() => handleManageSessionTags(session.session_id)}
                        >
                          <Tags className="h-4 w-4" />
                          Manage Tags
                        </button>
                      </div>

                      <div className="observation-session-card-inline-row">
                        <button
                          type="button"
                          className="observation-inline-button observation-inline-button--compact"
                          onClick={() => handleExportTeacherCSV(session.session_id)}
                          disabled={exportingSessionId === session.session_id && exportingType !== null}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          {exportingSessionId === session.session_id && exportingType === "teacher"
                            ? "Exporting..."
                            : "Teacher CSV"}
                        </button>
                        <button
                          type="button"
                          className="observation-inline-button observation-inline-button--compact"
                          onClick={() => handleExportStudentCSV(session.session_id)}
                          disabled={exportingSessionId === session.session_id && exportingType !== null}
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          {exportingSessionId === session.session_id && exportingType === "student"
                            ? "Exporting..."
                            : "Student CSV"}
                        </button>
                        <button
                          type="button"
                          className="observation-inline-button observation-inline-button--compact observation-inline-button--danger"
                          onClick={() => openDeleteModal(session)}
                          disabled={Boolean(deletingSessionId)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </>
                  }
                />
              );
            })}
          </div>
        )}
      </ObservationPanelLayout>

      {deleteTargetSession && (
        <div className="observation-modal-overlay">
          <div className="observation-modal">
            <h2 className="observation-modal-title">Delete Session?</h2>
            <p className="observation-modal-copy">
              This will permanently remove the session and its observation data. This action cannot be undone.
            </p>

            <div className="observation-summary-card" style={{ marginTop: "1rem" }}>
              <div className="observation-summary-grid">
                <div>
                  <p className="observation-summary-label">Session Name</p>
                  <p className="observation-summary-value">{deleteTargetSession.lesson_name || "Untitled Session"}</p>
                </div>
                <div>
                  <p className="observation-summary-label">Teacher Name</p>
                  <p className="observation-summary-value">{deleteTargetSession.teacher_name || "N/A"}</p>
                </div>
                <div>
                  <p className="observation-summary-label">Join Code</p>
                  <p className="observation-summary-value">{deleteTargetSession.join_code || "N/A"}</p>
                </div>
              </div>
            </div>

            {deleteStatusMessage && (
              <div className="observation-status-banner observation-status-banner--error" style={{ marginTop: "1rem" }}>
                {deleteStatusMessage}
              </div>
            )}

            <div className="observation-modal-actions">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="observation-button observation-button--secondary"
                disabled={deletingSessionId === deleteTargetSession.session_id}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSession}
                disabled={deletingSessionId === deleteTargetSession.session_id}
                className="observation-button observation-button--danger"
              >
                {deletingSessionId === deleteTargetSession.session_id ? "Deleting..." : "Delete Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {controlPanelSession && (
        <div className="observation-modal-overlay">
          <div className="observation-modal">
            <h2 className="observation-modal-title">Session Control Panel</h2>
            <p className="observation-modal-copy">
              Update the saved session metadata for this session.
            </p>

            <div className="observation-stack" style={{ marginTop: "1rem" }}>
              <ObservationTextField
                label="Teacher Name"
                value={teacherName}
                onChange={(event) => setTeacherName(event.target.value)}
                required
              />
              <ObservationTextField
                label="Session Name"
                value={sessionName}
                onChange={(event) => setSessionName(event.target.value)}
                required
              />
              <ObservationTextField
                label="Lesson Description"
                value={lessonDescription}
                onChange={(event) => setLessonDescription(event.target.value)}
                multiline
              />
              <ObservationTextField
                label="Join Code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value.toUpperCase().replace(/\s+/g, ""))}
                required
                helperText={joinCode.length > 0 && !isJoinCodeValid ? undefined : "Required. Use at least 8 characters."}
                error={joinCode.length > 0 && !isJoinCodeValid ? "Join code must be at least 8 characters." : ""}
              />
              <div className="observation-field">
                <span className="observation-field-label-row">
                  <span className="observation-field-label">Numeric-only Student IDs</span>
                  <ObservationInfoButton
                    content="Turn this on if observers should enter numeric student IDs only. Multiple IDs can still be entered by separating them with commas."
                    label="About Numeric-only Student IDs"
                  />
                </span>
                <p className="observation-field-helper">
                  When enabled, the Student ID(s) field only accepts numbers.
                </p>
                <div className="observation-toggle-pill observation-toggle-pill--compact">
                  <button
                    type="button"
                    className={!studentIdNumericOnly ? "observation-toggle-pill-button--active" : ""}
                    onClick={() => setStudentIdNumericOnly(false)}
                  >
                    Off
                  </button>
                  <button
                    type="button"
                    className={studentIdNumericOnly ? "observation-toggle-pill-button--active" : ""}
                    onClick={() => setStudentIdNumericOnly(true)}
                  >
                    On
                  </button>
                </div>
              </div>
            </div>

            {controlPanelStatus && (
              <div
                className={`observation-status-banner ${
                  controlPanelStatusTone === "error"
                    ? "observation-status-banner--error"
                    : "observation-status-banner--success"
                }`}
                style={{ marginTop: "1rem" }}
              >
                {controlPanelStatus}
              </div>
            )}

            <div className="observation-modal-actions">
              <button
                type="button"
                onClick={closeControlPanel}
                className="observation-button observation-button--secondary"
                disabled={isControlSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveControlPanel}
                disabled={!canSaveControlPanel}
                className="observation-button observation-button--accent"
              >
                {isControlSaving ? "Saving..." : "Save Session Info"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
