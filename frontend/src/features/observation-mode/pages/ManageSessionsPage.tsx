// Session management dashboard for sharing, exporting, editing, and deleting accessible sessions.
import { useCallback, useEffect, useMemo, useState } from "react";
import { FileSpreadsheet, RefreshCw, Settings2, Share2, Tags, Trash2, UserRoundX } from "lucide-react";
import { useNavigate } from "react-router-dom";

import ObservationInfoButton from "@/features/observation-mode/components/ObservationInfoButton";
import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationSessionCard from "@/features/observation-mode/components/ObservationSessionCard";
import ObservationTextField from "@/features/observation-mode/components/ObservationTextField";
import { deleteSession } from "@/services/deleteSession";
import { fetchSessionById, type SessionData } from "@/services/fetchSessionById";
import { getAccessibleSessions } from "@/services/getAccessibleSessions";
import { getSessionObservationCounts } from "@/services/getSessionObservationCounts";
import {
  fetchSessionAccessList,
  removeSharedSessionAccess,
  SESSION_ACCESS_ROLE_LABELS,
  shareSessionWithUser,
  type SessionAccessEntry,
  type SessionAccessList,
  type SharedSessionRole,
  updateSharedSessionRole,
} from "@/services/sessionAccess";
import { updateSessionInfo } from "@/services/updateSessionInfo";
import { exportStudentObservationsToCSV } from "@/utils/exportStudentObservationsToCSV";
import { exportTeacherObservationsToCSV } from "@/utils/exportTeacherObservationsToCSV";

type StatusTone = "error" | "success";

const ROLE_DESCRIPTIONS: Record<SharedSessionRole, string> = {
  viewer: "Can view the session in visualization mode and download teacher or student CSV files.",
  viz_editor: "Can do everything a viewer can do, plus edit replay windows, seating charts, and other visualization setup.",
  full_editor: "Can do everything a visualization editor can do, plus edit session details and tag sets. Only the creator can delete the session.",
};

function getSessionSortTime(session: SessionData): number {
  const rawValue = session.local_time || session.server_time;
  const parsedValue = rawValue ? new Date(rawValue).getTime() : Number.NaN;
  return Number.isNaN(parsedValue) ? 0 : parsedValue;
}

function getRoleLabel(session: SessionData): string {
  if (session.access_role && session.access_role in SESSION_ACCESS_ROLE_LABELS) {
    return SESSION_ACCESS_ROLE_LABELS[session.access_role];
  }

  return session.is_creator ? "Session creator" : "Shared session";
}

export default function ManageSessionsPage() {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem("user_id");

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [sessionObservationCounts, setSessionObservationCounts] = useState<
    Record<string, { teacherCount: number | null; studentCount: number | null }>
  >({});
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

  const [sharingSession, setSharingSession] = useState<SessionData | null>(null);
  const [sessionAccessList, setSessionAccessList] = useState<SessionAccessList | null>(null);
  const [isAccessLoading, setIsAccessLoading] = useState(false);
  const [shareIdentifier, setShareIdentifier] = useState("");
  const [shareRole, setShareRole] = useState<SharedSessionRole>("viewer");
  const [shareStatusMessage, setShareStatusMessage] = useState("");
  const [shareStatusTone, setShareStatusTone] = useState<StatusTone>("success");
  const [isSharingUser, setIsSharingUser] = useState(false);
  const [mutatingSharedUserId, setMutatingSharedUserId] = useState<number | null>(null);

  const [exportingSessionId, setExportingSessionId] = useState<string | null>(null);
  const [exportingType, setExportingType] = useState<"teacher" | "student" | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [deleteTargetSession, setDeleteTargetSession] = useState<SessionData | null>(null);
  const [deleteStatusMessage, setDeleteStatusMessage] = useState("");

  const orderedSessions = useMemo(
    () => [...sessions].sort((left, right) => getSessionSortTime(right) - getSessionSortTime(left)),
    [sessions],
  );

  const normalizedTeacherName = teacherName.trim();
  const normalizedSessionName = sessionName.trim();
  const normalizedJoinCode = joinCode.trim().toUpperCase();
  const normalizedShareIdentifier = shareIdentifier.trim();
  const isJoinCodeValid = normalizedJoinCode.length >= 8;
  const canSaveControlPanel = Boolean(normalizedTeacherName && normalizedSessionName && isJoinCodeValid && !isControlSaving);
  const canSubmitShare = Boolean(normalizedShareIdentifier && !isSharingUser);

  const loadSessions = useCallback(async () => {
    setLoading(true);

    try {
      if (!currentUserId) {
        setSessions([]);
        return;
      }

      const accessibleSessions = await getAccessibleSessions(currentUserId);
      setSessions(accessibleSessions);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    let cancelled = false;

    if (!currentUserId || sessions.length === 0) {
      setSessionObservationCounts({});
      return () => {
        cancelled = true;
      };
    }

    Promise.allSettled(
      sessions.map(async (session) => ({
        sessionId: session.session_id,
        counts: await getSessionObservationCounts(session.session_id, currentUserId),
      })),
    ).then((results) => {
      if (cancelled) {
        return;
      }

      const nextCounts = results.reduce<Record<string, { teacherCount: number | null; studentCount: number | null }>>(
        (accumulator, result) => {
          if (result.status !== "fulfilled") {
            return accumulator;
          }

          accumulator[result.value.sessionId] = result.value.counts;
          return accumulator;
        },
        {},
      );

      setSessionObservationCounts(nextCounts);
    });

    return () => {
      cancelled = true;
    };
  }, [currentUserId, sessions]);

  const openControlPanel = async (session: SessionData) => {
    if (!session.permissions?.can_edit_session) {
      return;
    }

    setControlPanelSession(session);
    setTeacherName(session.teacher_name || "");
    setSessionName(session.lesson_name || "");
    setLessonDescription(session.lesson_description || "");
    setJoinCode((session.join_code || "").toUpperCase().replace(/\s+/g, ""));
    setStudentIdNumericOnly(Boolean(session.student_id_numeric_only));
    setControlPanelStatus("");

    const freshSession = await fetchSessionById(session.session_id, currentUserId);
    if (!freshSession) {
      return;
    }

    setTeacherName(freshSession.teacher_name || "");
    setSessionName(freshSession.lesson_name || "");
    setLessonDescription(freshSession.lesson_description || "");
    setJoinCode((freshSession.join_code || "").toUpperCase().replace(/\s+/g, ""));
    setStudentIdNumericOnly(Boolean(freshSession.student_id_numeric_only));
  };

  const closeControlPanel = () => {
    if (isControlSaving) {
      return;
    }

    setControlPanelSession(null);
    setControlPanelStatus("");
  };

  const openDeleteModal = (session: SessionData) => {
    if (!session.permissions?.can_delete_session) {
      return;
    }

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

  const loadAccessList = async (session: SessionData) => {
    if (!currentUserId || !session.permissions?.can_manage_access) {
      return;
    }

    setSharingSession(session);
    setIsAccessLoading(true);
    setShareStatusMessage("");
    setShareIdentifier("");
    setShareRole("viewer");

    const result = await fetchSessionAccessList(session.session_id, currentUserId);

    if (!result.success || !result.data) {
      setSessionAccessList(null);
      setShareStatusTone("error");
      setShareStatusMessage(result.error || "We couldn't load sharing settings right now.");
      setIsAccessLoading(false);
      return;
    }

    setSessionAccessList(result.data);
    setIsAccessLoading(false);
  };

  const closeSharingModal = () => {
    if (isSharingUser || mutatingSharedUserId !== null) {
      return;
    }

    setSharingSession(null);
    setSessionAccessList(null);
    setShareIdentifier("");
    setShareRole("viewer");
    setShareStatusMessage("");
  };

  const applyAccessList = (data: SessionAccessList | undefined) => {
    if (data) {
      setSessionAccessList(data);
    }
  };

  const handleShareSession = async () => {
    if (!sharingSession || !currentUserId || !normalizedShareIdentifier) {
      return;
    }

    setIsSharingUser(true);
    setShareStatusMessage("");

    const result = await shareSessionWithUser(
      sharingSession.session_id,
      currentUserId,
      normalizedShareIdentifier,
      shareRole,
    );

    if (!result.success) {
      setShareStatusTone("error");
      setShareStatusMessage(result.error || "We couldn't share this session.");
      setIsSharingUser(false);
      return;
    }

    applyAccessList(result.data);
    setShareIdentifier("");
    setShareRole("viewer");
    setShareStatusTone("success");
    setShareStatusMessage("Session access updated.");
    setIsSharingUser(false);
  };

  const handleUpdateSharedRole = async (entry: SessionAccessEntry, nextRole: SharedSessionRole) => {
    if (!sharingSession || !currentUserId || entry.role === nextRole) {
      return;
    }

    setMutatingSharedUserId(entry.user_id);
    setShareStatusMessage("");

    const result = await updateSharedSessionRole(
      sharingSession.session_id,
      entry.user_id,
      currentUserId,
      nextRole,
    );

    if (!result.success) {
      setShareStatusTone("error");
      setShareStatusMessage(result.error || "We couldn't update this person's access.");
      setMutatingSharedUserId(null);
      return;
    }

    applyAccessList(result.data);
    setShareStatusTone("success");
    setShareStatusMessage("Access level updated.");
    setMutatingSharedUserId(null);
  };

  const handleRemoveSharedUser = async (entry: SessionAccessEntry) => {
    if (!sharingSession || !currentUserId) {
      return;
    }

    setMutatingSharedUserId(entry.user_id);
    setShareStatusMessage("");

    const result = await removeSharedSessionAccess(
      sharingSession.session_id,
      entry.user_id,
      currentUserId,
    );

    if (!result.success) {
      setShareStatusTone("error");
      setShareStatusMessage(result.error || "We couldn't remove access for this user.");
      setMutatingSharedUserId(null);
      return;
    }

    applyAccessList(result.data);
    setShareStatusTone("success");
    setShareStatusMessage("Access removed.");
    setMutatingSharedUserId(null);
  };

  const handleSaveControlPanel = async () => {
    if (!controlPanelSession || !currentUserId) {
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
      requester_id: currentUserId,
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
    if (!deleteTargetSession || !currentUserId) {
      return;
    }

    setDeletingSessionId(deleteTargetSession.session_id);
    setDeleteStatusMessage("");

    const result = await deleteSession(deleteTargetSession.session_id, currentUserId);

    if (!result.success) {
      setDeleteStatusMessage(result.error || "Failed to delete session");
      setDeletingSessionId(null);
      return;
    }

    setSessions((previous) => previous.filter((item) => item.session_id !== deleteTargetSession.session_id));
    setDeletingSessionId(null);
    setDeleteTargetSession(null);
    setDeleteStatusMessage("");

    if (controlPanelSession?.session_id === deleteTargetSession.session_id) {
      setControlPanelSession(null);
    }
  };

  const handleManageSessionTags = (session: SessionData) => {
    if (session.permissions?.can_edit_session) {
      navigate(`/manage-session?sessionId=${encodeURIComponent(session.session_id)}`);
    }
  };

  const handleExportTeacherCSV = async (sessionId: string) => {
    if (!currentUserId) {
      return;
    }

    setExportingSessionId(sessionId);
    setExportingType("teacher");
    const result = await exportTeacherObservationsToCSV(sessionId, currentUserId);
    if (result.success && !result.hasData) {
      setSessionObservationCounts((previous) => ({
        ...previous,
        [sessionId]: {
          teacherCount: 0,
          studentCount: previous[sessionId]?.studentCount ?? null,
        },
      }));
    }
    setExportingSessionId(null);
    setExportingType(null);
  };

  const handleExportStudentCSV = async (sessionId: string) => {
    if (!currentUserId) {
      return;
    }

    setExportingSessionId(sessionId);
    setExportingType("student");
    const result = await exportStudentObservationsToCSV(sessionId, currentUserId);
    if (result.success && !result.hasData) {
      setSessionObservationCounts((previous) => ({
        ...previous,
        [sessionId]: {
          teacherCount: previous[sessionId]?.teacherCount ?? null,
          studentCount: 0,
        },
      }));
    }
    setExportingSessionId(null);
    setExportingType(null);
  };

  return (
    <>
      <ObservationPanelLayout
        title="Saved Sessions"
        subtitle="Review sessions you created or that were shared with you."
        onBack={() => navigate("/session-options")}
        width="wide"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--brand-navy)]">Accessible sessions</h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Permissions depend on the access level assigned to you for each session.
            </p>
          </div>
          <button
            type="button"
            className="observation-inline-button observation-inline-button--compact"
            onClick={loadSessions}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="observation-empty-state">Loading sessions...</div>
          ) : orderedSessions.length === 0 ? (
            <div className="observation-empty-state">No saved sessions were found for this account yet.</div>
          ) : (
            <div className="observation-session-grid">
              {orderedSessions.map((session) => {
                const permissions = session.permissions;
                const observationCounts = sessionObservationCounts[session.session_id];
                const accessSummary = session.is_creator
                  ? "Can share, edit, export, and delete."
                  : session.access_role === "viz_editor"
                    ? "Can edit visualization setup and export."
                    : session.access_role === "full_editor"
                      ? "Can edit session details and export."
                      : "Can view and export data.";
                const showEditActions = Boolean(permissions?.can_edit_session);
                const showShareDeleteActions = Boolean(permissions?.can_manage_access || permissions?.can_delete_session);
                const showExportActions = Boolean(permissions?.can_export_csv);
                const teacherCsvUnavailable = observationCounts?.teacherCount === 0;
                const studentCsvUnavailable = observationCounts?.studentCount === 0;
                const isTeacherExportBusy = exportingSessionId === session.session_id && exportingType !== null;
                const isStudentExportBusy = exportingSessionId === session.session_id && exportingType !== null;

                return (
                  <ObservationSessionCard
                    key={session.session_id}
                    session={session}
                    contextLabel={getRoleLabel(session)}
                    supplemental={
                      <div className="min-h-[2.55rem] rounded-[1rem] border border-[rgba(148,163,184,0.22)] bg-[rgba(247,250,252,0.92)] px-3 py-2 text-sm text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--brand-navy)]">Access:</span> {accessSummary}
                      </div>
                    }
                    actions={
                      <>
                        {showEditActions ? (
                          <div className="observation-session-card-action-row observation-session-card-action-row--paired">
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
                              onClick={() => handleManageSessionTags(session)}
                            >
                              <Tags className="h-4 w-4" />
                              Manage Tags
                            </button>
                          </div>
                        ) : null}

                        {showShareDeleteActions ? (
                          <div className="observation-session-card-action-row observation-session-card-action-row--paired">
                            {permissions?.can_manage_access ? (
                              <button
                                type="button"
                                className="observation-button observation-button--soft-warning"
                                onClick={() => loadAccessList(session)}
                              >
                                <Share2 className="h-4 w-4" />
                                Share
                              </button>
                            ) : (
                              <div className="observation-session-card-action-placeholder" aria-hidden="true" />
                            )}

                            {permissions?.can_delete_session ? (
                              <button
                                type="button"
                                className="observation-button observation-button--soft-danger"
                                onClick={() => openDeleteModal(session)}
                                disabled={Boolean(deletingSessionId)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete
                              </button>
                            ) : (
                              <div className="observation-session-card-action-placeholder" aria-hidden="true" />
                            )}
                          </div>
                        ) : null}

                        {showExportActions ? (
                          <div className="observation-session-card-inline-row observation-session-card-inline-row--paired">
                            <div
                              className="w-full"
                              title={teacherCsvUnavailable ? "No teacher logs found in database." : undefined}
                            >
                              <button
                                type="button"
                                className="observation-inline-button observation-inline-button--compact"
                                onClick={() => handleExportTeacherCSV(session.session_id)}
                                disabled={isTeacherExportBusy || teacherCsvUnavailable}
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                {exportingSessionId === session.session_id && exportingType === "teacher"
                                  ? "Exporting..."
                                  : "Teacher CSV"}
                              </button>
                            </div>
                            <div
                              className="w-full"
                              title={studentCsvUnavailable ? "No student logs found in database." : undefined}
                            >
                              <button
                                type="button"
                                className="observation-inline-button observation-inline-button--compact"
                                onClick={() => handleExportStudentCSV(session.session_id)}
                                disabled={isStudentExportBusy || studentCsvUnavailable}
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                                {exportingSessionId === session.session_id && exportingType === "student"
                                  ? "Exporting..."
                                  : "Student CSV"}
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </>
                    }
                  />
                );
              })}
            </div>
          )}
        </div>
      </ObservationPanelLayout>

      {deleteTargetSession ? (
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

            {deleteStatusMessage ? (
              <div className="observation-status-banner observation-status-banner--error" style={{ marginTop: "1rem" }}>
                {deleteStatusMessage}
              </div>
            ) : null}

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
      ) : null}

      {controlPanelSession ? (
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

            {controlPanelStatus ? (
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
            ) : null}

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
      ) : null}

      {sharingSession ? (
        <div className="observation-modal-overlay">
          <div className="observation-modal observation-modal--session-detail">
            <div className="p-6">
              <h2 className="observation-modal-title">Share Session</h2>
              <p className="observation-modal-copy">
                Choose who can view this session, edit visualization setup, or edit session details.
              </p>

              <div className="observation-summary-card" style={{ marginTop: "1rem" }}>
                <div className="observation-summary-grid observation-summary-grid--top">
                  <div>
                    <p className="observation-summary-label">Session</p>
                    <p className="observation-summary-value">{sharingSession.lesson_name || "Untitled Session"}</p>
                  </div>
                  <div>
                    <p className="observation-summary-label">Owner</p>
                    <p className="observation-summary-value">
                      {sessionAccessList?.owner.username || sessionAccessList?.owner.email || "Session creator"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="observation-stack" style={{ marginTop: "1rem" }}>
                <div className="observation-share-row">
                  <ObservationTextField
                    label="Username or email"
                    value={shareIdentifier}
                    onChange={(event) => setShareIdentifier(event.target.value)}
                    placeholder="Enter the person's username or email"
                    className="observation-share-row__identity"
                  />
                  <div className="observation-field observation-share-row__role">
                    <span className="observation-field-label-row">
                      <label className="observation-field-label" htmlFor="share-role-select">
                        Access level
                      </label>
                    </span>
                    <div className="observation-select-wrap">
                      <select
                        id="share-role-select"
                        className="observation-field-input observation-select-input"
                        value={shareRole}
                        onChange={(event) => setShareRole(event.target.value as SharedSessionRole)}
                      >
                        <option value="viewer">{SESSION_ACCESS_ROLE_LABELS.viewer}</option>
                        <option value="viz_editor">{SESSION_ACCESS_ROLE_LABELS.viz_editor}</option>
                        <option value="full_editor">{SESSION_ACCESS_ROLE_LABELS.full_editor}</option>
                      </select>
                      <span className="observation-select-arrow" aria-hidden="true">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2.25 4.5 6 8.25 9.75 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="observation-button observation-button--accent observation-share-row__submit"
                    onClick={handleShareSession}
                    disabled={!canSubmitShare}
                  >
                    <Share2 className="h-4 w-4" />
                    {isSharingUser ? "Sharing..." : "Share"}
                  </button>
                </div>
                <div className="observation-field-helper">{ROLE_DESCRIPTIONS[shareRole]}</div>

                {shareStatusMessage ? (
                  <div
                    className={`observation-status-banner ${
                      shareStatusTone === "error"
                        ? "observation-status-banner--error"
                        : "observation-status-banner--success"
                    }`}
                  >
                    {shareStatusMessage}
                  </div>
                ) : null}

                {isAccessLoading ? (
                  <div className="observation-empty-state">Loading sharing settings...</div>
                ) : sessionAccessList?.shared_users.length ? (
                  <div className="observation-stack">
                    {sessionAccessList.shared_users.map((entry) => (
                      <div key={entry.user_id} className="observation-summary-card">
                        <div className="grid gap-3 md:grid-cols-[minmax(0,1.15fr)_minmax(12.75rem,13.75rem)_auto] md:items-end">
                          <div>
                            <p className="observation-summary-value">
                              {entry.username || entry.email || `User ${entry.user_id}`}
                            </p>
                            <p className="observation-summary-label">
                              {entry.email || "No email stored"}
                            </p>
                            {entry.granted_by_username ? (
                              <p className="observation-summary-label">
                                Shared by {entry.granted_by_username}
                              </p>
                            ) : null}
                          </div>

                          <div className="observation-field" style={{ marginBottom: 0 }}>
                            <label className="observation-field-label" htmlFor={`shared-role-${entry.user_id}`}>
                              Access level
                            </label>
                            <div className="observation-select-wrap">
                              <select
                                id={`shared-role-${entry.user_id}`}
                                className="observation-field-input observation-select-input"
                                value={entry.role}
                                onChange={(event) =>
                                  handleUpdateSharedRole(entry, event.target.value as SharedSessionRole)
                                }
                                disabled={mutatingSharedUserId === entry.user_id}
                              >
                                <option value="viewer">{SESSION_ACCESS_ROLE_LABELS.viewer}</option>
                                <option value="viz_editor">{SESSION_ACCESS_ROLE_LABELS.viz_editor}</option>
                                <option value="full_editor">{SESSION_ACCESS_ROLE_LABELS.full_editor}</option>
                              </select>
                              <span className="observation-select-arrow" aria-hidden="true">
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.25 4.5 6 8.25 9.75 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            className="observation-inline-button observation-inline-button--compact observation-inline-button--danger"
                            onClick={() => handleRemoveSharedUser(entry)}
                            disabled={mutatingSharedUserId === entry.user_id}
                          >
                            <UserRoundX className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="observation-empty-state">
                    This session has not been shared with anyone else yet.
                  </div>
                )}
              </div>

              <div className="observation-modal-actions">
                <button
                  type="button"
                  className="observation-button observation-button--secondary"
                  onClick={closeSharingModal}
                  disabled={isSharingUser || mutatingSharedUserId !== null}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
