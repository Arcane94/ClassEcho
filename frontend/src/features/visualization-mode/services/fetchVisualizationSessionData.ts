// Builds the visualization playback payload from the session, observation logs, and replay windows.
import type { StudentObservationData } from "@/services/createStudentObservation";
import type { TeacherObservationData } from "@/services/createTeacherObservation";
import { fetchSessionById, type SessionData } from "@/services/fetchSessionById";
import { getAllStudentObservationsForSession } from "@/services/getAllStudentObservationsForSession";
import { getAllTeacherObservationsForSession } from "@/services/getAllTeacherObservationsForSession";
import { getSessionSectionInfo } from "@/services/getSessionSectionInfo";
import {
  getOrderedSectionNames,
  getOrderedTagSections,
  joinTags,
} from "@/utils/observationTagExport";
import { parseObservationTimestamp } from "../utils";
import type { HelpRow, LogTagSection, RequestRow } from "../types";
import { getSectionFilterKey } from "../types";

export type VisualizationSessionData = {
  session: SessionData | null;
  teacherRows: HelpRow[];
  studentRows: RequestRow[];
};

function parseObservationDate(rawValue: unknown): Date | null {
  return parseObservationTimestamp(rawValue);
}

function parseAffect(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
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

function toLogTagSections(selectedTags: unknown, orderedSectionNames: string[]): LogTagSection[] {
  return getOrderedTagSections(selectedTags, orderedSectionNames)
    .map((section) => ({
      key: getSectionFilterKey(section.name),
      label: section.name,
      tags: joinTags(section.tags),
    }))
    .filter((section) => section.tags.trim() !== "");
}

function mapTeacherObservationToHelpRows(
  observation: TeacherObservationData,
  orderedSectionNames: string[],
): HelpRow[] {
  const startTime = parseObservationDate(observation.start_time);
  const endTime = parseObservationDate(observation.end_time);

  if (!startTime || !endTime || endTime <= startTime) {
    return [];
  }

  const studentId = normalizeStudentIdValue(observation.student_id);

  return [{
    student_id: studentId,
    start_time: startTime,
    end_time: endTime,
    tag_sections: toLogTagSections(observation.selected_tags, orderedSectionNames),
    note: String(observation.note ?? "").trim(),
    location: String(observation.teacher_position ?? "").trim(),
    raw_start: String(observation.start_time ?? ""),
    raw_end: String(observation.end_time ?? ""),
  }];
}

function mapStudentObservationToRequestRows(
  observation: StudentObservationData,
  orderedSectionNames: string[],
): RequestRow[] {
  const startTime = parseObservationDate(observation.start_time);
  const endTime = parseObservationDate(observation.end_time);

  if (!startTime || !endTime || endTime <= startTime) {
    return [];
  }

  const studentId = normalizeStudentIdValue(observation.student_id);

  return [{
    student_id: studentId,
    start_time: startTime,
    end_time: endTime,
    tag_sections: toLogTagSections(observation.selected_tags ?? observation.behavior_tags, orderedSectionNames),
    affect: joinTags(parseAffect(observation.affect)),
    on_task: normalizeOnTaskValue(observation.on_task),
    note: String(observation.note ?? "").trim(),
    location: "",
    raw_start: String(observation.start_time ?? ""),
    raw_end: String(observation.end_time ?? ""),
  }];
}

export async function fetchVisualizationSessionData(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<VisualizationSessionData> {
  const resolvedUserId = userId ?? localStorage.getItem("user_id");
  const [session, teacherObservations, studentObservations, sessionSections] = await Promise.all([
    fetchSessionById(String(sessionId), resolvedUserId),
    getAllTeacherObservationsForSession(sessionId, resolvedUserId),
    getAllStudentObservationsForSession(sessionId, resolvedUserId),
    getSessionSectionInfo(String(sessionId), resolvedUserId),
  ]);

  const teacherSectionNames = getOrderedSectionNames(
    (sessionSections ?? [])
      .filter((section) => section.session_sector === "Teacher")
      .map((section) => section.section_name),
    teacherObservations.map((observation) => observation.selected_tags),
  );
  const studentSectionNames = getOrderedSectionNames(
    (sessionSections ?? [])
      .filter((section) => section.session_sector === "Student")
      .map((section) => section.section_name),
    studentObservations.map((observation) => observation.selected_tags ?? observation.behavior_tags),
  );

  return {
    session,
    teacherRows: teacherObservations.flatMap((observation) =>
      mapTeacherObservationToHelpRows(observation, teacherSectionNames),
    ),
    studentRows: studentObservations.flatMap((observation) =>
      mapStudentObservationToRequestRows(observation, studentSectionNames),
    ),
  };
}
