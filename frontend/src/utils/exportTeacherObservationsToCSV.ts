// Serializes teacher observations for one session into a downloadable CSV file.
// Serializes teacher observations for one session into a downloadable CSV file.
import { getSessionSectionInfo } from "../services/getSessionSectionInfo";
import { getAllTeacherObservationsForSession } from "../services/getAllTeacherObservationsForSession";
import type { TeacherObservationData } from "../services/createTeacherObservation";
import {
  escapeCsvCell,
  getOrderedSectionNames,
  getTagSectionCsvColumns,
} from "./observationTagExport";

//Exports teacher observations for a session to a CSV file
export async function exportTeacherObservationsToCSV(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<{ success: boolean; hasData: boolean; }> {
  try {
    //Fetch all teacher observations for the session
    const observations = await getAllTeacherObservationsForSession(sessionId, userId);

    if (observations.length === 0) {
      console.warn("No teacher observations found for this session");
      return {
        success: true,
        hasData: false,
      };
    }

    const sessionSections = await getSessionSectionInfo(String(sessionId), userId);
    const teacherSectionNames = getOrderedSectionNames(
      (sessionSections ?? [])
        .filter((section) => section.session_sector === "Teacher")
        .map((section) => section.section_name),
      observations.map((observation) => observation.selected_tags),
    );

    //Define CSV headers
    const headers = [
      "session_id",
      "observer_id",
      "observer_name",
      "student_id",
      "teacher_position",
      "start_time",
      "end_time",
      ...teacherSectionNames,
      "note",
      "recording"
    ];

    //Convert observations to CSV rows
    const rows = observations.map((obs: TeacherObservationData) => {
      const tagColumns = getTagSectionCsvColumns(obs.selected_tags, teacherSectionNames);

      return [
        obs.session_id,
        obs.observer_id,
        obs.observer_name || "",
        obs.student_id || "",
        obs.teacher_position || "",
        obs.start_time || "",
        obs.end_time || "",
        ...teacherSectionNames.map((sectionName) => tagColumns[sectionName] || ""),
        obs.note || "",
        obs.recording !== undefined ? obs.recording : "",
      ];
    });

    //Create CSV content
    const csvContent = [
      headers.map((cell) => escapeCsvCell(cell)).join(","),
      ...rows.map(row => row.map((cell) => escapeCsvCell(cell)).join(","))
    ].join("\n");

    //Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `teacher_observations_session_${sessionId}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      hasData: true,
    };

  } catch (error) {
    console.error("Error exporting teacher observations to CSV:", error);
    return {
      success: false,
      hasData: false,
    };
  }
}
