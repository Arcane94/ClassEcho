import type { SessionSectionInput } from "@/services/createSession";

export type SessionSector = "Teacher" | "Student";
export type SessionSectionTone = "cyan" | "green" | "yellow" | "blue" | "rose";

export interface EditableSessionSection {
  id: string;
  session_sector: SessionSector;
  section_name: string;
  tags: string[];
  default_tags?: string[];
}

export interface LegacySessionTagDraft {
  teacherBehaviorTags?: string[];
  functionTags?: string[];
  structureTags?: string[];
  studentTags?: string[];
}

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

const TEACHER_SECTION_TONES: SessionSectionTone[] = ["cyan", "blue", "rose", "yellow"];
const STUDENT_SECTION_TONES: SessionSectionTone[] = ["green", "cyan", "yellow", "blue", "rose"];

function normalizeTagList(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

export function createLocalSectionId() {
  return `section-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createEditableSessionSection({
  id = createLocalSectionId(),
  session_sector,
  section_name,
  tags,
  default_tags,
}: {
  id?: string;
  session_sector: SessionSector;
  section_name: string;
  tags?: string[];
  default_tags?: string[];
}): EditableSessionSection {
  return {
    id,
    session_sector,
    section_name: section_name.trim(),
    tags: normalizeTagList(tags ?? []),
    ...(default_tags ? { default_tags: normalizeTagList(default_tags) } : {}),
  };
}

export function cloneEditableSessionSections(sections: EditableSessionSection[]): EditableSessionSection[] {
  return sections.map((section) => ({
    ...section,
    tags: [...section.tags],
    ...(section.default_tags ? { default_tags: [...section.default_tags] } : {}),
  }));
}

export function createSessionSectionsFromLegacyTagDraft(
  draft: LegacySessionTagDraft,
  includeDefaultTagBackups = false,
): EditableSessionSection[] {
  return [
    createEditableSessionSection({
      session_sector: "Teacher",
      section_name: "Behavior",
      tags: draft.teacherBehaviorTags ?? [],
      default_tags: includeDefaultTagBackups ? DEFAULT_TEACHER_BEHAVIOR_TAGS : undefined,
    }),
    createEditableSessionSection({
      session_sector: "Teacher",
      section_name: "Function",
      tags: draft.functionTags ?? [],
      default_tags: includeDefaultTagBackups ? DEFAULT_FUNCTION_TAGS : undefined,
    }),
    createEditableSessionSection({
      session_sector: "Teacher",
      section_name: "Structure",
      tags: draft.structureTags ?? [],
      default_tags: includeDefaultTagBackups ? DEFAULT_STRUCTURE_TAGS : undefined,
    }),
    createEditableSessionSection({
      session_sector: "Student",
      section_name: "Behaviors",
      tags: draft.studentTags ?? [],
      default_tags: includeDefaultTagBackups ? DEFAULT_STUDENT_BEHAVIOR_TAGS : undefined,
    }),
  ];
}

export function createDefaultSessionSections(): EditableSessionSection[] {
  return createSessionSectionsFromLegacyTagDraft(
    {
      teacherBehaviorTags: DEFAULT_TEACHER_BEHAVIOR_TAGS,
      functionTags: DEFAULT_FUNCTION_TAGS,
      structureTags: DEFAULT_STRUCTURE_TAGS,
      studentTags: DEFAULT_STUDENT_BEHAVIOR_TAGS,
    },
    true,
  );
}

export function createBlankSessionSections(): EditableSessionSection[] {
  return [];
}

export function getDefaultSessionSectionsForSector(sessionSector: SessionSector): EditableSessionSection[] {
  return createDefaultSessionSections().filter((section) => section.session_sector === sessionSector);
}

export function serializeSessionSections(sections: EditableSessionSection[]): SessionSectionInput[] {
  return sections
    .map((section) => ({
      session_sector: section.session_sector,
      section_name: section.section_name.trim(),
      tags: normalizeTagList(section.tags).map((tag_name) => ({ tag_name })),
    }))
    .filter((section) => section.section_name);
}

export function addSection(
  sections: EditableSessionSection[],
  session_sector: SessionSector,
  section_name: string,
): EditableSessionSection[] {
  const nextSection = createEditableSessionSection({
    session_sector,
    section_name,
    tags: [],
  });

  if (session_sector === "Student") {
    return [...sections, nextSection];
  }

  const firstStudentIndex = sections.findIndex((section) => section.session_sector === "Student");
  if (firstStudentIndex === -1) {
    return [...sections, nextSection];
  }

  return [
    ...sections.slice(0, firstStudentIndex),
    nextSection,
    ...sections.slice(firstStudentIndex),
  ];
}

export function removeSection(sections: EditableSessionSection[], sectionId: string): EditableSessionSection[] {
  return sections.filter((section) => section.id !== sectionId);
}

export function renameSection(
  sections: EditableSessionSection[],
  sectionId: string,
  sectionName: string,
): EditableSessionSection[] {
  return sections.map((section) => (
    section.id === sectionId
      ? {
          ...section,
          section_name: sectionName,
        }
      : section
  ));
}

export function addTagToSection(
  sections: EditableSessionSection[],
  sectionId: string,
  tagName: string,
): EditableSessionSection[] {
  const normalizedTagName = tagName.trim();
  if (!normalizedTagName) {
    return sections;
  }

  return sections.map((section) => {
    if (section.id !== sectionId || section.tags.includes(normalizedTagName)) {
      return section;
    }

    return {
      ...section,
      tags: [...section.tags, normalizedTagName],
    };
  });
}

export function removeTagFromSection(
  sections: EditableSessionSection[],
  sectionId: string,
  tagName: string,
): EditableSessionSection[] {
  return sections.map((section) => (
    section.id === sectionId
      ? {
          ...section,
          tags: section.tags.filter((tag) => tag !== tagName),
        }
      : section
  ));
}

export function renameTagInSection(
  sections: EditableSessionSection[],
  sectionId: string,
  currentTagName: string,
  nextTagName: string,
): EditableSessionSection[] {
  const normalizedNextTagName = nextTagName.trim();
  if (!normalizedNextTagName) {
    return sections;
  }

  return sections.map((section) => {
    if (section.id !== sectionId) {
      return section;
    }

    return {
      ...section,
      tags: normalizeTagList(section.tags.map((tag) => (tag === currentTagName ? normalizedNextTagName : tag))),
    };
  });
}

export function clearSectionTags(sections: EditableSessionSection[], sectionId: string): EditableSessionSection[] {
  return sections.map((section) => (
    section.id === sectionId
      ? {
          ...section,
          tags: [],
        }
      : section
  ));
}

export function resetSectionTagsToDefaults(sections: EditableSessionSection[], sectionId: string): EditableSessionSection[] {
  return sections.map((section) => (
    section.id === sectionId && section.default_tags
      ? {
          ...section,
          tags: [...section.default_tags],
        }
      : section
  ));
}

export function resetSectorToDefaultSections(
  sections: EditableSessionSection[],
  sessionSector: SessionSector,
): EditableSessionSection[] {
  const defaultSections = getDefaultSessionSectionsForSector(sessionSector);
  const otherSections = sections.filter((section) => section.session_sector !== sessionSector);

  return sessionSector === "Teacher"
    ? [...defaultSections, ...otherSections]
    : [...otherSections, ...defaultSections];
}

export function getSectionTone(sectionIndex: number, sessionSector: SessionSector): SessionSectionTone {
  const tones = sessionSector === "Teacher" ? TEACHER_SECTION_TONES : STUDENT_SECTION_TONES;
  return tones[sectionIndex % tones.length];
}

export function isDuplicateSectionName(
  sections: EditableSessionSection[],
  sessionSector: SessionSector,
  sectionName: string,
  excludedSectionId?: string,
): boolean {
  const normalizedSectionName = sectionName.trim().toLowerCase();
  if (!normalizedSectionName) {
    return false;
  }

  return sections.some((section) => (
    section.session_sector === sessionSector
    && section.id !== excludedSectionId
    && section.section_name.trim().toLowerCase() === normalizedSectionName
  ));
}
