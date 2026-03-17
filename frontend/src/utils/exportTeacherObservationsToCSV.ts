import { getAllTeacherObservationsForSession } from "./getAllTeacherObservationsForSession";
import type { TeacherObservationData } from "./createTeacherObservation";

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
      "Student ID",
      "Teacher Position",
      "Start Time",
      "Selected Tags",
      "Note",
      "Recording",
      "Submitted By User",
      "Picture Attachments"
    ];

    //Convert observations to CSV rows
    const rows = observations.map((obs: TeacherObservationData) => {
      // Helper function to safely convert to array/object and join
      const safeJoin = (value: unknown): string => {
        if (Array.isArray(value)) {
          return value.join(";");
        } else if (typeof value === 'object' && value !== null) {
          // If it's an object, extract all values that are arrays and flatten them
          const allValues: string[] = [];
          Object.values(value as Record<string, unknown>).forEach((v: unknown) => {
            if (Array.isArray(v)) {
              allValues.push(...v);
            }
          });
          return allValues.join(";");
        } else if (value) {
          return String(value);
        }
        return "";
      };

      return [
        obs.session_id,
        obs.student_id || "",
        obs.teacher_position || "",
        obs.start_time || "",
        safeJoin(obs.selected_tags),
        obs.note || "",
        obs.recording !== undefined ? obs.recording : "",
        obs.submitted_by_user !== undefined ? obs.submitted_by_user : "",
        obs.picture_attachments || ""
      ];
    });

    //Create CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
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
