import { getAllStudentObservationsForSession } from "./getAllStudentObservationsForSession";
import type { StudentObservationData } from "./createStudentObservation";

//Exports student observations for a session to a CSV file
export async function exportStudentObservationsToCSV(sessionId: string | number): Promise<void> {
  try {
    //Fetch all student observations for the session
    const observations = await getAllStudentObservationsForSession(sessionId);

    if (observations.length === 0) {
      console.warn("No student observations found for this session");
      return;
    }

    //Define CSV headers
    const headers = [
      "Session ID",
      "Student ID",
      "On Task",
      "Behavior Tags",
      "Affect",
      "Custom Tags",
      "Note",
      "Recording",
      "Submitted By User",
      "Picture Attachments"
    ];

    //Convert observations to CSV rows
    const rows = observations.map((obs: StudentObservationData) => {
      // Helper function to safely convert to array and join
      const safeJoin = (value: any): string => {
        if (Array.isArray(value)) {
          return value.join(";");
        } else if (typeof value === 'object' && value !== null) {
          // If it's an object, extract all values that are arrays and flatten them
          const allValues: string[] = [];
          Object.values(value).forEach((v: any) => {
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
        obs.on_task !== undefined ? obs.on_task : "",
        safeJoin(obs.behavior_tags),
        safeJoin(obs.affect),
        safeJoin(obs.custom_tags),
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
    link.setAttribute("download", `student_observations_session_${sessionId}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Error exporting student observations to CSV:", error);
  }
}
