// Session detail page used to edit one session's metadata, sections, and tags.
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";

import AddTagModal from "@/components/Modal/AddTagModal";
import ConfirmationModal from "@/components/Modal/ConfirmationModal";
import TextEntryModal from "@/components/Modal/TextEntryModal";
import ObservationPanelLayout from "@/features/observation-mode/components/ObservationPanelLayout";
import ObservationSegmentedTabs from "@/features/observation-mode/components/ObservationSegmentedTabs";
import ObservationTagEditorSection from "@/features/observation-mode/components/ObservationTagEditorSection";
import {
  addSection,
  addTagToSection,
  clearSectionTags,
  cloneEditableSessionSections,
  createEditableSessionSection,
  getSectionTone,
  isDuplicateSectionName,
  removeSection,
  removeTagFromSection,
  renameSection,
  renameTagInSection,
  serializeSessionSections,
  type EditableSessionSection,
  type SessionSector,
} from "@/features/observation-mode/utils/sessionSections";
import { getSessionSectionInfo } from "@/services/getSessionSectionInfo";
import { updateSessionSections } from "@/services/updateSessionSections";

type SessionEditorView = "teacher" | "student";
type StatusTone = "error" | "success";

function getSectionInfoText(section: EditableSessionSection) {
  return section.session_sector === "Teacher"
    ? "Click a tag to rename it, use x to remove it, or rename the category itself."
    : "Click a tag to rename it, use x to remove it, or rename the category itself.";
}

export default function ManageIndividualSessionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUserId = localStorage.getItem("user_id");

  const [activeTagSectionId, setActiveTagSectionId] = useState<string | null>(null);
  const [addCategorySector, setAddCategorySector] = useState<SessionSector | null>(null);
  const [pendingDeleteSection, setPendingDeleteSection] = useState<EditableSessionSection | null>(null);
  const [viewing, setViewing] = useState<SessionEditorView>("teacher");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusTone, setStatusTone] = useState<StatusTone>("success");
  const [sessionSections, setSessionSections] = useState<EditableSessionSection[]>([]);
  const [savedSections, setSavedSections] = useState<EditableSessionSection[]>([]);

  const sessionId = new URLSearchParams(location.search).get("sessionId") || "";
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

      const loadedSections = sections.map((section) => createEditableSessionSection({
        id: String(section.section_id),
        session_sector: section.session_sector === "Student" ? "Student" : "Teacher",
        section_name: section.section_name,
        tags: section.tags,
      }));

      setSavedSections(cloneEditableSessionSections(loadedSections));
      setSessionSections(cloneEditableSessionSections(loadedSections));
      setIsLoading(false);
    };

    loadSessionSections();
  }, [currentUserId, sessionId]);

  const resetSectionToSaved = (sectionId: string) => {
    const savedSection = savedSections.find((section) => section.id === sectionId);
    if (!savedSection) {
      return;
    }

    setSessionSections((previous) => previous.map((section) => (
      section.id === sectionId
        ? {
            ...section,
            tags: [...savedSection.tags],
          }
        : section
    )));
  };

  const handleDeleteCategory = (section: EditableSessionSection) => {
    setSessionSections((previous) => removeSection(previous, section.id));
    if (activeTagSectionId === section.id) {
      setActiveTagSectionId(null);
    }
  };

  const handleEditTag = (sectionId: string, currentTag: string) => {
    const editedTag = window.prompt("Edit tag", currentTag);

    if (!editedTag || !editedTag.trim() || editedTag.trim() === currentTag) {
      return;
    }

    setSessionSections((previous) => renameTagInSection(previous, sectionId, currentTag, editedTag));
  };

  const handleConfirmEdits = async () => {
    if (hasInvalidSectionNames) {
      setStatusTone("error");
      setStatusMessage("Fix invalid category names before saving the session.");
      return;
    }

    if (!sessionId) {
      setStatusTone("error");
      setStatusMessage("Missing session id");
      return;
    }

    setIsSaving(true);
    setStatusMessage("");

    const result = await updateSessionSections(sessionId, serializeSessionSections(sessionSections), currentUserId);

    if (!result.success) {
      setStatusTone("error");
      setStatusMessage(result.error || "Failed to save session edits");
      setIsSaving(false);
      return;
    }

    const nextSavedSections = cloneEditableSessionSections(sessionSections);
    setSavedSections(nextSavedSections);
    setStatusTone("success");
    setStatusMessage("Session edits saved");
    setIsSaving(false);
  };

  return (
    <ObservationPanelLayout
      title="Manage Session Tags"
      subtitle="Add, rename, and remove the saved categories for this session."
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
            disabled={isSaving || hasInvalidSectionNames}
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
              {visibleSections.map((section, index) => {
                const hasSavedVersion = savedSections.some((savedSection) => savedSection.id === section.id);

                return (
                  <ObservationTagEditorSection
                    key={section.id}
                    title={section.section_name}
                    titleError={getSectionNameError(section)}
                    onTitleChange={(value) => setSessionSections((previous) => renameSection(previous, section.id, value))}
                    infoText={getSectionInfoText(section)}
                    tags={section.tags}
                    tone={getSectionTone(index, section.session_sector)}
                    onAdd={() => setActiveTagSectionId(section.id)}
                    onResetToDefault={hasSavedVersion ? () => resetSectionToSaved(section.id) : undefined}
                    resetLabel="Revert"
                    onClearTags={hasSavedVersion ? undefined : () => setSessionSections((previous) => clearSectionTags(previous, section.id))}
                    onRemove={(tag) => setSessionSections((previous) => removeTagFromSection(previous, section.id, tag))}
                    onEdit={(tag) => handleEditTag(section.id, tag)}
                    onDeleteSection={() => setPendingDeleteSection(section)}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

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
            setSessionSections((previous) => addSection(previous, addCategorySector, value));
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
    </ObservationPanelLayout>
  );
}
