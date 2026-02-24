import { API_BASE_URL } from "../config";
import type { SessionData } from "./fetchSessionById";

//Calls server and retrieves all sessions associated with a user's account
export async function getAllUserSessions(userId: string | number): Promise<SessionData[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/user/${userId}/sessions/all`);

    if (!response.ok) {
      //If user could not be found, alert console
      if (response.status === 404) {
        console.warn("User not found");
        return [];
      }
      //throw error if unexpected error occurs either in server or in API call
      throw new Error("Failed to fetch user sessions");
    }
    
    //Save and return collected data
    const data = await response.json();
    return data.sessions || [];

  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return [];
  }
}
