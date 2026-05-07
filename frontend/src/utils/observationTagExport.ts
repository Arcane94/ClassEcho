// Normalizes observation tag structures into session-category-aware CSV columns.
export type TagSections = Record<string, string[]>;

export interface OrderedTagSection {
  name: string;
  tags: string[];
}

const DEFAULT_LEGACY_SECTION_NAME = "Behavior";

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

export const normalizeSectionName = (value: string): string =>
  value.trim().toLowerCase();

export const joinTags = (tags: string[]): string =>
  Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).join("; ");

export const normalizeTagSections = (
  value: unknown,
  legacySectionName = DEFAULT_LEGACY_SECTION_NAME,
): TagSections => {
  if (!value) {
    return {};
  }

  if (typeof value === "string") {
    try {
      return normalizeTagSections(JSON.parse(value), legacySectionName);
    } catch {
      return { [legacySectionName]: normalizeTagList([value]) };
    }
  }

  if (Array.isArray(value)) {
    return { [legacySectionName]: normalizeTagList(value) };
  }

  if (typeof value !== "object") {
    return {};
  }

  const sections: TagSections = {};

  Object.entries(value as Record<string, unknown>).forEach(([key, tags]) => {
    const normalizedKey = key.trim();
    const normalizedTags = normalizeTagList(tags);
    if (normalizedKey && normalizedTags.length > 0) {
      sections[normalizedKey] = normalizedTags;
    }
  });

  return sections;
};

const createSectionOrderMap = (sectionNames: string[]) => {
  const entries = new Map<string, string>();

  sectionNames.forEach((sectionName) => {
    const trimmed = sectionName.trim();
    if (!trimmed) {
      return;
    }

    const normalizedKey = normalizeSectionName(trimmed);
    if (!entries.has(normalizedKey)) {
      entries.set(normalizedKey, trimmed);
    }
  });

  return entries;
};

export const getOrderedSectionNames = (
  preferredSectionNames: string[],
  selectedTagValues: unknown[],
): string[] => {
  const fallbackSectionName = preferredSectionNames.length === 1
    ? preferredSectionNames[0]
    : DEFAULT_LEGACY_SECTION_NAME;
  const order = createSectionOrderMap(preferredSectionNames);

  selectedTagValues.forEach((selectedTags) => {
    Object.keys(normalizeTagSections(selectedTags, fallbackSectionName)).forEach((sectionName) => {
      const normalizedKey = normalizeSectionName(sectionName);
      if (!order.has(normalizedKey)) {
        order.set(normalizedKey, sectionName.trim());
      }
    });
  });

  return Array.from(order.values());
};

export const getOrderedTagSections = (
  selectedTags: unknown,
  orderedSectionNames: string[],
): OrderedTagSection[] => {
  const fallbackSectionName = orderedSectionNames.length === 1
    ? orderedSectionNames[0]
    : DEFAULT_LEGACY_SECTION_NAME;
  const sections = normalizeTagSections(selectedTags, fallbackSectionName);
  const orderedSections: OrderedTagSection[] = [];
  const seen = new Set<string>();

  orderedSectionNames.forEach((sectionName) => {
    const normalizedKey = normalizeSectionName(sectionName);
    const matchingTags = Object.entries(sections)
      .filter(([name]) => normalizeSectionName(name) === normalizedKey)
      .flatMap(([, tags]) => tags);

    orderedSections.push({
      name: sectionName,
      tags: Array.from(new Set(matchingTags)),
    });
    seen.add(normalizedKey);
  });

  Object.entries(sections).forEach(([sectionName, tags]) => {
    const normalizedKey = normalizeSectionName(sectionName);
    if (seen.has(normalizedKey)) {
      return;
    }

    orderedSections.push({
      name: sectionName,
      tags: Array.from(new Set(tags)),
    });
  });

  return orderedSections;
};

export const getTagSectionCsvColumns = (
  selectedTags: unknown,
  orderedSectionNames: string[],
): Record<string, string> =>
  getOrderedTagSections(selectedTags, orderedSectionNames).reduce<Record<string, string>>(
    (columns, section) => {
      columns[section.name] = joinTags(section.tags);
      return columns;
    },
    {},
  );

export const escapeCsvCell = (value: unknown): string => {
  const normalizedValue = value == null ? "" : String(value);
  return `"${normalizedValue.replace(/"/g, `""`)}"`;
};
