// Local-storage helpers for preserving an in-progress session draft between pages.
import {
  cloneEditableSessionSections,
  createSessionSectionsFromLegacyTagDraft,
  type EditableSessionSection,
  type LegacySessionTagDraft,
} from "@/features/observation-mode/utils/sessionSections";

export type JoinCodeMode = "generate" | "custom";

export interface CreateSessionDraft {
  teacherName: string;
  sessionName: string;
  lessonDescription: string;
  joinCode: string;
  joinCodeMode: JoinCodeMode;
  isDefaultTags: boolean;
  studentIdNumericOnly: boolean;
  defaultSectionDraft?: EditableSessionSection[];
  customSectionDraft?: EditableSessionSection[];
}

const CREATE_SESSION_DRAFT_STORAGE_KEY = "observation_create_session_draft";

export function getDefaultCreateSessionDraft(): CreateSessionDraft {
  return {
    teacherName: "",
    sessionName: "",
    lessonDescription: "",
    joinCode: "",
    joinCodeMode: "generate",
    isDefaultTags: true,
    studentIdNumericOnly: false,
  };
}

function readLegacySectionDraft(
  draft: Partial<CreateSessionDraft> & {
    defaultTagDraft?: LegacySessionTagDraft;
    customTagDraft?: LegacySessionTagDraft;
  },
  key: "defaultSectionDraft" | "customSectionDraft",
  legacyKey: "defaultTagDraft" | "customTagDraft",
) {
  const sectionDraft = draft[key];
  if (Array.isArray(sectionDraft)) {
    return cloneEditableSessionSections(sectionDraft);
  }

  const legacyDraft = draft[legacyKey];
  if (legacyDraft && typeof legacyDraft === "object") {
    return createSessionSectionsFromLegacyTagDraft(legacyDraft, legacyKey === "defaultTagDraft");
  }

  return undefined;
}

export function readCreateSessionDraft(): CreateSessionDraft {
  const defaultDraft = getDefaultCreateSessionDraft();

  try {
    const storedDraft = sessionStorage.getItem(CREATE_SESSION_DRAFT_STORAGE_KEY);
    if (!storedDraft) {
      return defaultDraft;
    }

    const parsedDraft = JSON.parse(storedDraft) as Partial<CreateSessionDraft> & {
      defaultTagDraft?: LegacySessionTagDraft;
      customTagDraft?: LegacySessionTagDraft;
    };
    return {
      ...defaultDraft,
      ...parsedDraft,
      defaultSectionDraft: readLegacySectionDraft(parsedDraft, "defaultSectionDraft", "defaultTagDraft"),
      customSectionDraft: readLegacySectionDraft(parsedDraft, "customSectionDraft", "customTagDraft"),
    };
  } catch (error) {
    console.error("Failed to read create-session draft", error);
    return defaultDraft;
  }
}

export function saveCreateSessionDraft(draft: Partial<CreateSessionDraft>) {
  const currentDraft = readCreateSessionDraft();
  const nextDraft = {
    ...currentDraft,
    ...draft,
    defaultSectionDraft: draft.defaultSectionDraft
      ? cloneEditableSessionSections(draft.defaultSectionDraft)
      : currentDraft.defaultSectionDraft
        ? cloneEditableSessionSections(currentDraft.defaultSectionDraft)
        : undefined,
    customSectionDraft: draft.customSectionDraft
      ? cloneEditableSessionSections(draft.customSectionDraft)
      : currentDraft.customSectionDraft
        ? cloneEditableSessionSections(currentDraft.customSectionDraft)
        : undefined,
  };

  sessionStorage.setItem(
    CREATE_SESSION_DRAFT_STORAGE_KEY,
    JSON.stringify(nextDraft),
  );
}

export function clearCreateSessionDraft() {
  sessionStorage.removeItem(CREATE_SESSION_DRAFT_STORAGE_KEY);
}
