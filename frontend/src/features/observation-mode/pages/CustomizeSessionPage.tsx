// Observation workflow page for choosing which sections and tags are available in a session.
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleCheckBig, Home, Play, Plus, RotateCcw } from "lucide-react";

import AddTagModal from "@/components/Modal/AddTagModal";
import ConfirmationModal from "@/components/Modal/ConfirmationModal";
import TextEntryModal from "@/components/Modal/TextEntryModal";
import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationSegmentedTabs from "@/features/observation-mode/components/ObservationSegmentedTabs";
import ObservationTagEditorSection from "@/features/observation-mode/components/ObservationTagEditorSection";
import {
  clearCreateSessionDraft,
  type CreateSessionDraft,
  readCreateSessionDraft,
  saveCreateSessionDraft,
} from "@/features/observation-mode/config/createSessionDraftStorage";
import { JOIN_CODE_ALREADY_EXISTS_MESSAGE } from "@/features/observation-mode/config/createSessionValidation";
import {
  addSection,
  addTagToSection,
  clearSectionTags,
  cloneEditableSessionSections,
  createBlankSessionSections,
  createDefaultSessionSections,
  getSectionTone,
  isDuplicateSectionName,
  removeSection,
  removeTagFromSection,
  renameSection,
  resetSectorToDefaultSections,
  resetSectionTagsToDefaults,
  serializeSessionSections,
  type EditableSessionSection,
  type SessionSector,
} from "@/features/observation-mode/utils/sessionSections";
import { createSession } from "@/services/createSession";
import { updateUserEditSessions } from "@/services/updateUserEditSessions";
import { updateUserSessions } from "@/services/updateUserSessions";

type SessionEditorView = "teacher" | "student";
type StatusTone = "error" | "success";

interface CreatedSessionState {
  sessionId: number;
  teacherName: string;
  sessionName: string;
  lessonDescription: string;
  joinCode: string;
  localTime: string;
  studentIdNumericOnly: boolean;
  userId?: number;
}

function getSectionInfoText(section: EditableSessionSection) {
  const normalizedSectionName = section.section_name.trim().toLowerCase();

  if (section.session_sector === "Teacher") {
    if (normalizedSectionName === "behavior") {
      return "What teacher moves do you want available during observation?";
    }

    if (normalizedSectionName === "function") {
      return "What purposes do you want observers to capture behind the teacher's moves?";
    }

    if (normalizedSectionName === "structure") {
      return "What tools, routines, or classroom structures do you want observers to log?";
    }
  }

  if (
    normalizedSectionName === "behavior"
    || normalizedSectionName === "behaviors"
    || normalizedSectionName === "student behavior"
    || normalizedSectionName === "student behaviors"
  ) {
    return "What student actions do you want observers to capture during the session?";
  }

  return section.session_sector === "Teacher"
    ? "What tags should observers be able to use in this teacher category?"
    : "What tags should observers be able to use in this student category?";
}

export default function CustomizeSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedDraft = readCreateSessionDraft();
  const sessionData = {
    ...storedDraft,
    ...((location.state as Partial<CreateSessionDraft> | null) || {}),
  };
  const useDefaultTagPreset = Boolean(sessionData.isDefaultTags);
  const initialSections = useDefaultTagPreset
    ? sessionData.defaultSectionDraft ?? createDefaultSessionSections()
    : sessionData.customSectionDraft ?? createBlankSessionSections();

  const [activeTagSectionId, setActiveTagSectionId] = useState<string | null>(null);
  const [addCategorySector, setAddCategorySector] = useState<SessionSector | null>(null);
  const [pendingDeleteSection, setPendingDeleteSection] = useState<EditableSessionSection | null>(null);
  const [pendingResetSector, setPendingResetSector] = useState<SessionSector | null>(null);
  const [viewing, setViewing] = useState<SessionEditorView>("teacher");
  const [sessionSections, setSessionSections] = useState<EditableSessionSection[]>(() => cloneEditableSessionSections(initialSections));
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("success");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createdSession, setCreatedSession] = useState<CreatedSessionState | null>(null);

  const currentSessionSector: SessionSector = viewing === "teacher" ? "Teacher" : "Student";
  const visibleSections = useMemo(
    () => sessionSections.filter((section) => section.session_sector === currentSessionSector),
    [currentSessionSector, sessionSections],
  );
  const activeTagSection = activeTagSectionId
    ? sessionSections.find((section) => section.id === activeTagSectionId) ?? null
    : null;

  function validateCategoryName(sessionSector: SessionSector, value: string, sectionId?: string) {
    if (isDuplicateSectionName(sessionSections, sessionSector, value, sectionId)) {
      return `${sessionSector} category names must be unique.`;
    }

    return "";
  }

  function getSectionNameError(section: EditableSessionSection) {
    const normalizedSectionName = section.section_name.trim();
    if (!normalizedSectionName) {
      return "Category name is required.";
    }

    return validateCategoryName(section.session_sector, normalizedSectionName, section.id);
  }

  const hasInvalidSectionNames = sessionSections.some((section) => Boolean(getSectionNameError(section)));

  useEffect(() => {
    saveCreateSessionDraft(
      useDefaultTagPreset
        ? { defaultSectionDraft: sessionSections }
        : { customSectionDraft: sessionSections },
    );
  }, [sessionSections, useDefaultTagPreset]);

  const handleAddCategory = (sessionSector: SessionSector, sectionName: string) => {
    setSessionSections((previous) => addSection(previous, sessionSector, sectionName));
  };

  const handleDeleteCategory = (section: EditableSessionSection) => {
    setSessionSections((previous) => removeSection(previous, section.id));
    if (activeTagSectionId === section.id) {
      setActiveTagSectionId(null);
    }
  };

  const handleResetSector = (sessionSector: SessionSector) => {
    setSessionSections((previous) => resetSectorToDefaultSections(previous, sessionSector));
    setActiveTagSectionId(null);
    setPendingResetSector(null);
  };

  const handleCreateSession = async () => {
    if (hasInvalidSectionNames) {
      setStatusTone("error");
      setStatusMessage("Fix invalid category names before creating the session.");
      return;
    }

    const userIdRaw = localStorage.getItem("user_id");
    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    const localTime = new Date().toISOString();
    const sections = serializeSessionSections(sessionSections);

    setIsCreatingSession(true);
    setStatusMessage("");

    try {
      if (userId === undefined || Number.isNaN(userId)) {
        throw new Error("Missing creator user id");
      }

      const { session_id } = await createSession({
        local_time: localTime,
        creator: userId,
        teacher_name: sessionData.teacherName,
        session_name: sessionData.sessionName,
        lesson_description: sessionData.lessonDescription,
        join_code: sessionData.joinCode,
        student_id_numeric_only: sessionData.studentIdNumericOnly,
        observers: userId ? [userId] : undefined,
        editors: userId ? [userId] : undefined,
        sections,
      });

      if (userId !== undefined) {
        await updateUserSessions(userId, session_id);
        await updateUserEditSessions(userId, session_id);
      }

      clearCreateSessionDraft();
      setCreatedSession({
        sessionId: session_id,
        teacherName: sessionData.teacherName,
        sessionName: sessionData.sessionName,
        lessonDescription: sessionData.lessonDescription,
        joinCode: sessionData.joinCode,
        localTime,
        studentIdNumericOnly: sessionData.studentIdNumericOnly,
        userId,
      });
      setStatusTone("success");
      setStatusMessage("");
      setIsCreatingSession(false);
    } catch (error) {
      console.error("Failed to create session", error);
      if (error instanceof Error && error.message === JOIN_CODE_ALREADY_EXISTS_MESSAGE) {
        navigate("/create-new", {
          state: {
            joinCodeError: JOIN_CODE_ALREADY_EXISTS_MESSAGE,
          },
        });
        return;
      }

      setStatusTone("error");
      setStatusMessage(error instanceof Error ? error.message : "Failed to create the session. Please review the details and try again.");
      setIsCreatingSession(false);
    }
  };

  const handleJoinCreatedSession = () => {
    if (!createdSession) {
      return;
    }

    localStorage.setItem(
      "session_info",
      JSON.stringify({
        session_id: createdSession.sessionId,
        creator: createdSession.userId ?? null,
        teacher_name: createdSession.teacherName,
        session_name: createdSession.sessionName,
        lesson_description: createdSession.lessonDescription || null,
        local_time: createdSession.localTime,
        server_time: createdSession.localTime,
        join_code: createdSession.joinCode,
        student_id_numeric_only: createdSession.studentIdNumericOnly,
        observers: createdSession.userId ? [createdSession.userId] : null,
        editors: createdSession.userId ? [createdSession.userId] : null,
      }),
    );

    navigate("/observation-session");
  };

  if (createdSession) {
    return (
      <ObservationPanelLayout
        title="Session Created"
        subtitle="Your session is ready. Join it now or head back to the observation home page."
        onBack={() => navigate("/session-options")}
        width="wide"
      >
        <div className="observation-stack">
          <div className="observation-status-banner observation-status-banner--success">
            <CircleCheckBig className="h-5 w-5" />
            Session created successfully.
          </div>

          <div className="observation-summary-card">
            <div className="observation-summary-grid">
              <div>
                <p className="observation-summary-label">Join Code</p>
                <p className="observation-summary-value observation-summary-value--code">{createdSession.joinCode}</p>
              </div>
              <div>
                <p className="observation-summary-label">Session Name</p>
                <p className="observation-summary-value">{createdSession.sessionName}</p>
              </div>
              <div>
                <p className="observation-summary-label">Teacher Name</p>
                <p className="observation-summary-value">{createdSession.teacherName}</p>
              </div>
              <div>
                <p className="observation-summary-label">Description</p>
                <p className="observation-summary-value observation-summary-value--body">
                  {createdSession.lessonDescription || "No lesson description provided."}
                </p>
              </div>
            </div>
          </div>

          <div className="observation-cta-row">
            <button type="button" className="observation-button observation-button--accent" onClick={handleJoinCreatedSession}>
              <Play className="h-4 w-4" />
              Join Session Now
            </button>
            <button type="button" className="observation-button observation-button--secondary" onClick={() => navigate("/session-options")}>
              <Home className="h-4 w-4" />
              Back to Home
            </button>
          </div>
        </div>
      </ObservationPanelLayout>
    );
  }

  return (
    <ObservationPanelLayout
      title="Customize Session Tags"
      subtitle="Add, rename, and remove the categories observers will use."
      onBack={() => navigate(-1)}
      backPlacement="top-left"
      singleLineHeading
      width="wide"
      footer={
        <div className="observation-cta-row">
          <button
            type="button"
            className="observation-button observation-button--secondary"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            type="button"
            className="observation-button observation-button--accent"
            onClick={handleCreateSession}
            disabled={isCreatingSession || hasInvalidSectionNames}
          >
            {isCreatingSession ? "Creating..." : "Create Session"}
          </button>
        </div>
      }
    >
      <div className="observation-stack">
        <ObservationSegmentedTabs
          tabs={[
            { key: "teacher", label: "Teacher" },
            { key: "student", label: "Student" },
          ]}
          value={viewing}
          onChange={setViewing}
        />

        <div className="observation-editor-toolbar">
          <button
            type="button"
            className="observation-inline-button observation-inline-button--add observation-inline-button--toolbar"
            onClick={() => setAddCategorySector(currentSessionSector)}
            aria-label={`Add ${viewing === "teacher" ? "teacher" : "student"} category`}
          >
            <Plus className="h-4 w-4" />
            Add category
          </button>

          {useDefaultTagPreset && (
            <button
              type="button"
              className="observation-inline-button observation-inline-button--reset-inline observation-inline-button--toolbar"
              onClick={() => setPendingResetSector(currentSessionSector)}
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
          )}
        </div>

        {statusMessage && (
          <div
            className={`observation-status-banner ${
              statusTone === "error" ? "observation-status-banner--error" : "observation-status-banner--success"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {visibleSections.length === 0 ? (
          <section className="observation-editor-section">
            <p className="observation-empty-inline">
              {`No ${viewing === "teacher" ? "teacher" : "student"} categories added yet.`}
            </p>
          </section>
        ) : (
          <div className="observation-stack">
            {visibleSections.map((section, index) => (
              <ObservationTagEditorSection
                key={section.id}
                title={section.section_name}
                titleError={getSectionNameError(section)}
                onTitleChange={(value) => setSessionSections((previous) => renameSection(previous, section.id, value))}
                infoText={getSectionInfoText(section)}
                tags={section.tags}
                tone={getSectionTone(index, section.session_sector)}
                onAdd={() => setActiveTagSectionId(section.id)}
                onResetToDefault={section.default_tags?.length ? () => setSessionSections((previous) => resetSectionTagsToDefaults(previous, section.id)) : undefined}
                onClearTags={section.default_tags?.length ? undefined : () => setSessionSections((previous) => clearSectionTags(previous, section.id))}
                onRemove={(tag) => setSessionSections((previous) => removeTagFromSection(previous, section.id, tag))}
                onDeleteSection={() => setPendingDeleteSection(section)}
              />
            ))}
          </div>
        )}
      </div>

      {activeTagSection && (
        <AddTagModal
          modalHeader={`Add Tag to ${activeTagSection.section_name}`}
          tagSection={activeTagSection.id}
          onAddTag={(sectionId, value) => setSessionSections((previous) => addTagToSection(previous, sectionId, value))}
          onClose={() => setActiveTagSectionId(null)}
        />
      )}

      {addCategorySector && (
        <TextEntryModal
          modalHeader="Add Category"
          modalCopy="Create a new category for this side of the observation form."
          fieldLabel="Category Name"
          placeholder="Enter category name"
          submitLabel="Add Category"
          validate={(value) => validateCategoryName(addCategorySector, value)}
          onSubmit={(value) => {
            handleAddCategory(addCategorySector, value);
          }}
          onClose={() => setAddCategorySector(null)}
        />
      )}

      {pendingDeleteSection && (
        <ConfirmationModal
          title="Delete Category"
          message={`Delete the ${pendingDeleteSection.section_name.trim() || "untitled"} category and all of its tags?`}
          confirmLabel="Delete"
          confirmTone="danger"
          onConfirm={() => handleDeleteCategory(pendingDeleteSection)}
          onClose={() => setPendingDeleteSection(null)}
        />
      )}

      {pendingResetSector && (
        <ConfirmationModal
          title="Reset Categories"
          message={`Restore the default ${pendingResetSector.toLowerCase()} categories and tags for this session?`}
          confirmLabel="Reset"
          confirmTone="danger"
          onConfirm={() => handleResetSector(pendingResetSector)}
          onClose={() => setPendingResetSector(null)}
        />
      )}
    </ObservationPanelLayout>
  );
}
