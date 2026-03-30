import { API_BASE_URL } from "../config";
import type { TeacherObservationData } from "./createTeacherObservation";

//Calls server and retrieves all teacher observations for a given session
export async function getAllTeacherObservationsForSession(sessionId: string | number): Promise<TeacherObservationData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/observations/teacher/session/${sessionId}`);

    if (!response.ok) {
      //If session could not be found, alert console
      if (response.status === 404) {
        console.warn("Session not found");
        return [];
      }
      //throw error if unexpected error occurs either in server or in API call
      throw new Error("Failed to fetch teacher observations");
    }
    
    //Save and return collected data
    const data = await response.json();
    return data || [];

  } catch (error) {
    console.error("Error fetching teacher observations:", error);
    return [];
  }
}
