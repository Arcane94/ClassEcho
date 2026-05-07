// Serializes student observations for one session into a downloadable CSV file.
// Serializes student observations for one session into a downloadable CSV file.
import { getSessionSectionInfo } from "../services/getSessionSectionInfo";
import { getAllStudentObservationsForSession } from "../services/getAllStudentObservationsForSession";
import type { StudentObservationData } from "../services/createStudentObservation";
import {
  escapeCsvCell,
  getOrderedSectionNames,
  getTagSectionCsvColumns,
} from "./observationTagExport";

//Exports student observations for a session to a CSV file
export async function exportStudentObservationsToCSV(
  sessionId: string | number,
  userId?: string | number | null,
): Promise<{ success: boolean; hasData: boolean; }> {
  try {
    //Fetch all student observations for the session
    const observations = await getAllStudentObservationsForSession(sessionId, userId);

    if (observations.length === 0) {
      console.warn("No student observations found for this session");
      return {
        success: true,
        hasData: false,
      };
    }

    const sessionSections = await getSessionSectionInfo(String(sessionId), userId);
    const studentSectionNames = getOrderedSectionNames(
      (sessionSections ?? [])
        .filter((section) => section.session_sector === "Student")
        .map((section) => section.section_name),
      observations.map((observation) => observation.selected_tags ?? observation.behavior_tags),
    );

    //Define CSV headers
    const headers = [
      "session_id",
      "observer_id",
      "observer_name",
      "student_id",
      "on_task",
      "start_time",
      "end_time",
      ...studentSectionNames,
      "affect",
      "note",
      "recording"
    ];

    //Convert observations to CSV rows
    const rows = observations.map((obs: StudentObservationData) => {
      const tagColumns = getTagSectionCsvColumns(
        obs.selected_tags ?? obs.behavior_tags,
        studentSectionNames,
      );

      return [
        obs.session_id,
        obs.observer_id,
        obs.observer_name || "",
        obs.student_id || "",
        obs.on_task !== undefined ? obs.on_task : "",
        obs.start_time || "",
        obs.end_time || "",
        ...studentSectionNames.map((sectionName) => tagColumns[sectionName] || ""),
        Array.isArray(obs.affect) ? obs.affect.join(";") : "",
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
    link.setAttribute("download", `student_observations_session_${sessionId}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      hasData: true,
    };

  } catch (error) {
    console.error("Error exporting student observations to CSV:", error);
    return {
      success: false,
      hasData: false,
    };
  }
}
