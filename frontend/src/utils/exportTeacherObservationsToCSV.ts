import { getAllTeacherObservationsForSession } from "../services/getAllTeacherObservationsForSession";
import type { TeacherObservationData } from "../services/createTeacherObservation";
import { escapeCsvCell, getTeacherTagCsvColumns } from "./observationTagExport";

//Exports teacher observations for a session to a CSV file
export async function exportTeacherObservationsToCSV(sessionId: string | number): Promise<void> {
  try {
    //Fetch all teacher observations for the session
    const observations = await getAllTeacherObservationsForSession(sessionId);

    if (observations.length === 0) {
      console.warn("No teacher observations found for this session");
      return;
    }

    //Define CSV headers
    const headers = [
      "Session ID",
      "Observer ID",
      "Observer Name",
      "Student ID",
      "Teacher Position",
      "Start Time",
      "End Time",
      "behavior_tags",
      "function_tags",
      "structure_tags",
      "Note",
      "Recording"
    ];

    //Convert observations to CSV rows
    const rows = observations.map((obs: TeacherObservationData) => {
      const tagColumns = getTeacherTagCsvColumns(obs.selected_tags);

      return [
        obs.session_id,
        obs.observer_id,
        obs.observer_name || "",
        obs.student_id || "",
        obs.teacher_position || "",
        obs.start_time || "",
        obs.end_time || "",
        tagColumns.behavior_tags,
        tagColumns.function_tags,
        tagColumns.structure_tags,
        obs.note || "",
        obs.recording !== undefined ? obs.recording : "",
      ];
    });

    //Create CSV content
    const csvContent = [
      headers.join(","),
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

  } catch (error) {
    console.error("Error exporting teacher observations to CSV:", error);
  }
}
