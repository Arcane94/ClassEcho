type TagSections = Record<string, string[]>;

type ObservationTagCategory = "behavior_tags" | "function_tags" | "structure_tags";

const normalizeTagList = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

const normalizeTagSections = (value: unknown): TagSections => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return normalizeTagSections(JSON.parse(value));
    } catch {
      return { Behavior: normalizeTagList([value]) };
    }
  }

  if (Array.isArray(value)) {
    return { Behavior: normalizeTagList(value) };
  }

  if (typeof value !== "object") {
    return {};
  }

  const sections: TagSections = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, tags]) => {
    const normalizedTags = normalizeTagList(tags);
    if (normalizedTags.length > 0) {
      sections[key] = normalizedTags;
    }
  });

  return sections;
};

const normalizeSectionKey = (value: string): string => value.toLowerCase().replace(/[^a-z]+/g, "");

const resolveCategoryForSection = (sectionName: string): ObservationTagCategory | null => {
  const normalizedKey = normalizeSectionKey(sectionName);

  if (normalizedKey.includes("function")) {
    return "function_tags";
  }

  if (normalizedKey.includes("structure")) {
    return "structure_tags";
  }

  if (normalizedKey.includes("behavior")) {
    return "behavior_tags";
  }

  return null;
};

const getSectionTags = (sections: TagSections, category: ObservationTagCategory): string[] => {
  const matchedTags = Object.entries(sections)
    .filter(([sectionName]) => resolveCategoryForSection(sectionName) === category)
    .flatMap(([, tags]) => tags);

  return Array.from(new Set(matchedTags));
};

const joinTags = (tags: string[]): string => Array.from(new Set(tags)).join("; ");

export const escapeCsvCell = (value: unknown): string => {
  const normalizedValue = value == null ? "" : String(value);
  return `"${normalizedValue.replace(/"/g, `""`)}"`;
};

export interface ObservationTagCsvColumns {
  behavior_tags: string;
  function_tags: string;
  structure_tags: string;
}

export const getTeacherTagCsvColumns = (selectedTags: unknown): ObservationTagCsvColumns => {
  const sections = normalizeTagSections(selectedTags);
  const behaviorTags = getSectionTags(sections, "behavior_tags");
  const functionTags = getSectionTags(sections, "function_tags");
  const structureTags = getSectionTags(sections, "structure_tags");

  return {
    behavior_tags: joinTags(behaviorTags),
    function_tags: joinTags(functionTags),
    structure_tags: joinTags(structureTags),
  };
};

export const getStudentTagCsvColumns = (selectedTags: unknown): ObservationTagCsvColumns => {
  const sections = normalizeTagSections(selectedTags);
  const behaviorTags = getSectionTags(sections, "behavior_tags");

  const fallbackBehaviorTags = behaviorTags.length > 0
    ? behaviorTags
    : Array.from(new Set(Object.values(sections).flat()));

  return {
    behavior_tags: joinTags(fallbackBehaviorTags),
    function_tags: "",
    structure_tags: "",
  };
};
