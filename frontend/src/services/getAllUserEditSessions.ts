import { API_BASE_URL } from "../config";
import { normalizeSessionData, type SessionData } from "./fetchSessionById";

//Calls server and retrieves all sessions the user has edit access to
export async function getAllUserEditSessions(userId: string | number): Promise<SessionData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions/edit`);

    if (!response.ok) {
      //If user could not be found, alert console
      if (response.status === 404) {
        console.warn("User not found");
        return [];
      }
      //throw error if unexpected error occurs either in server or in API call
      throw new Error("Failed to fetch user edit sessions");
    }
    
    //Save and return collected data
    const data = await response.json();
    return Array.isArray(data.sessions)
      ? data.sessions.map((session: Record<string, unknown>) => normalizeSessionData(session))
      : [];

  } catch (error) {
    console.error("Error fetching user edit sessions:", error);
    return [];
  }
}
