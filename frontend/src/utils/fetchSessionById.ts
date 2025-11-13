import { API_BASE_URL } from "../config";

export interface SessionData {
    session_id: string;
    observer_name: string;
    teacher_name: string;
    lesson_name: string;
    lesson_description: string;
    local_time: string;
    server_time: string;
    // Add any other fields your session might have
  }
  
  //Calls server and attempts to retrieve session information using session id
  export async function fetchSessionById(sessionId: string): Promise<SessionData | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`);
  
      if (!response.ok) {
        //If session could not be found, alert console
        if (response.status === 404) {
          console.warn("Session not found");
          return null;
        }
        //throw error if unexpected error occurs either in servr or in API call
        throw new Error("Failed to fetch session data");
      }
      
      //Save and return collected data
      const data: SessionData = await response.json();
      return data;
  
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  }
  