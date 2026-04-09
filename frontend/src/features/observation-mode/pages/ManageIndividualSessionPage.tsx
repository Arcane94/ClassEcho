// Session detail page used to edit one session's metadata, sections, and tags.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AddTagModal from "@/components/Modal/AddTagModal";
import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationSegmentedTabs from "@/features/observation-mode/components/ObservationSegmentedTabs";
import ObservationTagEditorSection from "@/features/observation-mode/components/ObservationTagEditorSection";
import { getSessionSectionInfo } from "@/services/getSessionSectionInfo";
import { updateSessionSections } from "@/services/updateSessionSections";

type SessionEditorView = "teacher" | "student";
type StatusTone = "error" | "success";
type SavedSessionTags = {
  behavior: string[];
  function: string[];
  structure: string[];
  student: string[];
};

export default function ManageIndividualSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = localStorage.getItem("user_id");

  const [addTagModalString, setAddTagModalString] = useState("");
  const [viewing, setViewing] = useState<SessionEditorView>("teacher");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("success");

  const [teacherBehaviorTags, setTeacherBehaviorTags] = useState<string[]>([]);
  const [functionTags, setFunctionTags] = useState<string[]>([]);
  const [structureTags, setStructureTags] = useState<string[]>([]);
  const [studentTags, setStudentTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<SavedSessionTags>({
    behavior: [],
    function: [],
    structure: [],
    student: [],
  });

  const sessionId = new URLSearchParams(location.search).get("sessionId") || "";

  const applyTagSnapshot = (snapshot: SavedSessionTags) => {
    setTeacherBehaviorTags([...snapshot.behavior]);
    setFunctionTags([...snapshot.function]);
    setStructureTags([...snapshot.structure]);
    setStudentTags([...snapshot.student]);
  };

  useEffect(() => {
    const loadSessionSections = async () => {
      if (!sessionId) {
        setStatusTone("error");
        setStatusMessage("Missing session id");
        setIsLoading(false);
        return;
      }

      const sections = await getSessionSectionInfo(sessionId, currentUserId);

      if (!sections) {
        setStatusTone("error");
        setStatusMessage("Failed to load session sections");
        setIsLoading(false);
        return;
      }

      const teacherBehaviorSection = sections.find(
        (section) => section.session_sector === "Teacher" && section.section_name.toLowerCase().includes("behavior"),
      );
      const functionSection = sections.find(
        (section) => section.session_sector === "Teacher" && section.section_name.toLowerCase().includes("function"),
      );
      const structureSection = sections.find(
        (section) => section.session_sector === "Teacher" && section.section_name.toLowerCase().includes("structure"),
      );
      const studentSection = sections.find((section) => section.session_sector === "Student");

      const loadedTags = {
        behavior: [...(teacherBehaviorSection?.tags || [])],
        function: [...(functionSection?.tags || [])],
        structure: [...(structureSection?.tags || [])],
        student: [...(studentSection?.tags || [])],
      };

      setSavedTags(loadedTags);
      applyTagSnapshot(loadedTags);
      setIsLoading(false);
    };

    loadSessionSections();
  }, [currentUserId, sessionId]);

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

  const editTag = (category: string, currentTag: string) => {
    const editedTag = window.prompt("Edit tag", currentTag);

    if (!editedTag || !editedTag.trim() || editedTag === currentTag) {
      return;
    }

    const nextTag = editedTag.trim();

    switch (category) {
      case "teacher_behavior":
        setTeacherBehaviorTags((previous) => previous.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "function":
        setFunctionTags((previous) => previous.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "structure":
        setStructureTags((previous) => previous.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
      case "student":
        setStudentTags((previous) => previous.map((tag) => (tag === currentTag ? nextTag : tag)));
        break;
    }
  };

  const resetSectionToSaved = (category: keyof SavedSessionTags) => {
    switch (category) {
      case "behavior":
        setTeacherBehaviorTags([...savedTags.behavior]);
        break;
      case "function":
        setFunctionTags([...savedTags.function]);
        break;
      case "structure":
        setStructureTags([...savedTags.structure]);
        break;
      case "student":
        setStudentTags([...savedTags.student]);
        break;
    }
  };

  const handleConfirmEdits = async () => {
    if (!sessionId) {
      setStatusTone("error");
      setStatusMessage("Missing session id");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

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

    const result = await updateSessionSections(sessionId, sections, currentUserId);

    if (!result.success) {
      setStatusTone("error");
      setStatusMessage(result.error || "Failed to save session edits");
      setIsSaving(false);
      return;
    }

    setSavedTags({
      behavior: [...teacherBehaviorTags],
      function: [...functionTags],
      structure: [...structureTags],
      student: [...studentTags],
    });
    setStatusTone("success");
    setStatusMessage("Session edits saved");
    setIsSaving(false);
  };

  const teacherSections = [
    {
      key: "behavior",
      title: "Behavior",
      infoText: "What teacher moves should observers be able to log for this session? Click a tag to rename it or use x to remove it.",
      tags: teacherBehaviorTags,
      tone: "cyan" as const,
      onAdd: () => setAddTagModalString("behavior"),
      onResetToDefault: () => resetSectionToSaved("behavior"),
      onRemove: (tag: string) => removeTag("teacher_behavior", tag),
      onEdit: (tag: string) => editTag("teacher_behavior", tag),
    },
    {
      key: "function",
      title: "Function",
      infoText: "What purposes should observers capture behind the teacher's moves in this session? Click a tag to rename it or use x to remove it.",
      tags: functionTags,
      tone: "blue" as const,
      onAdd: () => setAddTagModalString("function"),
      onResetToDefault: () => resetSectionToSaved("function"),
      onRemove: (tag: string) => removeTag("function", tag),
      onEdit: (tag: string) => editTag("function", tag),
    },
    {
      key: "structure",
      title: "Structure",
      infoText: "What tools, routines, or classroom structures should observers be able to log for this session? Click a tag to rename it or use x to remove it.",
      tags: structureTags,
      tone: "rose" as const,
      onAdd: () => setAddTagModalString("structure"),
      onResetToDefault: () => resetSectionToSaved("structure"),
      onRemove: (tag: string) => removeTag("structure", tag),
      onEdit: (tag: string) => editTag("structure", tag),
    },
  ];

  return (
    <ObservationPanelLayout
      title="Manage Session Tags"
      subtitle="Edit the saved tag sets for this session."
      onBack={() => navigate("/manage-sessions")}
      backPlacement="top-left"
      singleLineHeading
      width="wide"
      footer={
        <div className="observation-cta-row">
          <button
            type="button"
            className="observation-button observation-button--secondary"
            onClick={() => navigate("/manage-sessions")}
          >
            Back to Sessions
          </button>
          <button
            type="button"
            className="observation-button observation-button--accent"
            onClick={handleConfirmEdits}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Confirm Session Edits"}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="observation-empty-state">Loading session...</div>
      ) : (
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
                  onRemove={section.onRemove}
                  onEdit={section.onEdit}
                />
              ))}
            </div>
          ) : (
            <ObservationTagEditorSection
              title="Student Behaviors"
              infoText="What student actions should observers capture during this session? Click a tag to rename it or use x to remove it."
              tags={studentTags}
              tone="green"
              onAdd={() => setAddTagModalString("student")}
              onResetToDefault={() => resetSectionToSaved("student")}
              onRemove={(tag) => removeTag("student", tag)}
              onEdit={(tag) => editTag("student", tag)}
            />
          )}
        </div>
      )}

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

