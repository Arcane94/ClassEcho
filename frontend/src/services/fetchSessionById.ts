import { API_BASE_URL } from "../config";

export interface SessionData {
    session_id: string;
    creator: number;
    teacher_name: string;
    lesson_name: string;
    lesson_description: string;
    local_time: string;
    server_time: string;
    join_code: string;
    student_id_numeric_only: boolean;
  }

  export function normalizeSessionData(data: Record<string, unknown>): SessionData {
    return {
      ...data,
      session_id: String(data.session_id ?? ""),
      creator: Number(data.creator ?? 0),
      teacher_name: String(data.teacher_name ?? ""),
      lesson_name: String(data.lesson_name ?? data.session_name ?? ""),
      lesson_description: String(data.lesson_description ?? ""),
      local_time: String(data.local_time ?? ""),
      server_time: String(data.server_time ?? ""),
      join_code: String(data.join_code ?? ""),
      student_id_numeric_only: Boolean(Number(data.student_id_numeric_only ?? 0)),
    } as SessionData;
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
      
      //Save and normalize collected data
      const data = await response.json();
      return normalizeSessionData(data as Record<string, unknown>);
  
    } catch (error) {
      console.error("Error fetching session:", error);
      return null;
    }
  }
  
