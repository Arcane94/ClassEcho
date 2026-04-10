// Local-storage helpers for preserving an in-progress session draft between pages.
export type JoinCodeMode = "generate" | "custom";

export interface SessionTagDraft {
  teacherBehaviorTags: string[];
  functionTags: string[];
  structureTags: string[];
  studentTags: string[];
}

export interface CreateSessionDraft {
  teacherName: string;
  sessionName: string;
  lessonDescription: string;
  joinCode: string;
  joinCodeMode: JoinCodeMode;
  isDefaultTags: boolean;
  studentIdNumericOnly: boolean;
  defaultTagDraft?: SessionTagDraft;
  customTagDraft?: SessionTagDraft;
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

export function readCreateSessionDraft(): CreateSessionDraft {
  const defaultDraft = getDefaultCreateSessionDraft();

  try {
    const storedDraft = sessionStorage.getItem(CREATE_SESSION_DRAFT_STORAGE_KEY);
    if (!storedDraft) {
      return defaultDraft;
    }

    const parsedDraft = JSON.parse(storedDraft) as Partial<CreateSessionDraft>;
    return {
      ...defaultDraft,
      ...parsedDraft,
    };
  } catch (error) {
    console.error("Failed to read create-session draft", error);
    return defaultDraft;
  }
}

export function saveCreateSessionDraft(draft: Partial<CreateSessionDraft>) {
  const currentDraft = readCreateSessionDraft();
  sessionStorage.setItem(
    CREATE_SESSION_DRAFT_STORAGE_KEY,
    JSON.stringify({
      ...currentDraft,
      ...draft,
    }),
  );
}

export function clearCreateSessionDraft() {
  sessionStorage.removeItem(CREATE_SESSION_DRAFT_STORAGE_KEY);
}
