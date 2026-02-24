import { API_BASE_URL } from "../config";
import type { StudentObservationData } from "./createStudentObservation";

//Calls server and retrieves all student observations for a given session
export async function getAllStudentObservationsForSession(sessionId: string | number): Promise<StudentObservationData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/observations/student/session/${sessionId}`);

    if (!response.ok) {
      //If session could not be found, alert console
      if (response.status === 404) {
        console.warn("Session not found");
        return [];
      }
      //throw error if unexpected error occurs either in server or in API call
      throw new Error("Failed to fetch student observations");
    }
    
    //Save and return collected data
    const data = await response.json();
    return data || [];

  } catch (error) {
    console.error("Error fetching student observations:", error);
    return [];
  }
}
