// UI copy used by the observation flow so phrasing stays consistent across pages.
export const OBSERVATION_PAGE_TITLE = "Record Your Observatons";

export const OBSERVATION_TAB_DESCRIPTIONS = {
  teacher: "Behavior, function, and structure tags",
  student: "Student behavior tags",
} as const;

const TEACHER_SECTION_SUBTITLES: Record<string, string> = {
  behavior: "Capture the teacher moves you see happening in the moment.",
  function: "Capture the intent behind what the teacher is doing.",
  structure: "Track the tools, routines, or classroom structures in use.",
};

const STUDENT_BEHAVIOR_SUBTITLE = "Capture the student actions you see happening in the moment.";

const normalizeSectionName = (sectionName: string): string => sectionName.trim().toLowerCase();

export const getObservationSessionSectionSubtitle = (
  sectionName: string,
  segment: "Teacher" | "Student",
): string | undefined => {
  const normalizedSectionName = normalizeSectionName(sectionName);

  if (segment === "Teacher") {
    return TEACHER_SECTION_SUBTITLES[normalizedSectionName];
  }

  if (
    normalizedSectionName === "behavior"
    || normalizedSectionName === "behaviors"
    || normalizedSectionName === "student behavior"
    || normalizedSectionName === "student behaviors"
  ) {
    return STUDENT_BEHAVIOR_SUBTITLE;
  }

  return undefined;
};
