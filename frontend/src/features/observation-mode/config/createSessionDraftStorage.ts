// Local-storage helpers for preserving an in-progress session draft between pages.
import {
  cloneEditableSessionSections,
  createSessionSectionsFromLegacyTagDraft,
  upgradeDefaultSessionDraftSections,
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
  defaultSectionDraftVersion?: number;
  defaultSectionDraft?: EditableSessionSection[];
  customSectionDraft?: EditableSessionSection[];
}

const CREATE_SESSION_DRAFT_STORAGE_KEY = "observation_create_session_draft";
const CURRENT_DEFAULT_SECTION_DRAFT_VERSION = 3;

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
    const parsedDefaultSectionDraft = readLegacySectionDraft(parsedDraft, "defaultSectionDraft", "defaultTagDraft");
    const shouldUpgradeDefaultDraft = (
      Boolean(parsedDefaultSectionDraft)
      && (parsedDraft.defaultSectionDraftVersion ?? 0) < CURRENT_DEFAULT_SECTION_DRAFT_VERSION
    );

    return {
      ...defaultDraft,
      ...parsedDraft,
      defaultSectionDraftVersion: parsedDefaultSectionDraft
        ? CURRENT_DEFAULT_SECTION_DRAFT_VERSION
        : parsedDraft.defaultSectionDraftVersion,
      defaultSectionDraft: parsedDefaultSectionDraft
        ? shouldUpgradeDefaultDraft
          ? upgradeDefaultSessionDraftSections(parsedDefaultSectionDraft)
          : parsedDefaultSectionDraft
        : undefined,
      customSectionDraft: readLegacySectionDraft(parsedDraft, "customSectionDraft", "customTagDraft"),
    };
  } catch (error) {
    console.error("Failed to read create-session draft", error);
    return defaultDraft;
  }
}

export function saveCreateSessionDraft(draft: Partial<CreateSessionDraft>) {
  const currentDraft = readCreateSessionDraft();
  const nextDefaultSectionDraft = draft.defaultSectionDraft
    ? cloneEditableSessionSections(draft.defaultSectionDraft)
    : currentDraft.defaultSectionDraft
      ? cloneEditableSessionSections(currentDraft.defaultSectionDraft)
      : undefined;
  const nextCustomSectionDraft = draft.customSectionDraft
    ? cloneEditableSessionSections(draft.customSectionDraft)
    : currentDraft.customSectionDraft
      ? cloneEditableSessionSections(currentDraft.customSectionDraft)
      : undefined;
  const nextDraft = {
    ...currentDraft,
    ...draft,
    defaultSectionDraftVersion: nextDefaultSectionDraft
      ? CURRENT_DEFAULT_SECTION_DRAFT_VERSION
      : undefined,
    defaultSectionDraft: nextDefaultSectionDraft,
    customSectionDraft: nextCustomSectionDraft,
  };

  sessionStorage.setItem(
    CREATE_SESSION_DRAFT_STORAGE_KEY,
    JSON.stringify(nextDraft),
  );
}

export function clearCreateSessionDraft() {
  sessionStorage.removeItem(CREATE_SESSION_DRAFT_STORAGE_KEY);
}
