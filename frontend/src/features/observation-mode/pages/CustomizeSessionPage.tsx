// Observation workflow page for choosing which sections and tags are available in a session.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CircleCheckBig, Home, Play } from "lucide-react";

import AddTagModal from "@/components/Modal/AddTagModal";
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
import { createSession } from "@/services/createSession";
import { updateUserEditSessions } from "@/services/updateUserEditSessions";
import { updateUserSessions } from "@/services/updateUserSessions";

type SessionEditorView = "teacher" | "student";
type StatusTone = "error" | "success";

const DEFAULT_STUDENT_BEHAVIOR_TAGS = [
  "Coding",
  "Collaborating",
  "Logging In",
  "Planning",
  "Reading Code",
  "Reading Instructions",
  "Talking w/ teacher",
  "Waiting for help",
  "Debugging",
  "On Unrelated Tab",
  "Requesting Help",
  "Running Code",
  "Talking w/ peer",
];

const DEFAULT_TEACHER_BEHAVIOR_TAGS = [
  "Open-ended questions",
  "Direct to tasks",
  "Directs to resources",
  "Models struggle",
  "Teaches CT concept",
  "Manages behavior",
  "Stretch goals",
  "Reminds to save code",
  "Encourages collaboration",
  "Encourages participation",
  "Organizes peer tutors",
  "Organizes paired programming",
  "Encourages help-seeking",
  "Teaches collaboration",
  "Normalizes mistakes",
  "Connects to student interest",
];

const DEFAULT_FUNCTION_TAGS = ["Comp Thinking Skills", "Culture", "Independence", "Motivate", "Manage Environment"];
const DEFAULT_STRUCTURE_TAGS = ["Activity", "Help-seeking queue", "LMS", "Rules and Norms", "Snap!"];

function createDefaultTagDraft() {
  return {
    teacherBehaviorTags: [...DEFAULT_TEACHER_BEHAVIOR_TAGS],
    functionTags: [...DEFAULT_FUNCTION_TAGS],
    structureTags: [...DEFAULT_STRUCTURE_TAGS],
    studentTags: [...DEFAULT_STUDENT_BEHAVIOR_TAGS],
  };
}

function createBlankTagDraft() {
  return {
    teacherBehaviorTags: [] as string[],
    functionTags: [] as string[],
    structureTags: [] as string[],
    studentTags: [] as string[],
  };
}

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

export default function CustomizeSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const storedDraft = readCreateSessionDraft();
  const sessionData = {
    ...storedDraft,
    ...((location.state as Partial<CreateSessionDraft> | null) || {}),
  };
  const useDefaultTagPreset = Boolean(sessionData.isDefaultTags);
  const initialTagDraft = useDefaultTagPreset
    ? sessionData.defaultTagDraft ?? createDefaultTagDraft()
    : sessionData.customTagDraft ?? createBlankTagDraft();

  const [addTagModalString, setAddTagModalString] = useState("");
  const [viewing, setViewing] = useState<SessionEditorView>("teacher");
  const [teacherBehaviorTags, setTeacherBehaviorTags] = useState<string[]>(() => initialTagDraft.teacherBehaviorTags);
  const [functionTags, setFunctionTags] = useState<string[]>(() => initialTagDraft.functionTags);
  const [structureTags, setStructureTags] = useState<string[]>(() => initialTagDraft.structureTags);
  const [studentTags, setStudentTags] = useState<string[]>(() => initialTagDraft.studentTags);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("success");
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [createdSession, setCreatedSession] = useState<CreatedSessionState | null>(null);

  useEffect(() => {
    saveCreateSessionDraft(
      useDefaultTagPreset
        ? {
            defaultTagDraft: {
              teacherBehaviorTags,
              functionTags,
              structureTags,
              studentTags,
            },
          }
        : {
            customTagDraft: {
              teacherBehaviorTags,
              functionTags,
              structureTags,
              studentTags,
            },
          },
    );
  }, [functionTags, structureTags, studentTags, teacherBehaviorTags, useDefaultTagPreset]);

  const addTag = (category: string, value: string) => {
    switch (category) {
      case "behavior_tags":
        setTeacherBehaviorTags((previous) => [...previous, value]);
        break;
      case "function_tags":
        setFunctionTags((previous) => [...previous, value]);
        break;
      case "structure_tags":
        setStructureTags((previous) => [...previous, value]);
        break;
      case "student_tags":
        setStudentTags((previous) => [...previous, value]);
        break;
    }
  };

  const removeTag = (category: string, tagToRemove: string) => {
    switch (category) {
      case "teacher_behavior":
        setTeacherBehaviorTags((previous) => previous.filter((tag) => tag !== tagToRemove));
        break;
      case "function":
        setFunctionTags((previous) => previous.filter((tag) => tag !== tagToRemove));
        break;
      case "structure":
        setStructureTags((previous) => previous.filter((tag) => tag !== tagToRemove));
        break;
      case "student":
        setStudentTags((previous) => previous.filter((tag) => tag !== tagToRemove));
        break;
    }
  };

  const resetSectionToDefaults = (category: "behavior" | "function" | "structure" | "student") => {
    switch (category) {
      case "behavior":
        setTeacherBehaviorTags([...DEFAULT_TEACHER_BEHAVIOR_TAGS]);
        break;
      case "function":
        setFunctionTags([...DEFAULT_FUNCTION_TAGS]);
        break;
      case "structure":
        setStructureTags([...DEFAULT_STRUCTURE_TAGS]);
        break;
      case "student":
        setStudentTags([...DEFAULT_STUDENT_BEHAVIOR_TAGS]);
        break;
    }
  };

  const clearSectionTags = (category: "behavior" | "function" | "structure" | "student") => {
    switch (category) {
      case "behavior":
        setTeacherBehaviorTags([]);
        break;
      case "function":
        setFunctionTags([]);
        break;
      case "structure":
        setStructureTags([]);
        break;
      case "student":
        setStudentTags([]);
        break;
    }
  };

  const handleCreateSession = async () => {
    const userIdRaw = localStorage.getItem("user_id");
    const userId = userIdRaw ? Number(userIdRaw) : undefined;
    const localTime = new Date().toISOString();

    const sections = [
      {
        session_sector: "Teacher",
        section_name: "Behavior",
        tags: teacherBehaviorTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_sector: "Teacher",
        section_name: "Function",
        tags: functionTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_sector: "Teacher",
        section_name: "Structure",
        tags: structureTags.map((tag_name) => ({ tag_name })),
      },
      {
        session_sector: "Student",
        section_name: "Behaviors",
        tags: studentTags.map((tag_name) => ({ tag_name })),
      },
    ];

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

  const teacherSections = [
    {
      key: "behavior",
      title: "Behavior",
      infoText: "What teacher moves do you want available during observation?",
      tags: teacherBehaviorTags,
      tone: "cyan" as const,
      onAdd: () => setAddTagModalString("behavior"),
      onResetToDefault: useDefaultTagPreset ? () => resetSectionToDefaults("behavior") : undefined,
      onClearTags: useDefaultTagPreset ? undefined : () => clearSectionTags("behavior"),
      onRemove: (tag: string) => removeTag("teacher_behavior", tag),
    },
    {
      key: "function",
      title: "Function",
      infoText: "What purposes do you want observers to capture behind the teacher's moves?",
      tags: functionTags,
      tone: "blue" as const,
      onAdd: () => setAddTagModalString("function"),
      onResetToDefault: useDefaultTagPreset ? () => resetSectionToDefaults("function") : undefined,
      onClearTags: useDefaultTagPreset ? undefined : () => clearSectionTags("function"),
      onRemove: (tag: string) => removeTag("function", tag),
    },
    {
      key: "structure",
      title: "Structure",
      infoText: "What tools, routines, or classroom structures do you want observers to log?",
      tags: structureTags,
      tone: "rose" as const,
      onAdd: () => setAddTagModalString("structure"),
      onResetToDefault: useDefaultTagPreset ? () => resetSectionToDefaults("structure") : undefined,
      onClearTags: useDefaultTagPreset ? undefined : () => clearSectionTags("structure"),
      onRemove: (tag: string) => removeTag("structure", tag),
    },
  ];

  return (
    <ObservationPanelLayout
      title="Customize Session Tags"
      subtitle="Shape the categories observers will use."
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
            disabled={isCreatingSession}
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

        {statusMessage && (
          <div
            className={`observation-status-banner ${
              statusTone === "error" ? "observation-status-banner--error" : "observation-status-banner--success"
            }`}
          >
            {statusMessage}
          </div>
        )}

        {viewing === "teacher" ? (
          <div className="observation-stack">
            {teacherSections.map((section) => (
              <ObservationTagEditorSection
                key={section.key}
                title={section.title}
                infoText={section.infoText}
                tags={section.tags}
                tone={section.tone}
                onAdd={section.onAdd}
                onResetToDefault={section.onResetToDefault}
                onClearTags={section.onClearTags}
                onRemove={section.onRemove}
              />
            ))}
          </div>
        ) : (
          <ObservationTagEditorSection
            title="Student Behaviors"
            infoText="What student actions do you want observers to capture during the session?"
            tags={studentTags}
            tone="green"
            onAdd={() => setAddTagModalString("student")}
            onResetToDefault={useDefaultTagPreset ? () => resetSectionToDefaults("student") : undefined}
            onClearTags={useDefaultTagPreset ? undefined : () => clearSectionTags("student")}
            onRemove={(tag) => removeTag("student", tag)}
          />
        )}
      </div>

      {addTagModalString === "behavior" && (
        <AddTagModal
          modalHeader="Add Tag"
          tagSection="behavior_tags"
          onAddTag={addTag}
          onClose={() => setAddTagModalString("")}
        />
      )}
      {addTagModalString === "function" && (
        <AddTagModal
          modalHeader="Add Tag"
          tagSection="function_tags"
          onAddTag={addTag}
          onClose={() => setAddTagModalString("")}
        />
      )}
      {addTagModalString === "structure" && (
        <AddTagModal
          modalHeader="Add Tag"
          tagSection="structure_tags"
          onAddTag={addTag}
          onClose={() => setAddTagModalString("")}
        />
      )}
      {addTagModalString === "student" && (
        <AddTagModal
          modalHeader="Add Tag"
          tagSection="student_tags"
          onAddTag={addTag}
          onClose={() => setAddTagModalString("")}
        />
      )}
    </ObservationPanelLayout>
  );
}

