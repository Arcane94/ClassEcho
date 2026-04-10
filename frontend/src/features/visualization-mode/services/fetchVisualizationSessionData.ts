// Builds the visualization playback payload from the session, observation logs, and replay windows.
import type { StudentObservationData } from "@/services/createStudentObservation";
import type { TeacherObservationData } from "@/services/createTeacherObservation";
import { fetchSessionById, type SessionData } from "@/services/fetchSessionById";
import { getAllStudentObservationsForSession } from "@/services/getAllStudentObservationsForSession";
import { getAllTeacherObservationsForSession } from "@/services/getAllTeacherObservationsForSession";
import { parseObservationTimestamp } from "../utils";
import type { HelpRow, RequestRow } from "../types";

type SelectedTagBuckets = {
  behavior: string[];
  function: string[];
  structure: string[];
  custom: string[];
};

export type VisualizationSessionData = {
  session: SessionData | null;
  teacherRows: HelpRow[];
  studentRows: RequestRow[];
};

function normalizeTagList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .filter((entry): entry is string => typeof entry === "string")
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeTagSections(value: unknown): Record<string, string[]> {
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

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string[]>>(
    (accumulator, [key, tags]) => {
      const normalizedTags = normalizeTagList(tags);
      if (normalizedTags.length > 0) {
        accumulator[key] = normalizedTags;
      }
      return accumulator;
    },
    {},
  );
}

function normalizeSectionKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z]+/g, "");
}

function bucketSelectedTags(value: unknown): SelectedTagBuckets {
  const sections = normalizeTagSections(value);

  return Object.entries(sections).reduce<SelectedTagBuckets>(
    (accumulator, [sectionName, tags]) => {
      const normalizedKey = normalizeSectionKey(sectionName);

      if (normalizedKey.includes("behavior")) {
        accumulator.behavior.push(...tags);
      } else if (normalizedKey.includes("function")) {
        accumulator.function.push(...tags);
      } else if (normalizedKey.includes("structure")) {
        accumulator.structure.push(...tags);
      } else {
        accumulator.custom.push(...tags);
      }

      return accumulator;
    },
    { behavior: [], function: [], structure: [], custom: [] },
  );
}

function dedupeTags(tags: string[]): string[] {
  return Array.from(
    new Set(
      tags
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  );
}

function joinTags(tags: string[]): string {
  return dedupeTags(tags).join("; ");
}

function parseObservationDate(rawValue: unknown): Date | null {
  return parseObservationTimestamp(rawValue);
}

function parseAffect(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeTagList(value);
  }

  if (typeof value === "string") {
    try {
      return parseAffect(JSON.parse(value));
    } catch {
      return value
        .split(";")
        .map((entry) => entry.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function normalizeOnTaskValue(value: unknown): string {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue === 0 ? "0" : "1";
  }

  return String(value).trim();
}

function splitStudentIds(rawValue: unknown): string[] {
  return Array.from(
    new Set(
      String(rawValue ?? "")
        .split(/[;,]+/)
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function normalizeStudentIdValue(rawValue: unknown): string {
  return splitStudentIds(rawValue).join("; ");
}

function mapTeacherObservationToHelpRows(observation: TeacherObservationData): HelpRow[] {
  const startTime = parseObservationDate(observation.start_time);
  const endTime = parseObservationDate(observation.end_time);

  if (!startTime || !endTime || endTime <= startTime) {
    return [];
  }

  const selectedTagBuckets = bucketSelectedTags(observation.selected_tags);
  const studentId = normalizeStudentIdValue(observation.student_id);
  const baseRow = {
    start_time: startTime,
    end_time: endTime,
    behavior_tags: joinTags(selectedTagBuckets.behavior),
    function_tags: joinTags(selectedTagBuckets.function),
    structure_tags: joinTags(selectedTagBuckets.structure),
    custom_tags: joinTags(selectedTagBuckets.custom),
    note: String(observation.note ?? "").trim(),
    location: String(observation.teacher_position ?? "").trim(),
    raw_start: String(observation.start_time ?? ""),
    raw_end: String(observation.end_time ?? ""),
  };

  return [{
    ...baseRow,
    student_id: studentId,
  }];
}

function mapStudentObservationToRequestRows(observation: StudentObservationData): RequestRow[] {
  const startTime = parseObservationDate(observation.start_time);
  const endTime = parseObservationDate(observation.end_time);

  if (!startTime || !endTime || endTime <= startTime) {
    return [];
  }

  const selectedTagBuckets = bucketSelectedTags(observation.selected_tags ?? observation.behavior_tags);
  const allSelectedTags = [
    ...selectedTagBuckets.behavior,
    ...selectedTagBuckets.function,
    ...selectedTagBuckets.structure,
    ...selectedTagBuckets.custom,
  ];
  const behaviorTags =
    selectedTagBuckets.behavior.length > 0 ? selectedTagBuckets.behavior : allSelectedTags;
  const studentId = normalizeStudentIdValue(observation.student_id);
  const baseRow = {
    start_time: startTime,
    end_time: endTime,
    behavior_tags: joinTags(behaviorTags),
    affect: joinTags(parseAffect(observation.affect)),
    on_task: normalizeOnTaskValue(observation.on_task),
    note: String(observation.note ?? "").trim(),
    location: "",
    raw_start: String(observation.start_time ?? ""),
    raw_end: String(observation.end_time ?? ""),
  };

  return [{
    ...baseRow,
    student_id: studentId,
  }];
}

export async function fetchVisualizationSessionData(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<VisualizationSessionData> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const [session, teacherObservations, studentObservations] = await Promise.all([
    fetchSessionById(String(sessionId), resolvedUserId),
    getAllTeacherObservationsForSession(sessionId, resolvedUserId),
    getAllStudentObservationsForSession(sessionId, resolvedUserId),
  ]);

  return {
    session,
    teacherRows: teacherObservations.flatMap(mapTeacherObservationToHelpRows),
    studentRows: studentObservations.flatMap(mapStudentObservationToRequestRows),
  };
}
